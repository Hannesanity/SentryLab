from flask import Flask, render_template, jsonify, request
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import zscore, mode
import numpy as np
import json
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from itertools import product
from nltk.stem import WordNetLemmatizer
import datetime as dt
from datetime import datetime, timedelta
import statsmodels.api as sm
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
import seaborn as sns


app = Flask(__name__)

inventory_df = pd.read_csv("datasets/Inventory.csv")
borrower_df = pd.read_csv("datasets/BorrowerSlip.csv")
calibration_df = pd.read_csv("datasets/Calibration.csv")
ml_df = pd.read_csv("datasets/Predictions.csv")

# Initialize the lemmatizer
lemmatizer = WordNetLemmatizer()


# Preparation of Datetime
if not pd.api.types.is_datetime64_any_dtype(borrower_df['DATETIME BORROWED']):
    borrower_df['DATETIME BORROWED'] = pd.to_datetime(borrower_df['DATETIME BORROWED'], errors='coerce')

if not pd.api.types.is_datetime64_any_dtype(borrower_df['DATETIME RETURNED']):
    borrower_df['DATETIME RETURNED'] = pd.to_datetime(borrower_df['DATETIME RETURNED'], errors='coerce')

# Train models


# Convert date columns to datetime objects
borrower_df['DATE'] = pd.to_datetime(borrower_df['DATE'])
borrower_df['DATE RETURNED'] = pd.to_datetime(borrower_df['DATE RETURNED'])


calibration_df['Calibration Date'] = pd.to_datetime(calibration_df['Calibration Date'], dayfirst=True, errors='coerce')
calibration_df['Calibration Due'] = pd.to_datetime(calibration_df['Calibration Due'], dayfirst=True, errors='coerce')

def convert_frequency_to_numerical(freq):
    if freq == 'Annual':
        return 1
    elif freq == 'Bi-annual':
        return 2
    elif freq == 'Quarter':
        return 4
    else:
        return np.nan  # Handle unexpected frequency values

def predict_calibration_date(last_known_calibration, frequency):
    if pd.isnull(last_known_calibration) or last_known_calibration < current_date:
        # If no records exist or the last known calibration is in the past, schedule the next calibration for one year from the current date
        return current_date + pd.DateOffset(years=1)
    else:
        # If the last known calibration is in the future, use that date
        return last_known_calibration

def calculate_depreciation_date(first_borrow_date, estimated_useful_life):
    try:
        # Convert estimated useful life to an integer if possible
        years = int(estimated_useful_life)
        return first_borrow_date + pd.DateOffset(years=years)
    except ValueError:
        # Handle cases where conversion to integer is not possible
        return pd.NaT  # Return 'Not a Time' for missing or invalid data


# Group by 'UniqueID'
grouped = borrower_df.groupby('UniqueID')

# Calculate usage frequency
usage_frequency = grouped.size()

# Calculate total duration of use
total_duration = grouped['TOTAL DURATION'].sum()

# Calculate the first borrow date
first_borrow_date = grouped['DATE'].min()

# Calculate average duration per use
average_duration = grouped['TOTAL DURATION'].mean()

# Calculate time since last use
most_recent_use = grouped['DATE RETURNED'].max()
current_date = pd.to_datetime('today')
time_since_last_use = current_date - most_recent_use

# Combine into a single DataFrame
training_df = pd.DataFrame({
    'UniqueID': usage_frequency.index,
    'UsageFrequency': usage_frequency.values,
    'TotalDuration': total_duration.values,
    'AverageDuration': average_duration.values,
    'TimeSinceLastUse': time_since_last_use.values,
    'FirstBorrowDate': first_borrow_date.values  # Add this line to include 'FirstBorrowDate'
})

# Calculate current age in years
training_df['CurrentAge'] = (current_date - training_df['FirstBorrowDate']).dt.days / 365.25

inventory_df['NumericalFrequency'] = inventory_df['FREQUENCY'].apply(convert_frequency_to_numerical)
# Merge the numerical frequency into the maintenance DataFrame
training_df = training_df.merge(inventory_df[['UniqueID', 'NumericalFrequency']], on='UniqueID', how='left')


# Merge the inventory DataFrame to include 'EstimatedUsefulLife'
training_df = training_df.merge(inventory_df[['UniqueID', 'Estimated Useful Life']], on='UniqueID', how='left')

# Calculate Remaining Useful Life
training_df['RemainingUsefulLife'] = training_df['Estimated Useful Life'] - training_df['CurrentAge']

# Ensure the RUL is not negative
training_df['RemainingUsefulLife'] = training_df['RemainingUsefulLife'].clip(lower=0)

training_df['TimeSinceLastUse'] = training_df['TimeSinceLastUse'].dt.total_seconds() / (24 * 3600)


# Merge the calibration DataFrame to include 'Calibration Due'
training_df = training_df.merge(calibration_df[['UniqueID', 'Calibration Due']], on='UniqueID', how='left')

# Predict Next Calibration Date based on 'Calibration Due'
training_df['NextCalibrationDate'] = training_df.apply(
    lambda row: predict_calibration_date(row['Calibration Due'], row['NumericalFrequency']),
    axis=1
)

training_df['NextCalibrationDate'] = pd.to_datetime(training_df['NextCalibrationDate'], errors='coerce')

# Calculate 'NextMaintenanceDate' based on 'NumericalFrequency'
training_df['NumericalFrequency'].fillna(1, inplace=True)

training_df['NextMaintenanceDate'] = training_df.apply(
    lambda row: (current_date + pd.DateOffset(days=(365 / row['NumericalFrequency']))).date(),
    axis=1
)


# Determine Depreciation Date
training_df['DepreciationDate'] = training_df.apply(
    lambda row: calculate_depreciation_date(row['FirstBorrowDate'], row['Estimated Useful Life']),
    axis=1
)

training_df.drop_duplicates(subset='UniqueID', inplace=True)


def MLR_Train():
    # Exclude 'FirstBorrowDate' and 'UniqueID' from the regression model input
    regression_columns = ['UsageFrequency', 'TotalDuration', 'AverageDuration', 'TimeSinceLastUse', 'CurrentAge', 'Estimated Useful Life']

    # Define your features (X) and target variable (y)
    X = training_df[regression_columns]
    y = training_df['RemainingUsefulLife']

    # Add a constant to the model (intercept)
    X = sm.add_constant(X)

    # Exclude rows with nan values in the features and the target variable
    mlr_df = training_df.dropna(subset=regression_columns + ['RemainingUsefulLife'])

    mlr_df = mlr_df.merge(training_df[['UniqueID', 'NextCalibrationDate', 'NextMaintenanceDate', 'DepreciationDate']], on='UniqueID', how='left')

    # Define your features (X) and target variable (y) with the cleaned data
    X_cleaned = mlr_df[regression_columns]
    y_cleaned = mlr_df['RemainingUsefulLife']

    # Add a constant to the model (intercept)
    X_cleaned = sm.add_constant(X_cleaned)
    # Fit the MLR model with the cleaned data
    model_cleaned = sm.OLS(y_cleaned, X_cleaned).fit()

    # Use the model to make predictions with the cleaned data
    predictions_cleaned = model_cleaned.predict(X_cleaned)

    # Add the predictions to the cleaned DataFrame
    mlr_df['PredictedRUL'] = predictions_cleaned

    # Print the DataFrame with the predictions
    print(mlr_df[['UniqueID', 'PredictedRUL']])

    # Save the DataFrame with the predictions to a CSV file
    mlr_df[['UniqueID', 'PredictedRUL']].to_csv('predicted_rul.csv', index=False)

    # Calculate MAE and RMSE
    mae = mean_absolute_error(y_cleaned, predictions_cleaned)
    rmse = np.sqrt(mean_squared_error(y_cleaned, predictions_cleaned))

    # Print MAE and RMSE
    print(f'Mean Absolute Error (MAE): {mae}')
    print(f'Root Mean Squared Error (RMSE): {rmse}')

    # Save MAE and RMSE to a CSV file
    performance_metrics = pd.DataFrame({
        'MAE': [mae],
        'RMSE': [rmse]
    })
    performance_metrics.to_csv('performance_metrics.csv', index=False)

    predictions_cleaned = model_cleaned.predict(X_cleaned)

    # Add the predictions to the cleaned DataFrame
    mlr_df['PredictedRUL'] = predictions_cleaned
    mlr_df['HealthPercentage'] = (mlr_df['PredictedRUL'] / mlr_df['Estimated Useful Life']) * 100

    # Ensure the health percentage is not greater than 100%
    mlr_df['HealthPercentage'] = mlr_df['HealthPercentage'].clip(upper=100)

    # Print the DataFrame with the health percentage
    print(mlr_df[['UniqueID', 'PredictedRUL', 'HealthPercentage']])
    # Calculate MAE and RMSE
    mae = mean_absolute_error(y_cleaned, predictions_cleaned)
    rmse = np.sqrt(mean_squared_error(y_cleaned, predictions_cleaned))
    r_squared = model_cleaned.rsquared
    f_statistic = model_cleaned.fvalue
    p_value = model_cleaned.f_pvalue

    # Add MAE and RMSE to the cleaned DataFrame
    # Add MAE, RMSE, R-squared, and F-statistic to the cleaned DataFrame
    mlr_df['MAE'] = mae
    mlr_df['RMSE'] = rmse
    mlr_df['R-squared'] = r_squared
    mlr_df['F-statistic'] = f_statistic
    # Print the updated DataFrame
    print(mlr_df[['UniqueID', 'MAE', 'RMSE', 'R-squared', 'F-statistic']])
    mlr_df = mlr_df[[col for col in mlr_df.columns if not col.endswith('_y')]]

    # Rename columns to remove '_x' suffix
    mlr_df.rename(columns=lambda x: x.rstrip('_x'), inplace=True)

    residuals = y_cleaned - model_cleaned.predict(X_cleaned)

    # Save the complete DataFrame with the predictions and performance metrics to a CSV file
    mlr_df.to_csv('datasets/MLR1 health complete.csv', index=False)

    pass

def SVR_Train():

    # Exclude 'FirstBorrowDate' and 'UniqueID' from the regression model input
    regression_columns = [
        'UsageFrequency', 'TotalDuration', 'AverageDuration',
        'TimeSinceLastUse', 'CurrentAge', 'NumericalFrequency',
        'Estimated Useful Life'
    ]
    # Define your features (X) and target variable (y)
    X = training_df[regression_columns]
    y = training_df['RemainingUsefulLife']

    # Add a constant to the model (intercept)
    X = sm.add_constant(X)

    # Exclude rows with nan values in the features and the target variable
    svr_df = training_df.dropna(subset=regression_columns + ['RemainingUsefulLife'])

    X_cleaned = svr_df[regression_columns]
    y_cleaned = svr_df['RemainingUsefulLife']

    # Initialize the SVR model
    svr_model = SVR(kernel='linear')  # You can choose different kernels such as 'linear', 'poly', 'rbf', etc.

    # Train the SVR model
    svr_model.fit(X_cleaned, y_cleaned)

    # Use the model to make predictions with the cleaned data
    svr_predictions = svr_model.predict(X_cleaned)

    # Add the predictions to the cleaned DataFrame
    svr_df.loc[:, 'PredictedRUL'] = svr_predictions
    svr_df.loc[:, 'EquipmentHealth'] = (svr_df['PredictedRUL'] / svr_df['Estimated Useful Life']) * 100

    # Ensure the Equipment Health percentage is between 0 and 100
    svr_df['EquipmentHealth'] = svr_df['EquipmentHealth'].clip(lower=0, upper=100)
    # Calculate MAE and RMSE for the SVR model
    svr_mae = mean_absolute_error(y_cleaned, svr_predictions)
    svr_rmse = np.sqrt(mean_squared_error(y_cleaned, svr_predictions))
    svr_r2 = r2_score(y_cleaned, svr_predictions)


    # Add MAE and RMSE to the cleaned DataFrame
    svr_df['MAE'] = svr_mae
    svr_df['RMSE'] = svr_rmse
    svr_df['R-squared'] = svr_r2

    print(svr_mae)
    print(svr_rmse)
    print(svr_r2)


    # Save the complete DataFrame with the predictions and performance metrics to a CSV file
    svr_df.to_csv('datasets/SVR1 Complete.csv', index=False)


    pass

def KNN_Train():
    regression_columns = [
        'UsageFrequency', 'TotalDuration', 'AverageDuration',
        'TimeSinceLastUse', 'CurrentAge', 'NumericalFrequency',
        'Estimated Useful Life'
    ]



    # Extract features (X) and target (y)
    X = training_df[regression_columns]
    y = training_df['RemainingUsefulLife'].fillna(0)

    # Handle missing values
    imputer = SimpleImputer(strategy='mean')
    X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)

    # Scale the features
    scaler = StandardScaler()
    X_scaled = pd.DataFrame(scaler.fit_transform(X_imputed), columns=X_imputed.columns)

    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

    # Initialize the KNN Regressor with an appropriate number of neighbors
    knn_regressor = KNeighborsRegressor(n_neighbors=5)

    # Train the model using the training data
    knn_regressor.fit(X_train, y_train)

    # Make predictions on the test data
    y_pred = knn_regressor.predict(X_test)

    # Calculate performance metrics
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    # Print performance metrics
    print(f'Mean Absolute Error (MAE): {mae}')
    print(f'Root Mean Squared Error (RMSE): {rmse}')
    print(f'R-squared: {r2}')

    full_predictions = knn_regressor.predict(X_scaled)

    # Assign the full set of predictions to the DataFrame
    training_df['PredictedRUL'] = full_predictions

    # Calculate Equipment Health as a percentage of the Estimated Useful Life
    training_df['Equipment Health'] = (training_df['PredictedRUL'] / training_df['Estimated Useful Life']) * 100

    # Ensure the Equipment Health percentage is between 0 and 100
    training_df['Equipment Health'] = training_df['Equipment Health'].clip(lower=0, upper=100)

    # Save the DataFrame with the predictions and Equipment Health to a CSV file
    training_df.to_csv('datasets/KNN Complete.csv', index=False)

    pass

def combine_models():
    df1 = pd.read_csv('datasets/MLR1 health complete.csv')
    df2 = pd.read_csv('datasets/KNN Complete.csv')
    df3 = pd.read_csv('datasets/SVR1 Complete.csv')


    # Assuming 'UniqueID' is the common identifier
    # Select and rename the relevant columns for each DataFrame
    df1_selected = df1[['UniqueID', 'NextMaintenanceDate', 'DepreciationDate', 'PredictedRUL', 'HealthPercentage']].rename(
        columns={
            'NextMaintenanceDate': 'NextMaintenanceDate_MLR',
            'DepreciationDate': 'DepreciationDate_MLR',
            'PredictedRUL': 'PredictedRUL_MLR',
            'HealthPercentage': 'EquipmentHealth_MLR'
        }
    )

    df2_selected = df2[['UniqueID', 'NextMaintenanceDate', 'DepreciationDate', 'PredictedRUL', 'Equipment Health']].rename(
        columns={
            'NextMaintenanceDate': 'NextMaintenanceDate_KNN',
            'DepreciationDate': 'DepreciationDate_KNN',
            'PredictedRUL': 'PredictedRUL_KNN',
            'Equipment Health': 'EquipmentHealth_KNN'
        }
    )

    df3_selected = df3[['UniqueID', 'NextMaintenanceDate', 'DepreciationDate', 'PredictedRUL', 'EquipmentHealth']].rename(
        columns={
            'NextMaintenanceDate': 'NextMaintenanceDate_SVR',
            'DepreciationDate': 'DepreciationDate_SVR',
            'PredictedRUL': 'PredictedRUL_SVR',
            'EquipmentHealth': 'EquipmentHealth_SVR'
        }
    )

    # Merge the selected columns from each DataFrame on 'UniqueID'
    merged_predictions = df1_selected.merge(df2_selected, on='UniqueID').merge(df3_selected, on='UniqueID')

    # Save the merged predictions to a CSV file
    merged_predictions.to_csv('datasets/Predictions.csv', index=False)


# Calculating Statistics


def calculate_room():
    borrower_df['DATE'] = pd.to_datetime(borrower_df['DATE'], dayfirst=True, errors='coerce')
    borrower_df['DATE RETURNED'] = pd.to_datetime(borrower_df['DATE RETURNED'], dayfirst=True, errors='coerce')
    borrower_df['MONTH'] = borrower_df['DATE'].dt.month
    borrower_df['DAY OF WEEK'] = borrower_df['DATE'].dt.dayofweek
    # Add maintenance frequency based on your criteria (placeholder values)
    name_to_frequency = dict(zip(inventory_df['Name'], inventory_df['FREQUENCY']))
    name_to_room = dict(zip(inventory_df['Name'], inventory_df['Room']))
    name_to_mainte = dict(zip(inventory_df['Name'], inventory_df['MAINTENANCE TYPE']))


    # Room Statistics
    # Group by 'Room' and 'DATETIME BORROWED' by month (or another time interval)
    time_series_data = borrower_df.groupby(['EQUIPMENT NAME', borrower_df['DATETIME BORROWED'].dt.to_period('M')]).agg({
        'QUANTITY': 'sum',
        'TOTAL DURATION': 'sum',

         # Assuming 'USAGE DURATION' > 24 indicates a late return
    }).rename(columns={
        'QUANTITY': 'Frequency',
        'TOTAL DURATION': 'Duration Sum',
        'Late Return': 'Late Returns'
    }).reset_index()

    time_series_data['Room'] = time_series_data['EQUIPMENT NAME'].map(name_to_room).fillna('Others')

    time_series_data['Average Duration Per Use'] = time_series_data['Duration Sum'] / time_series_data['Frequency']

    # Convert the 'DATETIME BORROWED' period back to datetime for plotting
    time_series_data['DATETIME BORROWED'] = time_series_data['DATETIME BORROWED'].dt.to_timestamp()

    time_series_data.to_json('static/room_stats.json', orient='records', indent=4)
    # Overall Statistics
    

    # EQUIPMENT NAME STATS
    # Calculate the statistics
    
    eqgroup = borrower_df.groupby('EQUIPMENT NAME')
    name_list = list(eqgroup.groups.keys())
    quantity_sum = eqgroup['QUANTITY'].sum()
    
    correlations = []
    outliers = []
    last_used_dates = []
    first_used_dates = []
    last_borrow_dates = []
    first_borrow_dates = []

    
    for name, group in eqgroup:   
        # Calculate the z-scores of the 'Total Duration'
        z_scores = zscore(group['TOTAL DURATION'])

        correlation = group['QUANTITY'].corr(group['TOTAL DURATION'])
        if pd.isnull(correlation):
            correlation = 'N/A'  # or some other placeholder value
        correlations.append(correlation)

        # Identify outliers
        # Instead of calculating z-scores for outliers, directly check for borrowings more than 7 days
        outlier = group[group['DAYS DURATION'] > 7].shape[0]
        
        outliers.append(outlier)

        # Get the last used date
        last_borrow_date = group['DATE'].max()
        last_borrow_dates.append(last_borrow_date)

        first_borrow_date = group['DATE'].min()
        first_borrow_dates.append(first_borrow_date)

        # Get the last used date
        last_used_date = group['DATE RETURNED'].max()
        last_used_dates.append(last_used_date)

        first_used_date = group['DATE RETURNED'].min()
        first_used_dates.append(first_used_date)

        range_duration = group['TOTAL DURATION'].max() - group['TOTAL DURATION'].min()

    def get_most_frequent_day(x):
        if pd.api.types.is_datetime64_any_dtype(x['DATE']):
            return x['DATE'].dt.day_name().mode()[0]
        else:
            return 'N/A'
    
    
    def get_most_frequent_month(x):
        if pd.api.types.is_datetime64_any_dtype(x['DATE']):
            return x['DATE'].dt.month_name().mode()[0]
        else:
            return 'N/A'

    frequency = eqgroup.size()
    total_duration = eqgroup['TOTAL DURATION'].sum()
    average_duration = eqgroup['TOTAL DURATION'].mean()
    max_duration = eqgroup['TOTAL DURATION'].max()
    min_duration = eqgroup['TOTAL DURATION'].min()
    median_duration = eqgroup['TOTAL DURATION'].median()
    std_dev_duration = eqgroup['TOTAL DURATION'].std()
    unique_dates = eqgroup['DATE'].nunique()
    most_frequent_day = eqgroup.apply(get_most_frequent_day)
    most_frequent_month = eqgroup.apply(get_most_frequent_month)
    # Create a new column 'Late Return' indicating whether the return is late (duration > 24 hours)
    borrower_df['Late Return'] = borrower_df['TOTAL DURATION'] > 24
    current_date = datetime.now()
    

    # Count the number of late returns per UniqueID
    late_return = borrower_df.groupby('EQUIPMENT NAME')['Late Return'].sum()
    # Create a new DataFrame with the statistics
    eqstats_df = pd.DataFrame({
        'Equipment Name': name_list,  # Get the first 'EQUIPMENT NAME' from each group
        'Frequency': frequency,
        'Total Quantity': quantity_sum,
        'Total Duration': total_duration,
        'Average Duration': average_duration,
        'Max Duration': max_duration,
        'Min Duration': min_duration,
        'Correlation': correlations,
        'Outliers': outliers,
        'Late Return': late_return,
        'Last Return Date': last_used_dates,
        'First Return Date': first_used_dates,
        'Last Borrow Date': last_borrow_dates,
        'First Borrow Date': first_borrow_dates,
        'Median Duration': median_duration,
        'Standard Deviation Duration': std_dev_duration,
        'Unique Dates': unique_dates,
        'Most Frequent Day': most_frequent_day,
        'Range Duration': range_duration,
        'Most Frequent Month': most_frequent_month
    })

    inventory_counts = inventory_df.groupby('Name').agg(Quantity=('UniqueID', 'nunique')).reset_index()
    
    eqstats_df['Room'] = eqstats_df['Equipment Name'].map(name_to_room).fillna('Others')
    eqstats_df['Status'] = eqstats_df['Last Borrow Date'].apply(lambda x: 'Inactive' if (current_date - x) > timedelta(days=365) else 'Active')
    # Update the 'Maintenance Frequency' in eqstats_df based on the Equipment Names
    eqstats_df['Maintenance Type'] = eqstats_df['Equipment Name'].map(name_to_mainte).fillna('Unknown')
    eqstats_df['Maintenance Frequency'] = eqstats_df['Equipment Name'].map(name_to_frequency).fillna('Unknown')
    

    eqavg_duration = eqstats_df['Average Duration'].mean()
    LATE_RETURN_THRESHOLD = 5  # Number of late returns to be considered 'too much'
    MAINTENANCE_THRESHOLD_DAYS = 180

    def eq_interpretation(row):
        today = datetime.today()
        interpretations = []

        equipment_name = row['Equipment Name']  # Get the equipment name from the row

        # Average Duration Interpretation
        if row['Average Duration'] > eqavg_duration:
            interpretations.append(f"{equipment_name} is typically used for longer periods, suggesting it's essential for extended projects.")
        elif row['Average Duration'] < eqavg_duration:
            interpretations.append(f"{equipment_name} is often returned quicker than average, implying it's suited for shorter tasks or is highly efficient.")
        else:
            interpretations.append(f"{equipment_name}'s usage duration aligns with the average, indicating typical usage patterns.")

        # Duration Range Interpretation
        if row['Max Duration'] != row['Min Duration']:
            interpretations.append(f"It's been borrowed for durations as short as {row['Min Duration']} hours to as long as {row['Max Duration']} hours, indicating a wide range of uses.")
        else:
            interpretations.append("This equipment has a consistent borrowing duration each time, suggesting stable and predictable usage.")

        # Median Duration Interpretation
        interpretations.append(f"The most common borrowing duration is approximately {row['Median Duration']} hours, providing a snapshot of typical use.")

        # Usage Frequency Interpretation
        if row['Unique Dates'] > 1:
            interpretations.append(f"It's been used on {row['Unique Dates']} different days, often on {row['Most Frequent Day']}s and typically in {row['Most Frequent Month']}, highlighting peak usage times.")
        else:
            interpretations.append("This piece of equipment has been used only once, indicating it's specialized or infrequently needed.")

        # Correlation Interpretation
        if 'Correlation' in row and row['Correlation'] != 'N/A':
            interpretations.append(f"A correlation of {row['Correlation']:.2f} between frequency and duration of use suggests a consistent pattern.")
        else:
            interpretations.append("No significant correlation between how frequently and how long it's borrowed indicates diverse applications.")

        # Late Return Interpretation
        if 'Late Return' in row:
            if row['Late Return'] > LATE_RETURN_THRESHOLD:
                interpretations.append(f"Note: it has been returned late over {LATE_RETURN_THRESHOLD} times, suggesting a need to revisit borrowing terms.")
            elif row['Late Return'] > 0:
                interpretations.append("It has a few instances of late return, but they are not overly frequent.")
            else:
                interpretations.append("Excellent record with no late returns.")

        # Outliers Interpretation
        if 'Outliers' in row and row['Outliers'] > 0:
            interpretations.append(f"Observation of {row['Outliers']} outliers in borrowing durations might indicate exceptional cases worth further investigation.")
        else:
            interpretations.append("No outliers in borrowing durations, indicating consistent use patterns.")

        return ' '.join(interpretations)

    # Apply the interpretation function to each row in the DataFrame
    eqstats_df['Overall Interpretation'] = eqstats_df.apply(eq_interpretation, axis=1)
        
        
    
    # Add a 'Quarter' column to borrower_df with the quarter number for each borrowing instance
    borrower_df['Quarter'] = borrower_df['DATETIME BORROWED'].dt.to_period('Q').dt.quarter

    # Group by 'Equipment Name' and 'Quarter' and sum the 'Total Duration'
    quarterly_usage = borrower_df.groupby(['EQUIPMENT NAME', 'Quarter'])['TOTAL DURATION'].sum().reset_index()

    # Calculate peak quarters by finding the quarter with the maximum Total Duration for each equipment
    peak_quarters = quarterly_usage.loc[quarterly_usage.groupby('EQUIPMENT NAME')['TOTAL DURATION'].idxmax()]

    # If you want to identify if the usage is fairly even across quarters
    threshold = 0.1  # Define a threshold for what you consider 'fair'
    peak_quarters.rename(columns={'Quarter': 'Peak Quarter'}, inplace=True)

    # Then, ensure that the 'Is Fair' calculation is correct
    quarterly_usage['Is Fair'] = quarterly_usage.groupby('EQUIPMENT NAME')['TOTAL DURATION'].transform(
        lambda x: (x.max() - x.min()) / x.max() < threshold
    )

    # Now merge 'peak_quarters' into 'eqstats_df'
    eqstats_df = eqstats_df.merge(peak_quarters[['EQUIPMENT NAME', 'Peak Quarter']], on='EQUIPMENT NAME', how='left')

    # Merge the 'Is Fair' column into 'eqstats_df'. Ensure that the merge is on 'EQUIPMENT NAME'
    # and that the column exists in 'quarterly_usage' with the same name.
    eqstats_df = eqstats_df.merge(
        quarterly_usage[['EQUIPMENT NAME', 'Is Fair']].drop_duplicates('EQUIPMENT NAME'),
        on='EQUIPMENT NAME',
        how='left'
    )
    eqstats_df = eqstats_df.merge(inventory_counts, left_on='Equipment Name', right_on='Name', how='left')

    # Drop duplicates from the 'equipment_stats' DataFrame to ensure each equipment name is unique
    eqstats_df.drop_duplicates(subset='Equipment Name', inplace=True)
    eqstats_df = eqstats_df.drop(columns=['EQUIPMENT NAME', 'Name'])

    eqstats_df.to_json('static/eqstats.json', orient='records', indent=4)
    
    room_stats = eqstats_df.groupby('Room').agg({
        'Frequency': 'sum',
        'Total Duration': 'sum',
        'Average Duration': 'mean',
        'Max Duration': 'max',
        'Min Duration': 'min',
        'Median Duration': 'median',
        'Standard Deviation Duration': 'mean',  # or you can use a different aggregation function
        'Unique Dates': 'sum',
        'Equipment Name': 'nunique'  # Count unique equipment names directly here
    }).rename(columns={'Equipment Name': 'Equipment Count'}).reset_index()

    
    # Check if the peak quarter is within 1-4
    eqstats_df['Peak Quarter'] = eqstats_df['Peak Quarter'].astype(int)

    # Define a function to count the occurrences of each peak quarter
    def count_peak_quarters(group):
        counts = group['Peak Quarter'].value_counts().reindex([1, 2, 3, 4], fill_value=0)
        return pd.Series({
            'Q1 Count': counts.get(1, 0),
            'Q2 Count': counts.get(2, 0),
            'Q3 Count': counts.get(3, 0),
            'Q4 Count': counts.get(4, 0)
        })

    # Group by 'Room' and apply the function to count peak quarters
    room_peak_counts = eqstats_df.groupby('Room').apply(count_peak_quarters).reset_index()

    # Merge the peak quarter counts with the room_stats DataFrame
    room_stats = room_stats.merge(room_peak_counts, on='Room', how='left')

    # Fill NaN values with 0 for rooms that had no equipment usage in certain quarters
    room_stats.fillna(0, inplace=True)

    # Now, calculate the overall stats.
    overall_stats = room_stats.drop(columns='Room').sum().to_dict()
    overall_stats['Room'] = 'Overall'

    # Adding peak quarter counts for the 'Overall' stats
    for quarter in ['Q1 Count', 'Q2 Count', 'Q3 Count', 'Q4 Count']:
        overall_stats[quarter] = room_stats[quarter].sum()

    # Convert the overall stats to a DataFrame
    overall_stats_df = pd.DataFrame([overall_stats])

    # Concatenate this to the end of your room_stats DataFrame
    final_stats_df = pd.concat([room_stats, overall_stats_df], ignore_index=True)

    # Save to JSON file
    final_stats_df.to_json('static/overall_stats.json', orient='records', indent=4)

    
    sched_df = pd.merge(inventory_df, ml_df, on='UniqueID', how='left')
    sched_df.to_json('static/sched.json', orient='records', indent=4)

    pass

def calculate_equipment():
        # Group the data by unique ID
    grouped = borrower_df.groupby('UniqueID')

    unique_ids_list = list(grouped.groups.keys())
    correlations = []
    outliers = []
    last_used_dates = []
    first_used_dates = []
    last_borrow_dates = []
    first_borrow_dates = []

    all_days_of_week = list(range(7))  # 0 to 6
    all_hours_of_day = list(range(7, 18))  # 7 AM to 5 PM

    borrower_df['DATE'] = pd.to_datetime(borrower_df['DATE'], dayfirst=True, errors='coerce')
    borrower_df['DATE RETURNED'] = pd.to_datetime(borrower_df['DATE RETURNED'], dayfirst=True, errors='coerce')
    borrower_df['MONTH'] = borrower_df['DATE'].dt.month
    borrower_df['DAY OF WEEK'] = borrower_df['DATE'].dt.dayofweek
    borrower_df['YEAR'] = borrower_df['DATE'].dt.year

    # Convert 'TIME BORROWED' and 'TIME RETURNED' to datetime and extract 'HOUR'
    borrower_df['HOUR BORROWED'] = pd.to_datetime(borrower_df['TIME BORROWED']).dt.hour
    borrower_df['HOUR RETURNED'] = pd.to_datetime(borrower_df['TIME RETURNED']).dt.hour

    # Calculate the total available time for the year (adjust based on actual available time)
    total_available_time = 24 * 5 * 4
    current_year = datetime.now().year
    years_list = list(range(2018, current_year + 1))

    def generate_yearly_interpretation(row, df):
        yearly_int = []
        year_name = row['YEAR']
        yearly_int.append(f"Year {year_name}:\n")

        # First year in the dataset
        min_year = df['YEAR'].min()
        if year_name == min_year:
            yearly_int.append("This year marks the beginning of available data, setting a baseline for future comparisons.\n")
            yearly_int.append(f"Initial operations count: {row['FREQUENCY']} occurrences.\n")
            yearly_int.append(f"Yearly utilization begins at {row['YEAR UTILIZATION']:.2f}% of total capacity.\n")

        if row['FREQUENCY'] > 0:
            # Finding data from the previous year to compare changes
            prev_year = year_name - 1
            prev_year_data = df[(df['UniqueID'] == row['UniqueID']) & (df['YEAR'] == prev_year)]
            if not prev_year_data.empty:
                prev_year_data = prev_year_data.iloc[0]
                change_in_utilization = row['YEAR UTILIZATION'] - prev_year_data['YEAR UTILIZATION']
                change_in_duration = row['TOTAL DURATION'] - prev_year_data['TOTAL DURATION']

                yearly_int.append("Year-over-year changes:\n")
                yearly_int.append(f"- Duration changed by {change_in_duration:.2f} hours.\n")
                yearly_int.append(f"- Utilization changed by {change_in_utilization:.2f}%.\n")

                if change_in_duration > 0:
                    yearly_int.append("Increased activity this year suggests higher usage or expanded operations.\n")
                elif change_in_duration < 0:
                    yearly_int.append("Decreased activity might reflect lower demand or operational efficiency improvements.\n")

                if change_in_utilization > 0:
                    yearly_int.append("Higher utilization indicates increased demand or more efficient use of resources.\n")
                elif change_in_utilization < 0:
                    yearly_int.append("Reduced utilization could suggest a drop in demand or availability issues.\n")
            else:
                yearly_int.append("No comparative data available from the previous year.\n")
        else:
            yearly_int.append("No activity was recorded this year, which may indicate the equipment was out of service, not needed, or under maintenance.\n")

        return ''.join(yearly_int)


    unique_ids = borrower_df['UniqueID'].unique()
    all_days_of_week = list(range(7))  # 0 to 6 for days of the week

    
    # Group by 'UniqueID' and 'YEAR' for yearly statistics with additional calculations
    yearly_stats_df = borrower_df.groupby(['UniqueID', 'YEAR']).agg({
        'TOTAL DURATION': ['sum', 'mean', 'min', 'max', 'size']  # Calculate sum, average, min, and max duration
    }).reset_index()

    # Flatten the MultiIndex columns created by the aggregation
    yearly_stats_df.columns = [' '.join(col).strip() for col in yearly_stats_df.columns.values]
 
    # Rename the columns for clarity
    yearly_stats_df.rename(columns={
        'TOTAL DURATION sum': 'TOTAL DURATION',
        'TOTAL DURATION mean': 'AVERAGE DURATION',
        'TOTAL DURATION min': 'MIN DURATION',
        'TOTAL DURATION max': 'MAX DURATION',
        'TOTAL DURATION size': 'FREQUENCY'
    }, inplace=True)

    complete_yearly_df = pd.DataFrame(list(product(unique_ids_list, years_list)), columns=['UniqueID', 'YEAR'])

    # Merge the complete DataFrame with 'yearly_stats_df' to include missing years
    yearly_stats_df = pd.merge(complete_yearly_df, yearly_stats_df, on=['UniqueID', 'YEAR'], how='left').fillna(0)

    # Calculate the yearly utilization percentage
    yearly_stats_df['YEAR UTILIZATION'] = (yearly_stats_df['TOTAL DURATION'] / (8 * 5 * 52)) * 100

    yearly_stats_df['Yearly Interpretation'] = yearly_stats_df.apply(lambda row: generate_yearly_interpretation(row, yearly_stats_df), axis=1)

    # Convert the updated yearly DataFrame to JSON
    yearly_usage_json = yearly_stats_df.to_json(orient='records', date_format='iso', indent=4)

    # Create a DataFrame with all combinations of 'UniqueID' and 'MONTH'
    complete_monthly_df = pd.DataFrame(list(product(unique_ids_list, range(1, 13))),
                                    columns=['UniqueID', 'MONTH'])

    # Group by 'UniqueID' and 'MONTH' to calculate monthly statistics and frequency
    monthly_stats_df = borrower_df.groupby(['UniqueID', 'MONTH']).agg({
        'TOTAL DURATION': ['sum', 'mean', 'min', 'max', 'size']  # Include 'size' for frequency
    }).reset_index()

    def generate_monthly_interpretation(row, df):
        month_names = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"]
        
        monthly_int = []

        month_name = month_names[row['MONTH'] - 1]
        monthly_int.append(f"{month_name}\n")

        if row['FREQUENCY'] > 0:
            # Start of the year context
            if row['MONTH'] == 1:
                monthly_int.append("January marks the beginning of the year, setting the pace for the upcoming months.\n")
            monthly_int.append(f"Activities recorded: {row['FREQUENCY']} times.\n")
            monthly_int.append(f"Total duration: {row['TOTAL DURATION']:.2f} hours with an average session lasting {row['AVERAGE DURATION']:.2f} hours.\n")
            monthly_int.append(f"Monthly utilization: {row['MONTH UTILIZATION']:.2f}% of capacity utilized.\n")

            # Attempt to find previous month's data for comparison
            prev_month = row['MONTH'] - 1
            if prev_month > 0:  # Ensure it does not go to the previous year
                prev_month_data = df[(df['UniqueID'] == row['UniqueID']) & (df['MONTH'] == prev_month)]
                if not prev_month_data.empty:
                    prev_month_data = prev_month_data.iloc[0]
                    change_in_utilization = row['MONTH UTILIZATION'] - prev_month_data['MONTH UTILIZATION']
                    change_in_duration = row['TOTAL DURATION'] - prev_month_data['TOTAL DURATION']
                    
                    monthly_int.append("Changes from the last month:\n")
                    monthly_int.append(f"- Duration changed by {change_in_duration:.2f} hours.\n")
                    monthly_int.append(f"- Utilization changed by {change_in_utilization:.2f}%.\n")

                    if change_in_duration > 0:
                        monthly_int.append("Increased activity suggests more intensive use or expanded operations.\n")
                    elif change_in_duration < 0:
                        monthly_int.append("Reduced activity could indicate decreased demand or operational scaling back.\n")
                    
                    if change_in_utilization > 0:
                        monthly_int.append("Increased utilization points to higher demand or improved efficiency.\n")
                    elif change_in_utilization < 0:
                        monthly_int.append("Decreased utilization may reflect reduced demand or inefficiencies.\n")
                else:
                    monthly_int.append("No comparison data available from the previous month.\n")
            else:
                monthly_int.append("This is the first month of the year; no previous data to compare.\n")
        else:
            monthly_int.append("No activity was recorded this month. Potential reasons could include seasonal downtime, ongoing maintenance, or operational pauses.\n")

        return ''.join(monthly_int)

    # Flatten the MultiIndex columns created by the aggregation
    monthly_stats_df.columns = [' '.join(col).strip() for col in monthly_stats_df.columns.values]

    # Rename the columns for clarity
    monthly_stats_df.rename(columns={
        'TOTAL DURATION sum': 'TOTAL DURATION',
        'TOTAL DURATION mean': 'AVERAGE DURATION',
        'TOTAL DURATION min': 'MIN DURATION',
        'TOTAL DURATION max': 'MAX DURATION',
        'TOTAL DURATION size': 'FREQUENCY'  # Rename 'size' to 'FREQUENCY'
    }, inplace=True)

    


    # Merge the complete DataFrame with the statistics DataFrame to include all months
    monthly_stats_df = pd.merge(complete_monthly_df, monthly_stats_df,
                                on=['UniqueID', 'MONTH'], how='left').fillna(0)

    # Calculate the 'MONTH UTILIZATION'
    monthly_stats_df['MONTH UTILIZATION'] = (monthly_stats_df['TOTAL DURATION'] / total_available_time) * 100

    monthly_stats_df['Monthly Interpretation'] = monthly_stats_df.apply(lambda row: generate_monthly_interpretation(row, monthly_stats_df), axis=1)

    # Convert the updated monthly DataFrame to JSON
    monthly_stats_json = monthly_stats_df.to_json(orient='records', date_format='iso', indent=4)


    average_duration_per_day = borrower_df.groupby(['UniqueID', 'DAY OF WEEK'])['TOTAL DURATION'].mean().reset_index(name='AVERAGE DURATION')

    # Create a complete DataFrame for all combinations of 'UniqueID' and 'DAY OF WEEK'
    complete_weekly_df = pd.DataFrame(list(product(unique_ids, all_days_of_week)), columns=['UniqueID', 'DAY OF WEEK'])

    OPERATIONAL_HOURS_PER_DAY = 24 * 7  # Adjust this value based on your specific situation

    # Group by 'UniqueID' and 'DAY OF WEEK' for weekly frequency statistics
    weekly_frequency_df = borrower_df.groupby(['UniqueID', 'DAY OF WEEK']).size().reset_index(name='FREQUENCY')

    # Calculate the total, maximum, and minimum duration per day of the week for each 'UniqueID'
    weekly_stats = borrower_df.groupby(['UniqueID', 'DAY OF WEEK'])['TOTAL DURATION'].agg(['sum', 'max', 'min']).reset_index()

    # Rename the aggregated columns for clarity
    weekly_stats.rename(columns={'sum': 'TOTAL DURATION', 'max': 'MAX DURATION', 'min': 'MIN DURATION'}, inplace=True)

    # Merge the complete DataFrame with 'weekly_frequency_df' to include missing days
    weekly_usage_df = pd.merge(complete_weekly_df, weekly_frequency_df, on=['UniqueID', 'DAY OF WEEK'], how='left').fillna(0)

    # Merge the additional stats into the weekly usage DataFrame
    weekly_usage_df = pd.merge(weekly_usage_df, weekly_stats, on=['UniqueID', 'DAY OF WEEK'], how='left').fillna(0)

    # Now, merge the average duration data into the weekly usage DataFrame
    weekly_usage_df = pd.merge(weekly_usage_df, average_duration_per_day, on=['UniqueID', 'DAY OF WEEK'], how='left').fillna(0)

    # Calculate the daily utilization as a new column in the DataFrame
    weekly_usage_df['DAILY UTILIZATION'] = (weekly_usage_df['TOTAL DURATION'] / OPERATIONAL_HOURS_PER_DAY) * 100

    def generate_daily_interpretation(row, df):
        days_of_week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        day_index = row['DAY OF WEEK']
        daily_int = []

        day_name = days_of_week[row['DAY OF WEEK']]
        daily_int.append(f"{day_name}\n")

        if row['DAY OF WEEK'] == 1:  # Assuming Monday is the start of the week
            daily_int.append("Monday marks the start of the operational week, often setting the tone for the days ahead.\n")
            daily_int.append(f"Activity starts with {row['FREQUENCY']} operations recorded.\n")
            daily_int.append(f"Utilization begins at {row['DAILY UTILIZATION']:.2f}% of total capacity.\n")

        if row['FREQUENCY'] > 0:
            daily_int.append(f"Total duration of activities: {row['TOTAL DURATION']:.2f} hours today.\n")
            daily_int.append(f"Average duration per activity: {row['AVERAGE DURATION']:.2f} hours.\n")
            daily_int.append(f"Overall utilization for the day: {row['DAILY UTILIZATION']:.2f}%.\n")

            # Comparison with the previous day
            prev_day_index = (row['DAY OF WEEK'] - 1) % 7
            prev_day_data = df[(df['UniqueID'] == row['UniqueID']) & (df['DAY OF WEEK'] == prev_day_index)]
            if not prev_day_data.empty:
                prev_day_data = prev_day_data.iloc[0]
                change_in_duration = row['TOTAL DURATION'] - prev_day_data['TOTAL DURATION']
                change_in_utilization = row['DAILY UTILIZATION'] - prev_day_data['DAILY UTILIZATION']
                daily_int.append("Changes from the previous day:\n")
                daily_int.append(f"- Duration changed by {change_in_duration:.2f} hours.\n")
                daily_int.append(f"- Utilization changed by {change_in_utilization:.2f}%.\n")

                if change_in_duration > 0:
                    daily_int.append("There was more activity today compared to yesterday.\n")
                elif change_in_duration < 0:
                    daily_int.append("There was less activity today compared to yesterday.\n")

                if change_in_utilization > 0:
                    daily_int.append("Increased utilization indicates a higher demand or more intensive use today.\n")
                elif change_in_utilization < 0:
                    daily_int.append("Decreased utilization suggests a slowdown or lesser demand today.\n")
            else:
                daily_int.append("No comparison data available from the previous day.\n")
        else:
            daily_int.append("No activity was recorded today. This could be due to an off-day or lack of demand.\n")

        return ''.join(daily_int)

    # Apply this function assuming your 'weekly_usage_df' is correct and complete
    weekly_usage_df['Daily Interpretation'] = weekly_usage_df.apply(lambda row: generate_daily_interpretation(row, weekly_usage_df), axis=1)


    # Convert the updated DataFrame to JSON
    weekly_usage_json = weekly_usage_df.to_json(orient='records', date_format='iso', indent=4)
    def allocate_duration(row):
        # Check if 'DATETIME BORROWED' and 'DATETIME RETURNED' are already datetime objects
        start = row['DATETIME BORROWED']
        end = row['DATETIME RETURNED']

        while start < end:
            # Move to the next hour, ensuring not to exceed the end time
            next_hour = (start + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
            if next_hour > end:
                next_hour = end
            duration = int((next_hour - start).total_seconds() / 60)  # Duration in minutes
            yield row['UniqueID'], start.hour, duration
            start = next_hour

    # Assuming borrower_df is defined and contains the correct data
    allocated_durations_list = []
    for index, row in borrower_df.iterrows():
        for unique_id, hour, duration in allocate_duration(row):
            allocated_durations_list.append({'UniqueID': unique_id, 'HOUR': hour, 'DURATION': duration})

    # Convert the list of dictionaries to a DataFrame
    allocated_durations = pd.DataFrame(allocated_durations_list)

    # Calculate occupancy count for each hour
    allocated_durations['OCCUPANCY COUNT'] = allocated_durations.groupby(['UniqueID', 'HOUR'])['DURATION'].transform('count')

    # Group by 'UniqueID' and 'HOUR' and sum the durations
    grouped_durations = allocated_durations.groupby(['UniqueID', 'HOUR']).agg({'DURATION': 'sum', 'OCCUPANCY COUNT': 'first'}).reset_index()

    # Ensure DURATION does not exceed 60 minutes per hour

    # Merge the grouped durations with the complete hourly DataFrame
    complete_hourly_df = pd.DataFrame(list(product(unique_ids, all_hours_of_day)), columns=['UniqueID', 'HOUR'])
    hourly_stats_df = pd.merge(complete_hourly_df, grouped_durations, on=['UniqueID', 'HOUR'], how='left').fillna(0)

    # Calculate the average duration for each hour
    hourly_stats_df['AVERAGE DURATION'] = hourly_stats_df.apply(
        lambda row: row['DURATION'] / row['OCCUPANCY COUNT'] if row['OCCUPANCY COUNT'] > 0 else 0, axis=1
    )

    # Group by 'UniqueID' and 'HOUR BORROWED' and count occurrences
    borrowed_count = borrower_df.groupby(['UniqueID', 'HOUR BORROWED']).size().reset_index(name='BORROWED COUNT')

    # Group by 'UniqueID' and 'HOUR RETURNED' and count occurrences
    returned_count = borrower_df.groupby(['UniqueID', 'HOUR RETURNED']).size().reset_index(name='RETURNED COUNT')

    # Rename columns for a consistent merge
    borrowed_count.rename(columns={'HOUR BORROWED': 'HOUR'}, inplace=True)
    returned_count.rename(columns={'HOUR RETURNED': 'HOUR'}, inplace=True)

    # Merge the borrowed and returned counts with the hourly_stats_df
    hourly_stats_df = pd.merge(hourly_stats_df, borrowed_count, on=['UniqueID', 'HOUR'], how='left')
    hourly_stats_df = pd.merge(hourly_stats_df, returned_count, on=['UniqueID', 'HOUR'], how='left').fillna(0)

    # Merge these columns from the original DataFrame
    additional_columns = borrower_df[['UniqueID', 'HOUR BORROWED']].drop_duplicates()
    additional_columns.rename(columns={'HOUR BORROWED': 'HOUR'}, inplace=True)
    hourly_stats_df = pd.merge(hourly_stats_df, additional_columns, on=['UniqueID', 'HOUR'], how='left').fillna(0)
    # Ensure required columns are present (adjust as needed)
    # Assuming all previous steps have been completed, add this line right after all merges and before final adjustments to the DataFrame:
    hourly_stats_df['HOURLY UTILIZATION'] = (hourly_stats_df['AVERAGE DURATION'] / 60) * 100  # Calculation for hourly utilization
    hourly_stats_df['UPTIME FLAG'] = hourly_stats_df['OCCUPANCY COUNT'].apply(lambda x: 1 if x > 0 else 0)
    hourly_stats_df['IDLE TIME'] = hourly_stats_df['OCCUPANCY COUNT'].apply(lambda x: 0 if x > 0 else 1)

    # Then, when preparing the final DataFrame for display or JSON serialization, include 'HOURLY UTILIZATION':
    hourly_stats_df = hourly_stats_df[['UniqueID', 'HOUR', 'OCCUPANCY COUNT', 'BORROWED COUNT', 'RETURNED COUNT', 'DURATION', 'AVERAGE DURATION', 'HOURLY UTILIZATION', 'UPTIME FLAG', 'IDLE TIME']]



    def generate_hourly_interpretation(row, df):
        messages = []

        # Simplified interpretation of hourly data
        if row['HOUR'] == 7:
            messages.append("7:00 AM - Start of the operational day.\n")
            messages.append(f"Operations begin with {row['OCCUPANCY COUNT']} recorded uses this hour.\n")
            messages.append(f"Utilization starts at {row['HOURLY UTILIZATION']:.2f}% of total capacity.\n")

        # Activity summary for the hour
        if row['OCCUPANCY COUNT'] > 0:
            # Compare with the previous hour
            prev_hour = (row['HOUR'] - 1) % 24
            prev_hour_data = df[(df['UniqueID'] == row['UniqueID']) & (df['HOUR'] == prev_hour)]
            if not prev_hour_data.empty:
                prev_hour_data = prev_hour_data.iloc[0]
                change_in_duration = row['DURATION'] - prev_hour_data['DURATION']
                change_in_utilization = row['HOURLY UTILIZATION'] - prev_hour_data['HOURLY UTILIZATION']

                messages.append(f"Changes from the previous hour:\n")
                messages.append(f"- Duration changed by {change_in_duration:.2f} hours.\n")
                messages.append(f"- Utilization changed by {change_in_utilization:.2f}%.\n")

                if change_in_duration > 0:
                    messages.append("There was increased activity this hour compared to the last.\n")
                elif change_in_duration < 0:
                    messages.append("Activity decreased this hour compared to the last.\n")

                if change_in_utilization > 0:
                    messages.append("Increased utilization suggests more intensive use or higher efficiency.\n")
                elif change_in_utilization < 0:
                    messages.append("Reduced utilization might indicate a slowdown or lesser demand.\n")
            else:
                messages.append("No previous hour data available for comparison.\n")
        else:
            messages.append("No activity recorded during this hour, indicating possible downtime or a non-operational period.\n")

        return ''.join(messages)
    # Convert to JSON
    hourly_stats_df['Hourly Interpretation'] = hourly_stats_df.apply(lambda row: generate_hourly_interpretation(row, hourly_stats_df), axis=1)
    hourly_stats_df.drop_duplicates(subset=['UniqueID', 'HOUR'], keep='first', inplace=True)

    hourly_usage_json = hourly_stats_df.to_json(orient='records', indent=4)

    # Save each JSON to a file
    with open('static/yearly.json', 'w') as f:
        f.write(yearly_usage_json)

    with open('static/monthly.json', 'w') as f:
        f.write(monthly_stats_json)

    with open('static/weekly.json', 'w') as f:
        f.write(weekly_usage_json)

    with open('static/hourly.json', 'w') as f:
        f.write(hourly_usage_json)

    def get_most_frequent_day(x):
        if pd.api.types.is_datetime64_any_dtype(x['DATE']):
            return x['DATE'].dt.day_name().mode()[0]
        else:
            return 'N/A'
    
    
    def get_most_frequent_month(x):
        if pd.api.types.is_datetime64_any_dtype(x['DATE']):
            return x['DATE'].dt.month_name().mode()[0]
        else:
            return 'N/A'

    for unique_id, group in grouped:   
        # Check if there are at least two data points and variance is not zero
        if len(group['TOTAL DURATION']) > 1 and np.var(group['TOTAL DURATION']) != 0:
            z_scores = zscore(group['TOTAL DURATION'])
        else:
            z_scores = np.full(len(group['TOTAL DURATION']), np.nan)

        if len(group['QUANTITY']) > 1 and len(group['TOTAL DURATION']) > 1 and \
            group['QUANTITY'].nunique() > 1 and group['TOTAL DURATION'].nunique() > 1:
                correlation = group['QUANTITY'].corr(group['TOTAL DURATION'])
        else:
            correlation = 'N/A'
        if pd.isnull(correlation):
            correlation = 'N/A'  # or some other placeholder value
        correlations.append(correlation)

        # Identify outliers
        outliers_condition = group['DAYS DURATION'] > 7
        outlier = group[outliers_condition]
        if outlier.empty:
            outliers.append('N/A')
        else:
            # Append a simple descriptor, such as the count of outliers, instead of the full DataFrame
            outliers.append(f"{len(outlier)} outliers over 7 days")

        # Get the last used date
        last_borrow_date = group['DATE'].max()
        last_borrow_dates.append(last_borrow_date)

        first_borrow_date = group['DATE'].min()
        first_borrow_dates.append(first_borrow_date)

        # Get the last used date
        last_used_date = group['DATE RETURNED'].max()
        last_used_dates.append(last_used_date)

        first_used_date = group['DATE RETURNED'].min()
        first_used_dates.append(first_used_date)

        range_duration = group['TOTAL DURATION'].max() - group['TOTAL DURATION'].min()
    
    # Calculate the statistics
    frequency = grouped.size()
    equipment_name = grouped['EQUIPMENT NAME'].unique()
    total_duration = grouped['TOTAL DURATION'].sum()
    average_duration = grouped['TOTAL DURATION'].mean()
    max_duration = grouped['TOTAL DURATION'].max()
    min_duration = grouped['TOTAL DURATION'].min()
    median_duration = grouped['TOTAL DURATION'].median()
    std_dev_duration = grouped['TOTAL DURATION'].std()
    unique_dates = grouped['DATE'].nunique()
    most_frequent_day = grouped.apply(get_most_frequent_day)
    most_frequent_month = grouped.apply(get_most_frequent_month)
    # Create a new column 'Late Return' indicating whether the return is late (duration > 24 hours)
    borrower_df['Late Return'] = borrower_df['TOTAL DURATION'] > 48

    # Count the number of late returns per UniqueID
    late_return = borrower_df.groupby('UniqueID')['Late Return'].sum()

    # Create a new DataFrame with the statistics
    stats_df = pd.DataFrame({
        'Equipment Name': equipment_name,
        'UniqueID': unique_ids_list,
        'Frequency': frequency,
        'Total Duration': total_duration,
        'Average Duration': average_duration,
        'Max Duration': max_duration,
        'Min Duration': min_duration,
        'Correlation': correlations,
        'Outliers': outliers,
        'Late Return': late_return,
        'Last Return Date': last_used_dates,
        'First Return Date': first_used_dates,
        'Last Borrow Date': last_borrow_dates,
        'First Borrow Date': first_borrow_dates,
        'Median Duration': median_duration,
        'Standard Deviation Duration': std_dev_duration,
        'Unique Dates': unique_dates,
        'Most Frequent Day': most_frequent_day,
        'Range Duration': range_duration,
        'Most Frequent Month': most_frequent_month
    })

    overall_average_duration = stats_df['Average Duration'].mean()

    def overall_interpretation(row):
        messages = []

        # Simplified explanation of average duration in relation to the overall average
        avg_dur_msg = "on par with"
        if row['Average Duration'] > overall_average_duration:
            avg_dur_msg = "above"
        elif row['Average Duration'] < overall_average_duration:
            avg_dur_msg = "below"
        messages.append(f"The average borrowing duration is {avg_dur_msg} the typical usage.\n")
        
        # Duration range insights with simplified language
        if pd.notnull(row['Max Duration']) and pd.notnull(row['Min Duration']):
            if row['Max Duration'] != row['Min Duration']:
                messages.append(f"Usage varied from as short as {row['Min Duration']} hours to as long as {row['Max Duration']} hours.\n")
            else:
                messages.append("Every borrowing period was exactly the same duration, showing very consistent use.\n")
        
        # Median Duration simplified
        messages.append(f"Most commonly, items were borrowed for around {row['Median Duration']} hours.\n")
        
        # Unique Dates Insights with straightforward language
        if row['Unique Dates'] > 1:
            days = f"{row['Unique Dates']} different days"
            messages.append(f"It was borrowed on {days}, often on {row['Most Frequent Day']}s and typically in {row['Most Frequent Month']}.\n")
        else:
            messages.append("It was borrowed just once, showing very specific use.\n")
        
        # Correlation and outliers in plain language
        if row.get('Correlation', 'N/A') not in [np.nan, 'N/A', None]:
            messages.append(f"There's a noticeable pattern where more use leads to longer borrowing times.\n")
        else:
            messages.append("Usage time doesn't really change with how often it's borrowed.\n")
        
        # Late Returns and Outliers Insights in a friendly tone
        if row.get('Late Return', 0) > 0:
            messages.append(f"Unfortunately, it was returned late {row['Late Return']} times.\n")
        else:
            messages.append("Great news: it was never returned late!\n")
        
        if row.get('Outliers', 0) not in [np.nan, 'N/A', None, 0]:
            messages.append("Some very unusual borrowing durations were noted, which could be special cases.\n")
        else:
            messages.append("Borrowing durations were quite consistent, with no unusual activity.\n")

        return ''.join(messages)


    # Now apply this function to each row in the DataFrame to create the interpretations
    stats_df['Overall Interpretation'] = stats_df.apply(overall_interpretation, axis=1)


    # Ensure 'UniqueID' is a column in the stats_df DataFrame
    stats_df.reset_index(inplace=True, drop=True)

    # Ensure 'UniqueID' is a column in the inventory_df DataFrame
    inventory_df.reset_index(inplace=True, drop=True)

    # Ensure 'UniqueID' is a column in the inventory_df DataFrame
    calibration_df.reset_index(inplace=True, drop=True)

    # Convert date columns to datetime in calibration_df
    calibration_df['Calibration Date'] = pd.to_datetime(calibration_df['Calibration Date'], errors='coerce', dayfirst='true')
    calibration_df['Calibration Due'] = pd.to_datetime(calibration_df['Calibration Due'], dayfirst='true')

    # Now perform the subtraction to calculate 'Days Since Last Calibration'
    calibration_df['Days Since Last Calibration'] = (datetime.now() - calibration_df['Calibration Date']).dt.days

    print(stats_df.head())

    inventory_df.drop_duplicates(subset='UniqueID', inplace=True)
    stats_df = pd.merge(stats_df, inventory_df[['UniqueID', 'MAINTENANCE TYPE', 'FREQUENCY']], on='UniqueID', how='left')

    calibration_df.drop_duplicates(subset='UniqueID', inplace=True)
    stats_df = pd.merge(stats_df, calibration_df[['UniqueID', 'Days Since Last Calibration', 'Calibration Due']], on='UniqueID', how='left')


    # Fill N/A values for items without calibration history
    stats_df.fillna('N/A', inplace=True)

    combined_df = stats_df.merge(ml_df, on='UniqueID', how='left')

    # Fill NaN values with 'N/A' for the columns that come from ml_df
    predicted_columns = [
    'PredictedRUL_MLR', 'EquipmentHealth_MLR', 'PredictedRUL_KNN', 'EquipmentHealth_KNN',
    'PredictedRUL_SVR', 'EquipmentHealth_SVR'
]
    
    for column in predicted_columns:
        combined_df[column].fillna('N/A', inplace=True)

    print(stats_df.head())

    combined_df.to_json('static/stats.json', orient='records', indent=4)

    borrower_df['DATE'] = borrower_df['DATE'].apply(lambda x: x.strftime('%Y-%m-%d') if not pd.isnull(x) else '')
    borrower_df['DATE RETURNED'] = borrower_df['DATE RETURNED'].apply(lambda x: x.strftime('%Y-%m-%d') if not pd.isnull(x) else '')

    overall_json = borrower_df.to_json(orient='records')

    overall_data = json.loads(overall_json)

    # Create a list of dictionaries, each containing the 'UniqueID' and other data
    overall_list = []
    for item in overall_data:
        overall_list.append({
            "UniqueID": item['UniqueID'],
            "dateBorrowed": item['DATE'],
            "dateReturned": item['DATE RETURNED'],
            "timeBorrowed": item['TIME BORROWED'],
            "timeReturned": item['TIME RETURNED'],
            "totalDuration": item['TOTAL DURATION'],
        })

    # Save the list of dictionaries to a JSON file
    with open('static/overall.json', 'w') as json_file:
        json.dump(overall_list, json_file, indent=4)

    pass


@app.route('/')
def index():


    return render_template('inventory.html')


@app.route('/unique_ids')
def unique_ids():
    equipment_name = request.args.get('equipment_name', type=str)
    unique_ids = inventory_df[inventory_df['Name'] == equipment_name]['UniqueID'].unique().tolist()
    return jsonify(unique_ids=unique_ids)

@app.route('/equipment')
def equipment():

    return render_template('equipment.html')


@app.route('/train')
def train():
    
    return render_template('train.html')

@app.route('/update')
def update(): 
    return render_template('update.html')

@app.route('/process_data', methods=['POST'])
def process_data():
    # The calculate_room function (with required modifications if any)
    calculate_room()
    calculate_equipment()
    return jsonify({"status": "processing complete"})

@app.route('/train_data', methods=['POST'])
def train_data():
    MLR_Train()
    KNN_Train()
    SVR_Train()
    return jsonify({"status": "training complete"})


if __name__ == '__main__':
    app.run(debug=True)