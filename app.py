from flask import Flask, render_template, jsonify, request
import pandas as pd
import matplotlib.pyplot as plt
from scipy.stats import zscore
import numpy as np
import json
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import datetime as dt

app = Flask(__name__)

inventory_df = pd.read_csv(r"C:\Users\Niels\Desktop\Programming\Manifesting pasado programming\Datasets\Predictive Mainte\inventory.csv")
borrower_df = pd.read_csv(r"C:\Users\Niels\Desktop\Programming\Manifesting pasado programming\Datasets\Predictive Mainte\test.csv")
    

# Initialize the lemmatizer
lemmatizer = WordNetLemmatizer()

def normalize_text(text):
    # Tokenize the text
    words = word_tokenize(text)
    
    # Remove stop words
    words = [word for word in words if word not in stopwords.words('english')]
    
    # Lemmatize the words
    words = [lemmatizer.lemmatize(word) for word in words]
    
    # Join the words back into a single string
    text = ' '.join(words)
    
    return text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/inventory')
def inventory():
    # Group by equipment name to calculate statistics
    borrower_df['DATETIME BORROWED'] = pd.to_datetime(borrower_df['DATETIME BORROWED'], errors='coerce')
    borrower_df['DATETIME RETURNED'] = pd.to_datetime(borrower_df['DATETIME RETURNED'], errors='coerce')

    # Calculate the duration for each equipment usage in hours
    borrower_df['DURATION (HRS)'] = (borrower_df['DATETIME RETURNED'] - borrower_df['DATETIME BORROWED']).dt.total_seconds() / 3600

    equipment_stats = borrower_df.groupby('EQUIPMENT NAME').agg({
        'QUANTITY': 'sum',  # Total borrowed quantity
        'DURATION (HRS)': 'sum',  # Total duration
        'DATETIME BORROWED': 'max'  # Last borrowed date
    }).rename(columns={
        'QUANTITY': 'Total Borrowed Quantity',
        'DURATION (HRS)': 'Total Duration (hrs)',
        'DATETIME BORROWED': 'Last Borrowed Date'
    })

    # Calculate average duration
    equipment_stats['Average Duration (hrs)'] = equipment_stats['Total Duration (hrs)'] / equipment_stats['Total Borrowed Quantity']

    # Add active/inactive status based on your criteria (placeholder values)
    equipment_stats['Active/Inactive Status'] = 'Active'  # Placeholder: Update with actual criteria

    # Add maintenance frequency based on your criteria (placeholder values)
    equipment_stats['Maintenance Frequency'] = 'Monthly'  # Placeholder: Update with actual criteria

    # Calculate utilization per day (placeholder values)
    # Assuming 8 hours of available time per day
    available_time_per_day = 10
    equipment_stats['Utilization per day (%)'] = (equipment_stats['Total Duration (hrs)'] / (available_time_per_day * borrower_df['DATETIME BORROWED'].nunique())) * 100

    # After grouping and aggregating, reset the index to turn 'EQUIPMENT NAME' into a column
    equipment_stats.reset_index(inplace=True)

    # Now, when you save to JSON, 'EQUIPMENT NAME' will be included
    equipment_stats.to_json('static/equip.json', orient='records')
    return render_template('inventory.html')

@app.route('/inactive')
def inactive():
    # Assuming inventory_df and borrowers_df are pandas DataFrames
    active_items = inventory_df[inventory_df['UniqueID'].isin(borrower_df['UniqueID'])]
    inactive_items = inventory_df[inventory_df['UniqueID'].isin(borrower_df['UniqueID'])]

    # Add 'IsActive' column
    active_items['IsActive'] = True
    inactive_items['IsActive'] = False

    # Combine active and inactive items
    all_items = pd.concat([active_items, inactive_items])

    # Convert to JSON
    all_items.to_json('static/items.json', orient='records')

    return render_template('table.html')  # replace 'data' with your actual data

@app.route('/unique_ids')
def unique_ids():
    equipment_name = request.args.get('equipment_name', type=str)
    unique_ids = inventory_df[inventory_df['Name'] == equipment_name]['UniqueID'].unique().tolist()
    return jsonify(unique_ids=unique_ids)

@app.route('/equipment')
def equipment():
    # Group the data by unique ID
    grouped = borrower_df.groupby('UniqueID')

    unique_ids_list = list(grouped.groups.keys())
    correlations = []
    outliers = []
    last_used_dates = []
    first_used_dates = []
    last_borrow_dates = []
    first_borrow_dates = []

    borrower_df['DATE'] = pd.to_datetime(borrower_df['DATE'], format='%d/%m/%Y')
    borrower_df['DATE RETURNED'] = pd.to_datetime(borrower_df['DATE RETURNED'], format='%d/%m/%Y')

    # Extract 'MONTH' and 'DAY OF WEEK' from 'DATE'
    borrower_df['MONTH'] = borrower_df['DATE'].dt.month
    borrower_df['DAY OF WEEK'] = borrower_df['DATE'].dt.dayofweek

    # Convert 'TIME BORROWED' and 'TIME RETURNED' to datetime and extract 'HOUR'
    borrower_df['HOUR BORROWED'] = pd.to_datetime(borrower_df['TIME BORROWED']).dt.hour
    borrower_df['HOUR RETURNED'] = pd.to_datetime(borrower_df['TIME RETURNED']).dt.hour

    # Define a function to calculate uptime flag
    def calculate_uptime_flag(row):
        if pd.isna(row['HOUR RETURNED']):
            return 1
        elif row['HOUR BORROWED'] >= row['HOUR RETURNED']:
            return 0
        else:
            return 1

    # Apply the function to create the 'UPTIME_FLAG' column
    borrower_df['UPTIME_FLAG'] = borrower_df.apply(calculate_uptime_flag, axis=1)

    # Calculate 'UPTIME' and 'IDLE TIME'
    borrower_df['UPTIME'] = borrower_df.apply(lambda row: (row['DATE RETURNED'] - row['DATE']).total_seconds() / 3600, axis=1)
    borrower_df['IDLE TIME'] = 1 - borrower_df['UPTIME']

    # Group by 'UniqueID' and 'MONTH' for monthly statistics
    monthly_stats_df = borrower_df.groupby(['UniqueID', 'MONTH']).agg({
        'QUANTITY': 'sum',
        'TOTAL DURATION': 'sum'
    }).reset_index()

    # Convert monthly DataFrame to JSON
    monthly_stats_json = monthly_stats_df.to_json(orient='records', date_format='iso')

    # Group by 'UniqueID' and 'DAY OF WEEK' for weekly statistics
    weekly_usage_df = borrower_df.groupby(['UniqueID', 'DAY OF WEEK']).size().reset_index(name='FREQUENCY')

    # Convert weekly DataFrame to JSON
    weekly_usage_json = weekly_usage_df.to_json(orient='records', date_format='iso')

    # Group by 'UniqueID' and 'HOUR BORROWED' for daily statistics
    idle_time_per_hour = borrower_df.groupby(['UniqueID', 'HOUR BORROWED'])['IDLE TIME'].mean().reset_index(name='IDLE TIME PER HOUR')
    active_borrowings_per_hour = borrower_df.groupby(['UniqueID', 'HOUR BORROWED']).size().reset_index(name='ACTIVE BORROWINGS')

    # Merge active borrowings with idle time per hour
    hourly_stats_df = pd.merge(active_borrowings_per_hour, idle_time_per_hour, on=['UniqueID', 'HOUR BORROWED'])

    # Merge the UPTIME_FLAG into the hourly_stats_df
    hourly_stats_df = pd.merge(hourly_stats_df, borrower_df[['UniqueID', 'HOUR BORROWED', 'UPTIME_FLAG']].drop_duplicates(), on=['UniqueID', 'HOUR BORROWED'])

    # Ensure the DataFrame contains all the required columns for graphing
    hourly_stats_df = hourly_stats_df[['UniqueID', 'HOUR BORROWED', 'ACTIVE BORROWINGS', 'IDLE TIME PER HOUR', 'UPTIME_FLAG']]

    # Convert daily DataFrame to JSON
    hourly_usage_json = hourly_stats_df.to_json(orient='records', date_format='iso')
    # Save each JSON to a file
    with open('static/monthly.json', 'w') as f:
        f.write(monthly_stats_json)

    with open('static/weekly.json', 'w') as f:
        f.write(weekly_usage_json)

    with open('static/hourly.json', 'w') as f:
        f.write(hourly_usage_json)

    for unique_id, group in grouped:   
        # Calculate the z-scores of the 'Total Duration'
        z_scores = zscore(group['TOTAL DURATION'])

        correlation = group['QUANTITY'].corr(group['TOTAL DURATION'])
        if pd.isnull(correlation):
            correlation = 'N/A'  # or some other placeholder value
        correlations.append(correlation)

        # Identify outliers
        outlier = group[np.abs(z_scores) > 3]
        if outlier.empty:
            outlier = 'N/A'  # or some other placeholder value
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

        range_duration = grouped['TOTAL DURATION'].max() - grouped['TOTAL DURATION'].min()

        monthly_stats = borrower_df.groupby(['UniqueID', 'MONTH']).agg({
            'QUANTITY': 'sum',
            'TOTAL DURATION': 'sum'
        }).reset_index()
       
    def get_most_frequent_day(x):
        if pd.api.types.is_datetime64_any_dtype(x['DATE']):
            return x['DATE'].dt.day_name().mode()[0]
        else:
            return 'N/A'
    most_frequent_day = grouped.apply(get_most_frequent_day)
    
    def get_most_frequent_month(x):
        if pd.api.types.is_datetime64_any_dtype(x['DATE']):
            return x['DATE'].dt.month_name().mode()[0]
        else:
            return 'N/A'
    most_frequent_month = grouped.apply(get_most_frequent_month)
    # Calculate the statistics
    frequency = grouped.size()
    total_duration = grouped['TOTAL DURATION'].sum()
    average_duration = grouped['TOTAL DURATION'].mean()
    max_duration = grouped['TOTAL DURATION'].max()
    min_duration = grouped['TOTAL DURATION'].min()
    median_duration = grouped['TOTAL DURATION'].median()
    std_dev_duration = grouped['TOTAL DURATION'].std()
    unique_dates = grouped['DATE'].nunique()
    
    # Create a new DataFrame with the statistics
    stats_df = pd.DataFrame({
        'UniqueID': unique_ids_list,
        'Frequency': frequency,
        'Total Duration': total_duration,
        'Average Duration': average_duration,
        'Max Duration': max_duration,
        'Min Duration': min_duration,
        'Correlation': correlations,
        'Outliers': outliers,
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

    stats_df.to_json('static/stats.json', orient='records')

    # Get equipment names from inventory
    inventory_names = inventory_df['Name'].unique()

    return render_template('equipment.html', equipment_names=inventory_names)

@app.route('/card')
def card():
    return render_template('card.html')

if __name__ == '__main__':
    app.run(debug=True)