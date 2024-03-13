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

app = Flask(__name__)

inventory_df = pd.read_csv(r"C:\Users\Niels\Desktop\Programming\Manifesting pasado programming\Datasets\Predictive Mainte\inventory.csv")
borrower_df = pd.read_csv(r"C:\Users\Niels\Desktop\Programming\Manifesting pasado programming\Datasets\Predictive Mainte\borrowersupdated.csv")
    

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

@app.route('/inactive')
def inactive():
    # Your code here to prepare any data you want to send to the template

    # Assuming inventory_df and borrowers_df are pandas DataFrames
    active_items = inventory_df[inventory_df['UniqueID'].isin(borrower_df['UniqueID'])]
    inactive_items = inventory_df[~inventory_df['UniqueID'].isin(borrower_df['UniqueID'])]

    active_items.to_json('static/active.json', orient='records')
    inactive_items.to_json('static/inactive.json', orient='records')

    return render_template('table.html')  # replace 'data' with your actual data

@app.route('/unique_ids')
def unique_ids():
    equipment_name = request.args.get('equipment_name', type=str)
    unique_ids = inventory_df[inventory_df['Name'] == equipment_name]['UniqueID'].unique().tolist()
    return jsonify(unique_ids=unique_ids)

@app.route('/equipment')
def equipment():
    # Load your data into a DataFrame
    borrower_df = pd.read_csv(r"C:\Users\Niels\Desktop\Programming\Manifesting pasado programming\Datasets\Predictive Mainte\borrowersupdated.csv")

    # Convert 'DATE' column to datetime
    borrower_df['DATE'] = pd.to_datetime(borrower_df['DATE'])

    # Group the data by month and 'UniqueID', then calculate the total quantity borrowed and the average time usage
    monthly_data = borrower_df.groupby([borrower_df['DATE'].dt.to_period('M'), 'UniqueID']).agg({'QUANTITY': 'sum', 'TOTAL DURATION': 'mean'})

    # Reset the index
    monthly_data.reset_index(inplace=True)

    # Convert the 'DATE' column back to datetime
    monthly_data['DATE'] = monthly_data['DATE'].dt.to_timestamp()

    # Total Duration of Usage per Month
    total_duration_per_month = monthly_data.groupby('DATE')['TOTAL DURATION'].sum().reset_index()

    # Convert 'DATE' to string
    total_duration_per_month['DATE'] = total_duration_per_month['DATE'].astype(str)

    # Peak Hours of Usage
    borrower_df['HOUR'] = borrower_df['DATE'].dt.hour
    peak_hours_of_usage = borrower_df.groupby(['HOUR', 'UniqueID']).size().reset_index(name='COUNT')

    # Usage Patterns Over Days of the Week
    borrower_df['DAY OF WEEK'] = borrower_df['DATE'].dt.dayofweek
    usage_patterns_over_days_of_week = borrower_df.groupby(['DAY OF WEEK', 'UniqueID']).size().reset_index(name='COUNT')

    # Borrowing Patterns Over Time
    borrowing_patterns_over_time = borrower_df.groupby('DATE')['TOTAL DURATION'].sum().reset_index()

    # Convert 'DATE' to string
    borrowing_patterns_over_time['DATE'] = borrowing_patterns_over_time['DATE'].astype(str)

    # Save the data to a JSON file
    graph_df = {
        'total_duration_per_month': total_duration_per_month.to_dict(orient='records'),
        'peak_hours_of_usage': peak_hours_of_usage.to_dict(orient='records'),
        'usage_patterns_over_days_of_week': usage_patterns_over_days_of_week.to_dict(orient='records'),
        'borrowing_patterns_over_time': borrowing_patterns_over_time.to_dict(orient='records')
    }
    
    borrower_df['DATE RETURNED'] = pd.to_datetime(borrower_df['DATE RETURNED'])
    
    # Group the data by unique ID
    grouped = borrower_df.groupby('UniqueID')

    unique_ids_list = list(grouped.groups.keys())
    correlations = []
    outliers = []
    last_used_dates = []

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
        last_used_date = group['DATE RETURNED'].max()
        last_used_dates.append(last_used_date)

    # Calculate the statistics
    frequency = grouped.size()
    total_duration = grouped['TOTAL DURATION'].sum()
    average_duration = grouped['TOTAL DURATION'].mean()
    max_duration = grouped['TOTAL DURATION'].max()
    min_duration = grouped['TOTAL DURATION'].min()

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
        'Last Used Date': last_used_dates,
    })

    # Save the DataFrame to a JSON file
    stats_df.to_json('static/stats.json', orient='records')

    # Get the unique equipment names from the inventory
    inventory_names = inventory_df['Name'].unique()

    return render_template('equipment.html', equipment_names=inventory_names)

if __name__ == '__main__':
    app.run(debug=True)