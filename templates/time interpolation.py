# Import necessary libraries
import pandas as pd

# Load your data
# Replace 'incomplete_data.csv' with the path to your actual data file
df = pd.read_csv(r"C:\Users\Niels\Desktop\Programming\Manifesting pasado programming\Datasets\Predictive Mainte\datasets not complete.csv")

# Convert 'DATE', 'DATE RETURNED', 'TIME BORROWED' and 'TIME RETURNED' to datetime format
df['DATE'] = pd.to_datetime(df['DATE'])
df['DATE RETURNED'] = pd.to_datetime(df['DATE RETURNED'])
df['TIME BORROWED'] = pd.to_datetime(df['TIME BORROWED'], format='%I:%M %p')
df['TIME RETURNED'] = pd.to_datetime(df['TIME RETURNED'], format='%I:%M %p')

# Set 'DATE' as the index of the DataFrame (required for time-based interpolation)
df.set_index('DATE', inplace=True)

# Perform time-based interpolation
df['TIME BORROWED'].interpolate(method='time', inplace=True)
df['TIME RETURNED'].interpolate(method='time', inplace=True)

# Reset the index of the DataFrame
df.reset_index(inplace=True)
