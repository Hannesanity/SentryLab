import pandas as pd
import statsmodels.api as sm
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.svm import SVR
import numpy as np



inventory_df = pd.read_csv("datasets/Inventory.csv")
borrower_df = pd.read_csv("datasets/BorrowerSlip.csv")
calibration_df = pd.read_csv("datasets/Calibration.csv")
ml_df = pd.read_csv("datasets/Predictions.csv")

# Convert date columns to datetime objects
borrower_df['Date Borrowed'] = pd.to_datetime(borrower_df['Date Borrowed'], errors='coerce')
borrower_df['Date Returned'] = pd.to_datetime(borrower_df['Date Returned'], errors='coerce')


calibration_df['Calibration Date'] = pd.to_datetime(calibration_df['Calibration Date'], dayfirst=True, errors='coerce')
calibration_df['Calibration Due'] = pd.to_datetime(calibration_df['Calibration Due'], dayfirst=True, errors='coerce')

if not pd.api.types.is_datetime64_any_dtype(borrower_df['DateTime Borrowed']):
    borrower_df['DateTime Borrowed'] = pd.to_datetime(borrower_df['DateTime Borrowed'], errors='coerce')

if not pd.api.types.is_datetime64_any_dtype(borrower_df['DateTime Returned']):
    borrower_df['DateTime Returned'] = pd.to_datetime(borrower_df['DateTime Returned'], errors='coerce')

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

# Calculate Total Duration of use
total_duration = grouped['Total Duration'].sum()

# Calculate the first borrow date
first_borrow_date = grouped['Date Borrowed'].min()

# Calculate average duration per use
average_duration = grouped['Total Duration'].mean()

# Calculate time since last use
most_recent_use = grouped['Date Returned'].max()
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

inventory_df['NumericalFrequency'] = inventory_df['Maintenance Frequency'].apply(convert_frequency_to_numerical)
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