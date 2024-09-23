import pandas as pd
from scipy.stats import zscore, mode
import numpy as np
import json
from datetime import datetime, timedelta
from itertools import product

inventory_df = pd.read_csv("datasets/InventoryExport.csv")
borrower_df = pd.read_csv("datasets/BorrowerSlipExport.csv")
calibration_df = pd.read_csv("datasets/CalibrationExport.csv")
ml_df = pd.read_csv("datasets/Predictions.csv")

# Convert date columns to datetime objects
borrower_df['DateBorrowed'] = pd.to_datetime(borrower_df['DateBorrowed'], errors='coerce')
borrower_df['DateReturned'] = pd.to_datetime(borrower_df['DateReturned'], errors='coerce')


calibration_df['CalibrationDate'] = pd.to_datetime(calibration_df['CalibrationDate'], dayfirst=True, errors='coerce')
calibration_df['CalibrationDue'] = pd.to_datetime(calibration_df['CalibrationDue'], dayfirst=True, errors='coerce')

if not pd.api.types.is_datetime64_any_dtype(borrower_df['DateTimeBorrowed']):
    borrower_df['DateTimeBorrowed'] = pd.to_datetime(borrower_df['DateTimeBorrowed'], errors='coerce')

if not pd.api.types.is_datetime64_any_dtype(borrower_df['DateTimeReturned']):
    borrower_df['DateTimeReturned'] = pd.to_datetime(borrower_df['DateTimeReturned'], errors='coerce')


# Calculating Statistics

def calculate_room():
    borrower_df['DateBorrowed'] = pd.to_datetime(borrower_df['DateBorrowed'], dayfirst=True, errors='coerce')
    borrower_df['DateReturned'] = pd.to_datetime(borrower_df['DateReturned'], dayfirst=True, errors='coerce')
    borrower_df['MONTH'] = borrower_df['DateBorrowed'].dt.month
    borrower_df['DAY OF WEEK'] = borrower_df['DateBorrowed'].dt.dayofweek
    # Add maintenance frequency based on your criteria (placeholder values)
    name_to_frequency = dict(zip(inventory_df['Name'], inventory_df['Frequency']))
    name_to_room = dict(zip(inventory_df['Name'], inventory_df['Room']))
    name_to_mainte = dict(zip(inventory_df['Name'], inventory_df['MaintenanceType']))

    print(borrower_df.columns)


    # Room Statistics
    # Group by 'Room' and 'DateTimeBorrowed' by month (or another time interval)
    time_series_data = borrower_df.groupby(
        ['EquipmentName', borrower_df['DateTimeBorrowed'].dt.to_period('M')]
    ).agg({
        'BorrowerSlipID': 'count',  # Count of borrow events as Frequency
        'TotalDuration': 'sum',     # Sum of the total duration for the group
    }).rename(columns={
        'BorrowerSlipID': 'Frequency',  # Rename to Frequency
        'TotalDuration': 'Duration Sum'
    }).reset_index()

    time_series_data['Room'] = time_series_data['EquipmentName'].map(name_to_room).fillna('Others')

    time_series_data['Average Duration Per Use'] = time_series_data['Duration Sum']

    # Convert the 'DateTimeBorrowed' period back to datetime for plotting
    time_series_data['DateTimeBorrowed'] = time_series_data['DateTimeBorrowed'].dt.to_timestamp()

    time_series_data.to_json('static/room_stats.json', orient='records', indent=4)
    # Overall Statistics
    

    # EquipmentName STATS
    # Calculate the statistics
    
    eqgroup = borrower_df.groupby('EquipmentName')
    name_list = list(eqgroup.groups.keys())
    
    outliers = []
    last_used_dates = []
    first_used_dates = []
    last_borrow_dates = []
    first_borrow_dates = []

    
    for name, group in eqgroup:   

        # Identify outliers
        # Instead of calculating z-scores for outliers, directly check for borrowings more than 7 days
        outlier = group[group['DaysDuration'] > 7].shape[0]
        
        outliers.append(outlier)

        # Get the last used date
        last_borrow_date = group['DateBorrowed'].max()
        last_borrow_dates.append(last_borrow_date)

        first_borrow_date = group['DateBorrowed'].min()
        first_borrow_dates.append(first_borrow_date)

        # Get the last used date
        last_used_date = group['DateReturned'].max()
        last_used_dates.append(last_used_date)

        first_used_date = group['DateReturned'].min()
        first_used_dates.append(first_used_date)

        range_duration = group['TotalDuration'].max() - group['TotalDuration'].min()

    def get_most_frequent_day(x):
        if pd.api.types.is_datetime64_any_dtype(x['DateBorrowed']):
            return x['DateBorrowed'].dt.day_name().mode()[0]
        else:
            return 'N/A'
    
    
    def get_most_frequent_month(x):
        if pd.api.types.is_datetime64_any_dtype(x['DateBorrowed']):
            return x['DateBorrowed'].dt.month_name().mode()[0]
        else:
            return 'N/A'

    frequency = eqgroup.size()
    total_duration = eqgroup['TotalDuration'].sum()
    average_duration = eqgroup['TotalDuration'].mean()
    max_duration = eqgroup['TotalDuration'].max()
    min_duration = eqgroup['TotalDuration'].min()
    median_duration = eqgroup['TotalDuration'].median()
    std_dev_duration = eqgroup['TotalDuration'].std()
    unique_dates = eqgroup['DateBorrowed'].nunique()
    most_frequent_day = eqgroup.apply(get_most_frequent_day)
    most_frequent_month = eqgroup.apply(get_most_frequent_month)
    # Create a new column 'Late Return' indicating whether the return is late (duration > 24 hours)
    borrower_df['Late Return'] = borrower_df['TotalDuration'] > 24
    current_date = datetime.now()
    

    # Count the number of late returns per UniqueID
    late_return = borrower_df.groupby('EquipmentName')['Late Return'].sum()
    # Create a new DataFrame with the statistics
    eqstats_df = pd.DataFrame({
        'EquipmentName': name_list,  # Get the first 'EquipmentName' from each group
        'Frequency': frequency,
        'Total Duration': total_duration,
        'Average Duration': average_duration,
        'Max Duration': max_duration,
        'Min Duration': min_duration,
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
    
    eqstats_df['Room'] = eqstats_df['EquipmentName'].map(name_to_room).fillna('Others')
    eqstats_df['Status'] = eqstats_df['Last Borrow Date'].apply(lambda x: 'Inactive' if (current_date - x) > timedelta(days=365) else 'Active')
    # Update the 'Frequency' in eqstats_df based on the EquipmentNames
    eqstats_df['Maintenance Type'] = eqstats_df['EquipmentName'].map(name_to_mainte).fillna('Unknown')
    eqstats_df['Maintenance Frequency'] = eqstats_df['EquipmentName'].map(name_to_frequency).fillna('Unknown')
      
    
    # Add a 'Quarter' column to borrower_df with the quarter number for each borrowing instance
    borrower_df['Quarter'] = borrower_df['DateTimeBorrowed'].dt.to_period('Q').dt.quarter

    # Group by 'EquipmentName' and 'Quarter' and sum the 'TotalDuration'
    quarterly_usage = borrower_df.groupby(['EquipmentName', 'Quarter'])['TotalDuration'].sum().reset_index()

    # Calculate peak quarters by finding the quarter with the maximum TotalDuration for each equipment
    peak_quarters = quarterly_usage.loc[quarterly_usage.groupby('EquipmentName')['TotalDuration'].idxmax()]

    # If you want to identify if the usage is fairly even across quarters
    threshold = 0.1  # Define a threshold for what you consider 'fair'
    peak_quarters.rename(columns={'Quarter': 'Peak Quarter'}, inplace=True)

    # Then, ensure that the 'Is Fair' calculation is correct
    quarterly_usage['Is Fair'] = quarterly_usage.groupby('EquipmentName')['TotalDuration'].transform(
        lambda x: (x.max() - x.min()) / x.max() < threshold
    )

    eqstats_df = eqstats_df.reset_index(drop=True)
    peak_quarters = peak_quarters.reset_index(drop=True)

    # Now merge 'peak_quarters' into 'eqstats_df'
    eqstats_df = eqstats_df.merge(peak_quarters[['EquipmentName', 'Peak Quarter']], on='EquipmentName', how='left')

    # Merge the 'Is Fair' column into 'eqstats_df'. Ensure that the merge is on 'EquipmentName'
    # and that the column exists in 'quarterly_usage' with the same name.
    eqstats_df = eqstats_df.merge(
        quarterly_usage[['EquipmentName', 'Is Fair']].drop_duplicates('EquipmentName'),
        on='EquipmentName',
        how='left'
    )
    eqstats_df = eqstats_df.merge(inventory_counts, left_on='EquipmentName', right_on='Name', how='left')


    # Drop duplicates from the 'equipment_stats' DataFrame to ensure each EquipmentName is unique
    eqstats_df.drop_duplicates(subset='EquipmentName', inplace=True)
    eqstats_df = eqstats_df.drop(columns=['Name'])

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
        'EquipmentName': 'nunique'  # Count unique EquipmentNames directly here
    }).rename(columns={'EquipmentName': 'Equipment Count'}).reset_index()

    print(room_stats.head())

    
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
    sched_df = sched_df.drop_duplicates()
    sched_df.to_json('static/sched.json', orient='records', indent=4)

    pass

def calculate_equipment():
        # Group the data by unique ID
    grouped = borrower_df.groupby('UniqueID')

    unique_ids_list = list(grouped.groups.keys())
    outliers = []
    last_used_dates = []
    first_used_dates = []
    last_borrow_dates = []
    first_borrow_dates = []

    all_days_of_week = list(range(7))  # 0 to 6
    all_hours_of_day = list(range(7, 18))  # 7 AM to 5 PM

    borrower_df['DateBorrowed'] = pd.to_datetime(borrower_df['DateBorrowed'], dayfirst=True, errors='coerce')
    borrower_df['DateReturned'] = pd.to_datetime(borrower_df['DateReturned'], dayfirst=True, errors='coerce')
    borrower_df['MONTH'] = borrower_df['DateBorrowed'].dt.month
    borrower_df['DAY OF WEEK'] = borrower_df['DateBorrowed'].dt.dayofweek
    borrower_df['YEAR'] = borrower_df['DateBorrowed'].dt.year

    time_format = '%H:%M:%S'  # Adjust this format to match your actual data

    # Parse TimeBorrowed and TimeReturned with the specified format
    borrower_df['Hour Borrowed'] = pd.to_datetime(borrower_df['TimeBorrowed'], format=time_format).dt.hour
    borrower_df['Hour Returned'] = pd.to_datetime(borrower_df['TimeReturned'], format=time_format).dt.hour

    # Calculate the total available time for the year (adjust based on actual available time)
    total_available_time = 24 * 5 * 4
    current_year = datetime.now().year
    years_list = list(range(2018, current_year + 1))

    unique_ids = borrower_df['UniqueID'].unique()
    all_days_of_week = list(range(7))  # 0 to 6 for days of the week

    
    # Group by 'UniqueID' and 'YEAR' for yearly statistics with additional calculations
    yearly_stats_df = borrower_df.groupby(['UniqueID', 'YEAR']).agg({
        'TotalDuration': ['sum', 'mean', 'min', 'max', 'size']  # Calculate sum, average, min, and max duration
    }).reset_index()

    # Flatten the MultiIndex columns created by the aggregation
    yearly_stats_df.columns = [' '.join(col).strip() for col in yearly_stats_df.columns.values]
 
    # Rename the columns for clarity
    yearly_stats_df.rename(columns={
        'TotalDuration sum': 'TotalDuration',
        'TotalDuration mean': 'AVERAGE DURATION',
        'TotalDuration min': 'MIN DURATION',
        'TotalDuration max': 'MAX DURATION',
        'TotalDuration size': 'FREQUENCY'
    }, inplace=True)

    complete_yearly_df = pd.DataFrame(list(product(unique_ids_list, years_list)), columns=['UniqueID', 'YEAR'])

    # Merge the complete DataFrame with 'yearly_stats_df' to include missing years
    yearly_stats_df = pd.merge(complete_yearly_df, yearly_stats_df, on=['UniqueID', 'YEAR'], how='left').fillna(0)

    # Calculate the yearly utilization percentage
    yearly_stats_df['YEAR UTILIZATION'] = (yearly_stats_df['TotalDuration'] / (8 * 5 * 52)) * 100


    # Convert the updated yearly DataFrame to JSON
    yearly_usage_json = yearly_stats_df.to_json(orient='records', date_format='iso', indent=4)

    # Create a DataFrame with all combinations of 'UniqueID' and 'MONTH'
    complete_monthly_df = pd.DataFrame(list(product(unique_ids_list, range(1, 13))),
                                    columns=['UniqueID', 'MONTH'])

    # Group by 'UniqueID' and 'MONTH' to calculate monthly statistics and frequency
    monthly_stats_df = borrower_df.groupby(['UniqueID', 'MONTH']).agg({
        'TotalDuration': ['sum', 'mean', 'min', 'max', 'size']  # Include 'size' for frequency
    }).reset_index()


    # Flatten the MultiIndex columns created by the aggregation
    monthly_stats_df.columns = [' '.join(col).strip() for col in monthly_stats_df.columns.values]

    # Rename the columns for clarity
    monthly_stats_df.rename(columns={
        'TotalDuration sum': 'TotalDuration',
        'TotalDuration mean': 'AVERAGE DURATION',
        'TotalDuration min': 'MIN DURATION',
        'TotalDuration max': 'MAX DURATION',
        'TotalDuration size': 'FREQUENCY'  # Rename 'size' to 'FREQUENCY'
    }, inplace=True)

    


    # Merge the complete DataFrame with the statistics DataFrame to include all months
    monthly_stats_df = pd.merge(complete_monthly_df, monthly_stats_df,
                                on=['UniqueID', 'MONTH'], how='left').fillna(0)

    # Calculate the 'MONTH UTILIZATION'
    monthly_stats_df['MONTH UTILIZATION'] = (monthly_stats_df['TotalDuration'] / total_available_time) * 100


    # Convert the updated monthly DataFrame to JSON
    monthly_stats_json = monthly_stats_df.to_json(orient='records', date_format='iso', indent=4)


    average_duration_per_day = borrower_df.groupby(['UniqueID', 'DAY OF WEEK'])['TotalDuration'].mean().reset_index(name='AVERAGE DURATION')

    # Create a complete DataFrame for all combinations of 'UniqueID' and 'DAY OF WEEK'
    complete_weekly_df = pd.DataFrame(list(product(unique_ids, all_days_of_week)), columns=['UniqueID', 'DAY OF WEEK'])

    OPERATIONAL_HOURS_PER_DAY = 24 * 7  # Adjust this value based on your specific situation

    # Group by 'UniqueID' and 'DAY OF WEEK' for weekly frequency statistics
    weekly_frequency_df = borrower_df.groupby(['UniqueID', 'DAY OF WEEK']).size().reset_index(name='FREQUENCY')

    # Calculate the total, maximum, and minimum duration per day of the week for each 'UniqueID'
    weekly_stats = borrower_df.groupby(['UniqueID', 'DAY OF WEEK'])['TotalDuration'].agg(['sum', 'max', 'min']).reset_index()

    # Rename the aggregated columns for clarity
    weekly_stats.rename(columns={'sum': 'TotalDuration', 'max': 'MAX DURATION', 'min': 'MIN DURATION'}, inplace=True)

    # Merge the complete DataFrame with 'weekly_frequency_df' to include missing days
    weekly_usage_df = pd.merge(complete_weekly_df, weekly_frequency_df, on=['UniqueID', 'DAY OF WEEK'], how='left').fillna(0)

    # Merge the additional stats into the weekly usage DataFrame
    weekly_usage_df = pd.merge(weekly_usage_df, weekly_stats, on=['UniqueID', 'DAY OF WEEK'], how='left').fillna(0)

    # Now, merge the average duration data into the weekly usage DataFrame
    weekly_usage_df = pd.merge(weekly_usage_df, average_duration_per_day, on=['UniqueID', 'DAY OF WEEK'], how='left').fillna(0)

    # Calculate the daily utilization as a new column in the DataFrame
    weekly_usage_df['DAILY UTILIZATION'] = (weekly_usage_df['TotalDuration'] / OPERATIONAL_HOURS_PER_DAY) * 100

    # Convert the updated DataFrame to JSON
    weekly_usage_json = weekly_usage_df.to_json(orient='records', date_format='iso', indent=4)
    def allocate_duration(row):
        # Check if 'DateTimeBorrowed' and 'DateTimeReturned' are already datetime objects
        start = row['DateTimeBorrowed']
        end = row['DateTimeReturned']

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
        if pd.api.types.is_datetime64_any_dtype(x['DateBorrowed']):
            return x['DateBorrowed'].dt.day_name().mode()[0]
        else:
            return 'N/A'
    
    
    def get_most_frequent_month(x):
        if pd.api.types.is_datetime64_any_dtype(x['DateBorrowed']):
            return x['DateBorrowed'].dt.month_name().mode()[0]
        else:
            return 'N/A'

    for unique_id, group in grouped:   
        # Check if there are at least two data points and variance is not zero
        if len(group['TotalDuration']) > 1 and np.var(group['TotalDuration']) != 0:
            z_scores = zscore(group['TotalDuration'])
        else:
            z_scores = np.full(len(group['TotalDuration']), np.nan)


        # Identify outliers
        outliers_condition = group['DaysDuration'] > 7
        outlier = group[outliers_condition]
        if outlier.empty:
            outliers.append('N/A')
        else:
            # Append a simple descriptor, such as the count of outliers, instead of the full DataFrame
            outliers.append(f"{len(outlier)} outliers over 7 days")

        # Get the last used date
        last_borrow_date = group['DateBorrowed'].max()
        last_borrow_dates.append(last_borrow_date)

        first_borrow_date = group['DateBorrowed'].min()
        first_borrow_dates.append(first_borrow_date)

        # Get the last used date
        last_used_date = group['DateReturned'].max()
        last_used_dates.append(last_used_date)

        first_used_date = group['DateReturned'].min()
        first_used_dates.append(first_used_date)

        range_duration = group['TotalDuration'].max() - group['TotalDuration'].min()
    
    # Calculate the statistics
    frequency = grouped.size()
    equipment_name = grouped['EquipmentName'].unique()
    total_duration = grouped['TotalDuration'].sum()
    average_duration = grouped['TotalDuration'].mean()
    max_duration = grouped['TotalDuration'].max()
    min_duration = grouped['TotalDuration'].min()
    median_duration = grouped['TotalDuration'].median()
    std_dev_duration = grouped['TotalDuration'].std()
    unique_dates = grouped['DateBorrowed'].nunique()
    most_frequent_day = grouped.apply(get_most_frequent_day)
    most_frequent_month = grouped.apply(get_most_frequent_month)
    # Create a new column 'Late Return' indicating whether the return is late (duration > 24 hours)
    borrower_df['Late Return'] = borrower_df['TotalDuration'] > 48

    # Count the number of late returns per UniqueID
    late_return = borrower_df.groupby('UniqueID')['Late Return'].sum()

    # Create a new DataFrame with the statistics
    stats_df = pd.DataFrame({
        'EquipmentName': equipment_name,
        'UniqueID': unique_ids_list,
        'Frequency': frequency,
        'TotalDuration': total_duration,
        'Average Duration': average_duration,
        'Max Duration': max_duration,
        'Min Duration': min_duration,
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


    # Ensure 'UniqueID' is a column in the stats_df DataFrame
    stats_df.reset_index(inplace=True, drop=True)

    # Ensure 'UniqueID' is a column in the inventory_df DataFrame
    inventory_df.reset_index(inplace=True, drop=True)

    # Ensure 'UniqueID' is a column in the inventory_df DataFrame
    calibration_df.reset_index(inplace=True, drop=True)

    # Convert date columns to datetime in calibration_df
    calibration_df['CalibrationDate'] = pd.to_datetime(calibration_df['CalibrationDate'], errors='coerce', dayfirst='true')
    calibration_df['CalibrationDue'] = pd.to_datetime(calibration_df['CalibrationDue'], dayfirst='true')

    # Now perform the subtraction to calculate 'Days Since Last Calibration'
    calibration_df['Days Since Last Calibration'] = (datetime.now() - calibration_df['CalibrationDate']).dt.days

    print(stats_df.head())

    inventory_df.drop_duplicates(subset='UniqueID', inplace=True)
    stats_df = pd.merge(stats_df, inventory_df[['UniqueID', 'MaintenanceType', 'FREQUENCY']], on='UniqueID', how='left')

    calibration_df.drop_duplicates(subset='UniqueID', inplace=True)
    stats_df = pd.merge(stats_df, calibration_df[['UniqueID', 'DaysSinceLastCalibration', 'CalibrationDue']], on='UniqueID', how='left')


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

    borrower_df['DateBorrowed'] = borrower_df['DateBorrowed'].apply(lambda x: x.strftime('%Y-%m-%d') if not pd.isnull(x) else '')
    borrower_df['DateReturned'] = borrower_df['DateReturned'].apply(lambda x: x.strftime('%Y-%m-%d') if not pd.isnull(x) else '')

    overall_json = borrower_df.to_json(orient='records')

    overall_data = json.loads(overall_json)

    # Create a list of dictionaries, each containing the 'UniqueID' and other data
    overall_list = []
    for item in overall_data:
        overall_list.append({
            "UniqueID": item['UniqueID'],
            "dateBorrowed": item['DateBorrowed'],
            "dateReturned": item['DateReturned'],
            "timeBorrowed": item['TimeBorrowed'],
            "timeReturned": item['TimeReturned'],
            "totalDuration": item['TotalDuration'],
        })

    # Save the list of dictionaries to a JSON file
    with open('static/overall.json', 'w') as json_file:
        json.dump(overall_list, json_file, indent=4)

    pass