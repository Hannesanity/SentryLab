import pandas as pd
from scipy.stats import zscore, mode
import numpy as np
import json
from datetime import datetime, timedelta
from itertools import product

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


# Calculating Statistics

def calculate_room():
    borrower_df['Date Borrowed'] = pd.to_datetime(borrower_df['Date Borrowed'], dayfirst=True, errors='coerce')
    borrower_df['Date Returned'] = pd.to_datetime(borrower_df['Date Returned'], dayfirst=True, errors='coerce')
    borrower_df['MONTH'] = borrower_df['Date Borrowed'].dt.month
    borrower_df['DAY OF WEEK'] = borrower_df['Date Borrowed'].dt.dayofweek
    # Add maintenance frequency based on your criteria (placeholder values)
    name_to_frequency = dict(zip(inventory_df['Name'], inventory_df['Maintenance Frequency']))
    name_to_room = dict(zip(inventory_df['Name'], inventory_df['Room']))
    name_to_mainte = dict(zip(inventory_df['Name'], inventory_df['Maintenance Type']))


    # Room Statistics
    # Group by 'Room' and 'DateTime Borrowed' by month (or another time interval)
    time_series_data = borrower_df.groupby(['Equipment Name', borrower_df['DateTime Borrowed'].dt.to_period('M')]).agg({
        'Quantity': 'sum',
        'Total Duration': 'sum',

         # Assuming 'USAGE DURATION' > 24 indicates a late return
    }).rename(columns={
        'Quantity': 'Frequency',
        'Total Duration': 'Duration Sum',
        'Late Return': 'Late Returns'
    }).reset_index()

    time_series_data['Room'] = time_series_data['Equipment Name'].map(name_to_room).fillna('Others')

    time_series_data['Average Duration Per Use'] = time_series_data['Duration Sum'] / time_series_data['Frequency']

    # Convert the 'DateTime Borrowed' period back to datetime for plotting
    time_series_data['DateTime Borrowed'] = time_series_data['DateTime Borrowed'].dt.to_timestamp()

    time_series_data.to_json('static/room_stats.json', orient='records', indent=4)
    # Overall Statistics
    

    # Equipment Name STATS
    # Calculate the statistics
    
    eqgroup = borrower_df.groupby('Equipment Name')
    name_list = list(eqgroup.groups.keys())
    Quantity_sum = eqgroup['Quantity'].sum()
    
    correlations = []
    outliers = []
    last_used_dates = []
    first_used_dates = []
    last_borrow_dates = []
    first_borrow_dates = []

    
    for name, group in eqgroup:   
        # Calculate the z-scores of the 'Total Duration'
        z_scores = zscore(group['Total Duration'])

        correlation = group['Quantity'].corr(group['Total Duration'])
        if pd.isnull(correlation):
            correlation = 'N/A'  # or some other placeholder value
        correlations.append(correlation)

        # Identify outliers
        # Instead of calculating z-scores for outliers, directly check for borrowings more than 7 days
        outlier = group[group['Days Duration'] > 7].shape[0]
        
        outliers.append(outlier)

        # Get the last used date
        last_borrow_date = group['Date Borrowed'].max()
        last_borrow_dates.append(last_borrow_date)

        first_borrow_date = group['Date Borrowed'].min()
        first_borrow_dates.append(first_borrow_date)

        # Get the last used date
        last_used_date = group['Date Returned'].max()
        last_used_dates.append(last_used_date)

        first_used_date = group['Date Returned'].min()
        first_used_dates.append(first_used_date)

        range_duration = group['Total Duration'].max() - group['Total Duration'].min()

    def get_most_frequent_day(x):
        if pd.api.types.is_datetime64_any_dtype(x['Date Borrowed']):
            return x['Date Borrowed'].dt.day_name().mode()[0]
        else:
            return 'N/A'
    
    
    def get_most_frequent_month(x):
        if pd.api.types.is_datetime64_any_dtype(x['DATE']):
            return x['Date Borrowed'].dt.month_name().mode()[0]
        else:
            return 'N/A'

    frequency = eqgroup.size()
    total_duration = eqgroup['Total Duration'].sum()
    average_duration = eqgroup['Total Duration'].mean()
    max_duration = eqgroup['Total Duration'].max()
    min_duration = eqgroup['Total Duration'].min()
    median_duration = eqgroup['Total Duration'].median()
    std_dev_duration = eqgroup['Total Duration'].std()
    unique_dates = eqgroup['Date Borrowed'].nunique()
    most_frequent_day = eqgroup.apply(get_most_frequent_day)
    most_frequent_month = eqgroup.apply(get_most_frequent_month)
    # Create a new column 'Late Return' indicating whether the return is late (duration > 24 hours)
    borrower_df['Late Return'] = borrower_df['Total Duration'] > 24
    current_date = datetime.now()
    

    # Count the number of late returns per UniqueID
    late_return = borrower_df.groupby('Equipment Name')['Late Return'].sum()
    # Create a new DataFrame with the statistics
    eqstats_df = pd.DataFrame({
        'Equipment Name': name_list,  # Get the first 'Equipment Name' from each group
        'Frequency': frequency,
        'Total Quantity': Quantity_sum,
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

        equipment_name = row['Equipment Name']  # Get the Equipment Name from the row

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
    borrower_df['Quarter'] = borrower_df['DateTime Borrowed'].dt.to_period('Q').dt.quarter

    # Group by 'Equipment Name' and 'Quarter' and sum the 'Total Duration'
    quarterly_usage = borrower_df.groupby(['Equipment Name', 'Quarter'])['Total Duration'].sum().reset_index()

    # Calculate peak quarters by finding the quarter with the maximum Total Duration for each equipment
    peak_quarters = quarterly_usage.loc[quarterly_usage.groupby('Equipment Name')['Total Duration'].idxmax()]

    # If you want to identify if the usage is fairly even across quarters
    threshold = 0.1  # Define a threshold for what you consider 'fair'
    peak_quarters.rename(columns={'Quarter': 'Peak Quarter'}, inplace=True)

    # Then, ensure that the 'Is Fair' calculation is correct
    quarterly_usage['Is Fair'] = quarterly_usage.groupby('Equipment Name')['Total Duration'].transform(
        lambda x: (x.max() - x.min()) / x.max() < threshold
    )

    # Now merge 'peak_quarters' into 'eqstats_df'
    eqstats_df = eqstats_df.merge(peak_quarters[['Equipment Name', 'Peak Quarter']], on='Equipment Name', how='left')

    # Merge the 'Is Fair' column into 'eqstats_df'. Ensure that the merge is on 'Equipment Name'
    # and that the column exists in 'quarterly_usage' with the same name.
    eqstats_df = eqstats_df.merge(
        quarterly_usage[['Equipment Name', 'Is Fair']].drop_duplicates('Equipment Name'),
        on='Equipment Name',
        how='left'
    )
    eqstats_df = eqstats_df.merge(inventory_counts, left_on='Equipment Name', right_on='Name', how='left')

    # Drop duplicates from the 'equipment_stats' DataFrame to ensure each Equipment Name is unique
    eqstats_df.drop_duplicates(subset='Equipment Name', inplace=True)
    eqstats_df = eqstats_df.drop(columns=['Equipment Name', 'Name'])

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
        'Equipment Name': 'nunique'  # Count unique Equipment Names directly here
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

    borrower_df['Date Borrowed'] = pd.to_datetime(borrower_df['Date Borrowed'], dayfirst=True, errors='coerce')
    borrower_df['Date Returned'] = pd.to_datetime(borrower_df['Date Returned'], dayfirst=True, errors='coerce')
    borrower_df['MONTH'] = borrower_df['Date Borrowed'].dt.month
    borrower_df['DAY OF WEEK'] = borrower_df['DATE'].dt.dayofweek
    borrower_df['YEAR'] = borrower_df['Date Borrowed'].dt.year

    # Convert 'Time Borrowed' and 'Time Returned' to datetime and extract 'HOUR'
    borrower_df['Hour Borrowed'] = pd.to_datetime(borrower_df['Time Borrowed']).dt.hour
    borrower_df['Hour Returned'] = pd.to_datetime(borrower_df['Time Returned']).dt.hour

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
                change_in_duration = row['Total Duration'] - prev_year_data['Total Duration']
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
        'Total Duration': ['sum', 'mean', 'min', 'max', 'size']  # Calculate sum, average, min, and max duration
    }).reset_index()

    # Flatten the MultiIndex columns created by the aggregation
    yearly_stats_df.columns = [' '.join(col).strip() for col in yearly_stats_df.columns.values]
 
    # Rename the columns for clarity
    yearly_stats_df.rename(columns={
        'Total Duration sum': 'Total Duration',
        'Total Duration mean': 'AVERAGE DURATION',
        'Total Duration min': 'MIN DURATION',
        'Total Duration max': 'MAX DURATION',
        'Total Duration size': 'FREQUENCY'
    }, inplace=True)

    complete_yearly_df = pd.DataFrame(list(product(unique_ids_list, years_list)), columns=['UniqueID', 'YEAR'])

    # Merge the complete DataFrame with 'yearly_stats_df' to include missing years
    yearly_stats_df = pd.merge(complete_yearly_df, yearly_stats_df, on=['UniqueID', 'YEAR'], how='left').fillna(0)

    # Calculate the yearly utilization percentage
    yearly_stats_df['YEAR UTILIZATION'] = (yearly_stats_df['Total Duration'] / (8 * 5 * 52)) * 100

    yearly_stats_df['Yearly Interpretation'] = yearly_stats_df.apply(lambda row: generate_yearly_interpretation(row, yearly_stats_df), axis=1)

    # Convert the updated yearly DataFrame to JSON
    yearly_usage_json = yearly_stats_df.to_json(orient='records', date_format='iso', indent=4)

    # Create a DataFrame with all combinations of 'UniqueID' and 'MONTH'
    complete_monthly_df = pd.DataFrame(list(product(unique_ids_list, range(1, 13))),
                                    columns=['UniqueID', 'MONTH'])

    # Group by 'UniqueID' and 'MONTH' to calculate monthly statistics and frequency
    monthly_stats_df = borrower_df.groupby(['UniqueID', 'MONTH']).agg({
        'Total Duration': ['sum', 'mean', 'min', 'max', 'size']  # Include 'size' for frequency
    }).reset_index()

    def generate_monthly_interpretation(row, df):
        month_names = ["January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"]
        
        monthly_int = []

        month_name = month_names[row['MONTH'] - 1]
        monthly_int.append(f"{month_name}:\n")

        if row['FREQUENCY'] > 0:
            # Start of the year context
            if row['MONTH'] == 1:
                monthly_int.append("marks the beginning of the year, setting the pace for the upcoming months.\n")
            monthly_int.append(f"Activities recorded: {row['FREQUENCY']} times.\n")
            monthly_int.append(f"Total Duration: {row['Total Duration']:.2f} hours with an average session lasting {row['AVERAGE DURATION']:.2f} hours.\n")
            monthly_int.append(f"Monthly utilization: {row['MONTH UTILIZATION']:.2f}% of capacity utilized.\n")

            # Attempt to find previous month's data for comparison
            prev_month = row['MONTH'] - 1
            if prev_month > 0:  # Ensure it does not go to the previous year
                prev_month_data = df[(df['UniqueID'] == row['UniqueID']) & (df['MONTH'] == prev_month)]
                if not prev_month_data.empty:
                    prev_month_data = prev_month_data.iloc[0]
                    change_in_utilization = row['MONTH UTILIZATION'] - prev_month_data['MONTH UTILIZATION']
                    change_in_duration = row['Total Duration'] - prev_month_data['Total Duration']
                    
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
        'Total Duration sum': 'Total Duration',
        'Total Duration mean': 'AVERAGE DURATION',
        'Total Duration min': 'MIN DURATION',
        'Total Duration max': 'MAX DURATION',
        'Total Duration size': 'FREQUENCY'  # Rename 'size' to 'FREQUENCY'
    }, inplace=True)

    


    # Merge the complete DataFrame with the statistics DataFrame to include all months
    monthly_stats_df = pd.merge(complete_monthly_df, monthly_stats_df,
                                on=['UniqueID', 'MONTH'], how='left').fillna(0)

    # Calculate the 'MONTH UTILIZATION'
    monthly_stats_df['MONTH UTILIZATION'] = (monthly_stats_df['Total Duration'] / total_available_time) * 100

    monthly_stats_df['Monthly Interpretation'] = monthly_stats_df.apply(lambda row: generate_monthly_interpretation(row, monthly_stats_df), axis=1)

    # Convert the updated monthly DataFrame to JSON
    monthly_stats_json = monthly_stats_df.to_json(orient='records', date_format='iso', indent=4)


    average_duration_per_day = borrower_df.groupby(['UniqueID', 'DAY OF WEEK'])['Total Duration'].mean().reset_index(name='AVERAGE DURATION')

    # Create a complete DataFrame for all combinations of 'UniqueID' and 'DAY OF WEEK'
    complete_weekly_df = pd.DataFrame(list(product(unique_ids, all_days_of_week)), columns=['UniqueID', 'DAY OF WEEK'])

    OPERATIONAL_HOURS_PER_DAY = 24 * 7  # Adjust this value based on your specific situation

    # Group by 'UniqueID' and 'DAY OF WEEK' for weekly frequency statistics
    weekly_frequency_df = borrower_df.groupby(['UniqueID', 'DAY OF WEEK']).size().reset_index(name='FREQUENCY')

    # Calculate the total, maximum, and minimum duration per day of the week for each 'UniqueID'
    weekly_stats = borrower_df.groupby(['UniqueID', 'DAY OF WEEK'])['Total Duration'].agg(['sum', 'max', 'min']).reset_index()

    # Rename the aggregated columns for clarity
    weekly_stats.rename(columns={'sum': 'Total Duration', 'max': 'MAX DURATION', 'min': 'MIN DURATION'}, inplace=True)

    # Merge the complete DataFrame with 'weekly_frequency_df' to include missing days
    weekly_usage_df = pd.merge(complete_weekly_df, weekly_frequency_df, on=['UniqueID', 'DAY OF WEEK'], how='left').fillna(0)

    # Merge the additional stats into the weekly usage DataFrame
    weekly_usage_df = pd.merge(weekly_usage_df, weekly_stats, on=['UniqueID', 'DAY OF WEEK'], how='left').fillna(0)

    # Now, merge the average duration data into the weekly usage DataFrame
    weekly_usage_df = pd.merge(weekly_usage_df, average_duration_per_day, on=['UniqueID', 'DAY OF WEEK'], how='left').fillna(0)

    # Calculate the daily utilization as a new column in the DataFrame
    weekly_usage_df['DAILY UTILIZATION'] = (weekly_usage_df['Total Duration'] / OPERATIONAL_HOURS_PER_DAY) * 100

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
            daily_int.append(f"Total Duration of activities: {row['Total Duration']:.2f} hours today.\n")
            daily_int.append(f"Average duration per activity: {row['AVERAGE DURATION']:.2f} hours.\n")
            daily_int.append(f"Overall utilization for the day: {row['DAILY UTILIZATION']:.2f}%.\n")

            # Comparison with the previous day
            prev_day_index = (row['DAY OF WEEK'] - 1) % 7
            prev_day_data = df[(df['UniqueID'] == row['UniqueID']) & (df['DAY OF WEEK'] == prev_day_index)]
            if not prev_day_data.empty:
                prev_day_data = prev_day_data.iloc[0]
                change_in_duration = row['Total Duration'] - prev_day_data['Total Duration']
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
        # Check if 'DateTime Borrowed' and 'DateTime Returned' are already datetime objects
        start = row['DateTime Borrowed']
        end = row['DateTime Returned']

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

    # Calculate Occupancy Count for each hour
    allocated_durations['Occupancy Count'] = allocated_durations.groupby(['UniqueID', 'HOUR'])['DURATION'].transform('count')

    # Group by 'UniqueID' and 'HOUR' and sum the durations
    grouped_durations = allocated_durations.groupby(['UniqueID', 'HOUR']).agg({'DURATION': 'sum', 'Occupancy Count': 'first'}).reset_index()

    # Ensure DURATION does not exceed 60 minutes per hour

    # Merge the grouped durations with the complete hourly DataFrame
    complete_hourly_df = pd.DataFrame(list(product(unique_ids, all_hours_of_day)), columns=['UniqueID', 'HOUR'])
    hourly_stats_df = pd.merge(complete_hourly_df, grouped_durations, on=['UniqueID', 'HOUR'], how='left').fillna(0)

    # Calculate the average duration for each hour
    hourly_stats_df['AVERAGE DURATION'] = hourly_stats_df.apply(
        lambda row: row['DURATION'] / row['Occupancy Count'] if row['Occupancy Count'] > 0 else 0, axis=1
    )

    # Group by 'UniqueID' and 'Hour Borrowed' and count occurrences
    borrowed_count = borrower_df.groupby(['UniqueID', 'Hour Borrowed']).size().reset_index(name='BORROWED COUNT')

    # Group by 'UniqueID' and 'Hour Returned' and count occurrences
    returned_count = borrower_df.groupby(['UniqueID', 'Hour Returned']).size().reset_index(name='RETURNED COUNT')

    # Rename columns for a consistent merge
    borrowed_count.rename(columns={'Hour Borrowed': 'HOUR'}, inplace=True)
    returned_count.rename(columns={'Hour Returned': 'HOUR'}, inplace=True)

    # Merge the borrowed and returned counts with the hourly_stats_df
    hourly_stats_df = pd.merge(hourly_stats_df, borrowed_count, on=['UniqueID', 'HOUR'], how='left')
    hourly_stats_df = pd.merge(hourly_stats_df, returned_count, on=['UniqueID', 'HOUR'], how='left').fillna(0)

    # Merge these columns from the original DataFrame
    additional_columns = borrower_df[['UniqueID', 'Hour Borrowed']].drop_duplicates()
    additional_columns.rename(columns={'Hour Borrowed': 'HOUR'}, inplace=True)
    hourly_stats_df = pd.merge(hourly_stats_df, additional_columns, on=['UniqueID', 'HOUR'], how='left').fillna(0)
    # Ensure required columns are present (adjust as needed)
    # Assuming all previous steps have been completed, add this line right after all merges and before final adjustments to the DataFrame:
    hourly_stats_df['HOURLY UTILIZATION'] = (hourly_stats_df['AVERAGE DURATION'] / 60) * 100  # Calculation for hourly utilization
    hourly_stats_df['UPTIME FLAG'] = hourly_stats_df['Occupancy Count'].apply(lambda x: 1 if x > 0 else 0)
    hourly_stats_df['IDLE TIME'] = hourly_stats_df['Occupancy Count'].apply(lambda x: 0 if x > 0 else 1)

    # Then, when preparing the final DataFrame for display or JSON serialization, include 'HOURLY UTILIZATION':
    hourly_stats_df = hourly_stats_df[['UniqueID', 'HOUR', 'Occupancy Count', 'BORROWED COUNT', 'RETURNED COUNT', 'DURATION', 'AVERAGE DURATION', 'HOURLY UTILIZATION', 'UPTIME FLAG', 'IDLE TIME']]



    def generate_hourly_interpretation(row, df):
        messages = []

        # Simplified interpretation of hourly data
        if row['HOUR'] == 7:
            messages.append("7:00 AM: Start of the operational day.\n")
            messages.append(f"Operations begin with {row['Occupancy Count']} recorded uses this hour.\n")
            messages.append(f"Utilization starts at {row['HOURLY UTILIZATION']:.2f}% of total capacity.\n")

        # Activity summary for the hour
        if row['Occupancy Count'] > 0:
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
        if len(group['Total Duration']) > 1 and np.var(group['Total Duration']) != 0:
            z_scores = zscore(group['Total Duration'])
        else:
            z_scores = np.full(len(group['Total Duration']), np.nan)

        if len(group['Quantity']) > 1 and len(group['Total Duration']) > 1 and \
            group['Quantity'].nunique() > 1 and group['Total Duration'].nunique() > 1:
                correlation = group['Quantity'].corr(group['Total Duration'])
        else:
            correlation = 'N/A'
        if pd.isnull(correlation):
            correlation = 'N/A'  # or some other placeholder value
        correlations.append(correlation)

        # Identify outliers
        outliers_condition = group['Days Duration'] > 7
        outlier = group[outliers_condition]
        if outlier.empty:
            outliers.append('N/A')
        else:
            # Append a simple descriptor, such as the count of outliers, instead of the full DataFrame
            outliers.append(f"{len(outlier)} outliers over 7 days")

        # Get the last used date
        last_borrow_date = group['Date Borrowed'].max()
        last_borrow_dates.append(last_borrow_date)

        first_borrow_date = group['Date Borrowed'].min()
        first_borrow_dates.append(first_borrow_date)

        # Get the last used date
        last_used_date = group['Date Returned'].max()
        last_used_dates.append(last_used_date)

        first_used_date = group['Date Returned'].min()
        first_used_dates.append(first_used_date)

        range_duration = group['Total Duration'].max() - group['Total Duration'].min()
    
    # Calculate the statistics
    frequency = grouped.size()
    equipment_name = grouped['Equipment Name'].unique()
    total_duration = grouped['Total Duration'].sum()
    average_duration = grouped['Total Duration'].mean()
    max_duration = grouped['Total Duration'].max()
    min_duration = grouped['Total Duration'].min()
    median_duration = grouped['Total Duration'].median()
    std_dev_duration = grouped['Total Duration'].std()
    unique_dates = grouped['DATE'].nunique()
    most_frequent_day = grouped.apply(get_most_frequent_day)
    most_frequent_month = grouped.apply(get_most_frequent_month)
    # Create a new column 'Late Return' indicating whether the return is late (duration > 24 hours)
    borrower_df['Late Return'] = borrower_df['Total Duration'] > 48

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
    stats_df = pd.merge(stats_df, inventory_df[['UniqueID', 'Maintenance Type', 'FREQUENCY']], on='UniqueID', how='left')

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
    borrower_df['Date Returned'] = borrower_df['Date Returned'].apply(lambda x: x.strftime('%Y-%m-%d') if not pd.isnull(x) else '')

    overall_json = borrower_df.to_json(orient='records')

    overall_data = json.loads(overall_json)

    # Create a list of dictionaries, each containing the 'UniqueID' and other data
    overall_list = []
    for item in overall_data:
        overall_list.append({
            "UniqueID": item['UniqueID'],
            "dateBorrowed": item['DATE'],
            "dateReturned": item['Date Returned'],
            "timeBorrowed": item['Time Borrowed'],
            "timeReturned": item['Time Returned'],
            "totalDuration": item['Total Duration'],
        })

    # Save the list of dictionaries to a JSON file
    with open('static/overall.json', 'w') as json_file:
        json.dump(overall_list, json_file, indent=4)

    pass