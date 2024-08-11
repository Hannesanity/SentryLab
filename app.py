from flask import Flask, render_template, jsonify, request, send_file
import pandas as pd
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from datetime import datetime, timedelta
import logging
from flask_caching import Cache
import re
# Importing other scripts
import db_util
import mltrain
import stats


app = Flask(__name__)

# Configure Flask-Caching
cache = Cache(config={'CACHE_TYPE': 'simple'})
cache.init_app(app)



logging.basicConfig(level=logging.DEBUG)


inventory_df = pd.read_csv("datasets/Inventory.csv")
borrower_df = pd.read_csv("datasets/BorrowerSlip.csv")
calibration_df = pd.read_csv("datasets/Calibration.csv")
ml_df = pd.read_csv("datasets/Predictions.csv")

# Initialize the lemmatizer
lemmatizer = WordNetLemmatizer()


# Preparation of Datetime
if not pd.api.types.is_datetime64_any_dtype(borrower_df['DateTime Borrowed']):
    borrower_df['DateTime Borrowed'] = pd.to_datetime(borrower_df['DateTime Borrowed'], errors='coerce')

if not pd.api.types.is_datetime64_any_dtype(borrower_df['DateTime Returned']):
    borrower_df['DateTime Returned'] = pd.to_datetime(borrower_df['DateTime Returned'], errors='coerce')

# Train models


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

@app.route('/table')
def table():
    
    return render_template('table.html')

@app.route('/update')
def update(): 
    return render_template('update.html')

@app.route('/process_data', methods=['POST'])
def process_data():
    # The calculate_room function (with required modifications if any)
    stats.calculate_room()
    stats.calculate_equipment()
    return jsonify({"status": "processing complete"})

@app.route('/train_data', methods=['POST'])
def train_data():
    mltrain.MLR_Train()
    mltrain.KNN_Train()
    mltrain.SVR_Train()
    return jsonify({"status": "training complete"})

@app.route('/upload/<data_type>', methods=['POST'])
def upload_file(data_type):
    data_mappings = {
        'inventory': {
            'table': 'inventory',
            'expected_columns': [
                'UniqueID', 'Name', 'Room', 'Item No.', 'Serial No.', 'Brand', 
                'Maintenance Type', 'Maintenance Frequency', 'Status', 'IsActive', 
                'Estimated Useful Life', 'Factors Affecting Health'
            ],
            'update_columns': [
                'UniqueID', 'Name', 'Room', 'ItemNo', 'SerialNo', 'Brand', 
                'MaintenanceType', 'Frequency', 'Status', 'IsActive', 
                'EstimatedUsefulLife', 'FactorsAffectingHealth'
            ],
        },
        'borrower': {
            'table': 'borrowerslip',
            'expected_columns': [
                'Date Borrowed', 'Date Returned', 'Equipment Name', 'Time Borrowed', 
                'Time Returned', 'Days Duration', 'Time Duration', 'Total Duration', 
                'DateTime Borrowed', 'DateTime Returned', 'UniqueID', 'isReturned'
            ],
            'update_columns': [
                'DateBorrowed', 'DateReturned', 'EquipmentName', 'TimeBorrowed', 
                'TimeReturned', 'DaysDuration', 'TimeDuration', 'TotalDuration', 
                'DateTimeBorrowed', 'DateTimeReturned', 'UniqueID', 'isReturned'
            ]
        },
        'calibration': {
            'table': 'calibration',
            'expected_columns': [
                'UniqueID', 'Type of Service', 'Description', 
                'Manufacturer', 'Model Number', 'Serial Number', 'Procedure Number', 
                'As Left', 'Order Number', 'Calibration Location', 'Date Received', 
                'Calibration Date', 'Calibration Due', 'Relative Humidity', 
                'Ambient Temperature'
            ],
            'update_columns': [
                'UniqueID', 'TypeofService', 'Description', 
                'Manufacturer', 'ModelNo', 'SerialNo', 'ProcedureNo', 
                'AsLeft', 'OrderNo', 'CalibrationLoc', 'DateReceived', 
                'CalibrationDate', 'CalibrationDue', 'RelativeHumidity', 
                'AmbientTemperature'
            ]
        }
    }

    if data_type not in data_mappings:
        logging.error(f"Invalid data type: {data_type}")
        return jsonify({'error': 'Invalid data type'}), 400

    mapping = data_mappings[data_type]
    table = mapping['table']
    expected_columns = mapping['expected_columns']
    update_columns = mapping['update_columns']

    try:
        if 'file' not in request.files:
            logging.error("No file part in the request")
            return jsonify({'error': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            logging.error("No selected file")
            return jsonify({'error': 'No selected file'}), 400
        if file and file.filename.endswith('.csv'):
            logging.debug("Reading CSV file")
            df = pd.read_csv(file)

            print(df.columns)   

            # Handle date and time conversion only for 'borrower' data type
            if data_type == 'borrower':
                # Convert date and time columns
                date_columns = ['Date Borrowed', 'Date Returned']
                time_columns = ['Time Borrowed', 'Time Returned']

                for col in date_columns:
                    df[col] = pd.to_datetime(df[col], format='%d/%m/%Y', errors='coerce').dt.strftime('%Y-%m-%d')

                for col in time_columns:
                    df[col] = pd.to_datetime(df[col], format='%I:%M %p').dt.strftime('%H:%M:%S')

                # Combine date and time columns to create datetime columns in the correct format
                df['DateTime Borrowed'] = pd.to_datetime(df['Date Borrowed'] + ' ' + df['Time Borrowed']).dt.strftime('%Y-%m-%d %H:%M:%S')
                df['DateTime Returned'] = pd.to_datetime(df['Date Returned'] + ' ' + df['Time Returned']).dt.strftime('%Y-%m-%d %H:%M:%S')

                # Convert float hours to timedelta
                df['Time Duration'] = pd.to_timedelta(df['Time Duration'], unit='h')
                df['Total Duration'] = pd.to_timedelta(df['Total Duration'], unit='h')

                # Convert timedelta to string in HH:MM:SS format
                df['Time Duration'] = df['Time Duration'].apply(lambda x: f"{int(x.total_seconds() // 3600):02d}:{int((x.total_seconds() % 3600) // 60):02d}")
                df['Total Duration'] = df['Total Duration'].apply(lambda x: f"{int(x.total_seconds() // 3600):02d}:{int((x.total_seconds() % 3600) // 60):02d}")

            elif data_type == 'inventory':
                # Check for duplicate UniqueID values
                duplicate_ids = df[df.duplicated(subset=['UniqueID'], keep=False)]
                if not duplicate_ids.empty:
                    logging.error(f"Duplicate UniqueID values found: {duplicate_ids['UniqueID'].tolist()}")
                    return jsonify({'error': f'Duplicate UniqueID values found: {duplicate_ids["UniqueID"].tolist()}'}), 400

            # Check for missing columns
            missing_columns = [col for col in expected_columns if col not in df.columns]
            if missing_columns:
                logging.error(f"Missing columns: {', '.join(missing_columns)}")
                return jsonify({'error': f'Missing columns: {", ".join(missing_columns)}'}), 400

            # Ensure all NaN values are converted to None
            df = df.where(pd.notnull(df), None)

            

            conn = db_util.get_db_conn()
            cursor = conn.cursor()

            # Upsert logic for updating existing records or inserting new ones
            for _, row in df.iterrows():
                insert_values = tuple(row[expected_columns])
                unique_id = row['UniqueID']

                if data_type == 'calibration':
                    cursor.execute(
                        f"""
                        INSERT INTO {table} ({', '.join(update_columns)}) 
                        VALUES ({','.join(['?'] * len(update_columns))})
                        """,
                        insert_values
                    )
                    logging.debug(f"Inserted row into {table}")

                else:
                    cursor.execute(
                        f"""
                        INSERT INTO {table} ({', '.join(update_columns)}) 
                        VALUES ({','.join(['?'] * len(update_columns))})
                        ON CONFLICT(UniqueID) DO UPDATE SET 
                        {', '.join([f"{col}=excluded.{col}" for col in update_columns])}
                        """,
                        insert_values
                    )
                    logging.debug(f"Inserted row with UniqueID {unique_id} into {table}")

            conn.commit()
            conn.close()
            logging.info(f"File successfully uploaded and data updated in {table}")
            
            # Invalidate the cache for the specific data type after updating the database
            cache.delete(data_type)

            return jsonify({'success': 'File successfully uploaded and data updated'})
        
        else:
            logging.error("Invalid file format")
            return jsonify({'error': 'Invalid file format'})
    except Exception as e:
        logging.error(f"Error uploading file: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500



@app.route('/data/inventory', methods=['GET'])
def get_inventory_data():
    try:
        # Get parameters from DataTables
        draw = request.args.get('draw', type=int)
        start = request.args.get('start', type=int)
        length = request.args.get('length', type=int)
        search_value = request.args.get('search[value]')

        # Base query
        query = "SELECT UniqueID, Name, Room, ItemNo, SerialNo, Brand FROM Inventory"
        count_query = "SELECT COUNT(*) as count FROM Inventory"

        # Apply search if present
        if search_value:
            search_clause = f" WHERE UniqueID LIKE '%{search_value}%' OR Name LIKE '%{search_value}%'"
            query += search_clause
            count_query += search_clause

        # Get total record count
        total_records = db_util.get_data_from_db(count_query)[0]['count']

        # Apply pagination
        query += f" LIMIT {length} OFFSET {start}"

        # Get paginated data
        result = db_util.get_data_from_db(query)

        return jsonify({
            'draw': draw,
            'recordsTotal': total_records,
            'recordsFiltered': total_records,
            'data': result
        })
    except Exception as e:
        logging.error("Error fetching inventory data: %s", e)
        return jsonify({'error': str(e)}), 500

@app.route('/data/borrower', methods=['GET'])
def get_borrower_data():
    try:
        draw = request.args.get('draw', type=int)
        start = request.args.get('start', type=int)
        length = request.args.get('length', type=int)
        search_value = request.args.get('search[value]')

        query = "SELECT BorrowerSlipID, UniqueID, EquipmentName, DateBorrowed, TimeBorrowed, DateTimeBorrowed, DateReturned, TimeReturned, DateTimeReturned, TotalDuration FROM BorrowerSlip"
        count_query = "SELECT COUNT(*) as count FROM BorrowerSlip"

        if search_value:
            search_clause = f" WHERE BorrowerSlipID LIKE '%{search_value}%' OR UniqueID LIKE '%{search_value}%' OR EquipmentName LIKE '%{search_value}%'"
            query += search_clause
            count_query += search_clause

        total_records = db_util.get_data_from_db(count_query)[0]['count']

        query += f" LIMIT {length} OFFSET {start}"

        result = db_util.get_data_from_db(query)

        # Convert timedelta objects to strings
        for row in result:
            if 'TotalDuration' in row and isinstance(row['TotalDuration'], timedelta):
                td = row['TotalDuration']
                row['TotalDuration'] = f"{int(td.total_seconds() // 3600):02d}:{int((td.total_seconds() % 3600) // 60):02d}"

        return jsonify({
            'draw': draw,
            'recordsTotal': total_records,
            'recordsFiltered': total_records,
            'data': result
        })
    except Exception as e:
        logging.error("Error fetching borrower data: %s", e)
        return jsonify({'error': str(e)}), 500

@app.route('/data/calibration', methods=['GET'])
def get_calibration_data():
    try:
        draw = request.args.get('draw', type=int)
        start = request.args.get('start', type=int)
        length = request.args.get('length', type=int)
        search_value = request.args.get('search[value]')

        query = """
        SELECT CalibrationID, UniqueID, TypeOfService, Description, Manufacturer, 
        ModelNo, SerialNo, ProcedureNo, AsLeft, OrderNo, CalibrationLoc, DateReceived, 
        CalibrationDate, CalibrationDue, RelativeHumidity, AmbientTemperature 
        FROM calibration
        """
        count_query = "SELECT COUNT(*) as count FROM calibration"

        if search_value:
            search_clause = f" WHERE CalibrationID LIKE '%{search_value}%' OR UniqueID LIKE '%{search_value}%' OR TypeOfService LIKE '%{search_value}%'"
            query += search_clause
            count_query += search_clause

        total_records = db_util.get_data_from_db(count_query)[0]['count']

        query += f" LIMIT {length} OFFSET {start}"

        result = db_util.get_data_from_db(query)

        return jsonify({
            'draw': draw,
            'recordsTotal': total_records,
            'recordsFiltered': total_records,
            'data': result
        })
    except Exception as e:
        logging.error("Error fetching calibration data: %s", e)
        return jsonify({'error': str(e)}), 500
    

    
@app.route('/add/<data_type>', methods=['POST'])
def add_data(data_type):
    data_mappings = {
        'inventory': 'inventory',
        'borrower': 'borrowerslip',
        'calibration': 'calibration'
    }

    if data_type not in data_mappings:
        return jsonify({'error': 'Invalid data type'}), 400

    table = data_mappings[data_type]
    data = request.json

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        if table == 'inventory':
            unique_id = generate_unique_id(data)
            data['UniqueID'] = unique_id

        elif table == 'borrowerslip':
            # Ensure DateBorrowed and TimeBorrowed are set
            now = datetime.now()
            data['DateBorrowed'] = data.get('DateBorrowed') or now.strftime('%Y-%m-%d')
            data['TimeBorrowed'] = data.get('TimeBorrowed') or now.strftime('%H:%M')

            # Ensure TimeBorrowed is in the correct format
            try:
                parsed_time = datetime.strptime(data['TimeBorrowed'], '%H:%M')
                data['TimeBorrowed'] = parsed_time.strftime('%H:%M:%S')
            except ValueError:
                data['TimeBorrowed'] = now.strftime('%H:%M:%S')

            # Combine DateBorrowed and TimeBorrowed into DateTimeBorrowed
            data['DateTimeBorrowed'] = f"{data['DateBorrowed']} {data['TimeBorrowed']}"

            if data.get('isReturned') == 1:  # Change '1' to 1 if it's sent as an integer
                # Ensure DateReturned and TimeReturned are set
                data['DateReturned'] = data.get('DateReturned') or now.strftime('%Y-%m-%d')
                data['TimeReturned'] = data.get('TimeReturned') or now.strftime('%H:%M')

                # Ensure TimeReturned is in the correct format
                try:
                    parsed_time = datetime.strptime(data['TimeReturned'], '%H:%M')
                    data['TimeReturned'] = parsed_time.strftime('%H:%M:%S')
                except ValueError:
                    data['TimeReturned'] = now.strftime('%H:%M:%S')

                # Combine DateReturned and TimeReturned into DateTimeReturned
                data['DateTimeReturned'] = f"{data['DateReturned']} {data['TimeReturned']}"

                # Calculate durations
                borrowed = datetime.strptime(data['DateTimeBorrowed'], "%Y-%m-%d %H:%M:%S")
                returned = datetime.strptime(data['DateTimeReturned'], "%Y-%m-%d %H:%M:%S")
                duration = returned - borrowed

                data['DaysDuration'] = duration.days
                data['TimeDuration'] = str(duration).split(', ')[-1]  # Extract time part
                data['TotalDuration'] = str(duration)
            else:
                # If not returned, set default values
                data['isReturned'] = 0
                data['DateReturned'] = None
                data['TimeReturned'] = None
                data['DateTimeReturned'] = None
                data['DaysDuration'] = None
                data['TimeDuration'] = None
                data['TotalDuration'] = None

        # Filter out any keys with None values
        filtered_data = {k: v for k, v in data.items() if v is not None}
        
        columns = ", ".join(filtered_data.keys())
        placeholders = ", ".join(['?'] * len(filtered_data))
        values = tuple(filtered_data.values())

        conn = db_util.get_db_conn()
        cursor = conn.cursor()
        
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
        logging.info(f"Executing query: {query}")
        logging.info(f"With values: {values}")
        
        cursor.execute(query, values)
        conn.commit()

        # Get the ID of the inserted row
        inserted_id = cursor.lastrowid

        conn.close()

        return jsonify({'success': 'Data added successfully', 'id': inserted_id})
    except Exception as e:
        logging.error(f"Error adding data to {table}: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/update/<data_type>', methods=['POST'])
def update_data(data_type):
    data_mappings = {
        'inventory': 'inventory',
        'borrower': 'borrowerslip',
        'calibration': 'calibration'
    }

    if data_type not in data_mappings:
        return jsonify({'error': 'Invalid data type'}), 400
    
    logging.info(f"Received update request for {data_type}")
    logging.info(f"Received data: {request.json}")

    table = data_mappings[data_type]
    data = request.json

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        conn = db_util.get_db_conn()
        cursor = conn.cursor()
        
        # Generate UniqueID if updating inventory and it requires it
        if table == 'inventory':
            unique_id = generate_unique_id(data)
            data['UniqueID'] = unique_id
        
        # Extract the primary key value and remove it from the data dictionary
        primary_key_field = {
            'inventory': 'UniqueID',
            'borrowerslip': 'BorrowerSlipID',
            'calibration': 'CalibrationID'
        }[table]

        primary_key_value = data.get(primary_key_field)

        if not primary_key_value:
            return jsonify({'error': f'{primary_key_field} is required to update records'}), 400

        # Remove the primary key from the data to update other fields
        data.pop(primary_key_field, None)

        # Filter out any keys with None values and prepare the set clause
        filtered_data = {k: v for k, v in data.items() if v is not None}
        set_clause = ", ".join([f"{k} = ?" for k in filtered_data.keys()])
        values = tuple(filtered_data.values()) + (primary_key_value,)

        # Construct and execute the update query
        query = f"UPDATE {table} SET {set_clause} WHERE {primary_key_field} = ?"
        logging.info(f"Executing query: {query}")
        logging.info(f"With values: {values}")

        cursor.execute(query, values)
        conn.commit()

        conn.close()

        return jsonify({'success': 'Data updated successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


    
@app.route('/delete/<data_type>', methods=['DELETE'])
def delete_data(data_type):
    print(f"Received delete request for data_type: {data_type}")
    try:
        data_mappings = {
            'inventory': 'inventory',
            'calibration': 'calibration',
            'borrower': 'borrower'
        }

        if data_type not in data_mappings:
            print("Invalid data type received.")
            return jsonify({'error': 'Invalid data type'}), 400

        table = data_mappings[data_type]
        data = request.json

        # Determine which table to delete from based on the table_name
        if table == 'inventory':
            delete_query = "DELETE FROM inventory WHERE UniqueID = ?"
            unique_id = data.get('UniqueID')
        elif table == 'borrower':
            delete_query = "DELETE FROM borrowerslip WHERE BorrowerSlipID = ?"
            unique_id = data.get('BorrowerSlipID')
        elif table == 'calibration':
            delete_query = "DELETE FROM calibration WHERE CalibrationID = ?"
            unique_id = data.get('CalibrationID')
        else:
            print("Invalid table name.")
            return jsonify({'error': 'Invalid table name'}), 400

        if not unique_id:
            print("No ID provided for deletion.")
            return jsonify({'error': 'No ID provided'}), 400

        print(f"Executing query: {delete_query} with ID {unique_id}")
        conn = db_util.get_db_conn()
        cursor = conn.cursor()
        
        cursor.execute(delete_query, (unique_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record deleted successfully'})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/export/<data_type>', methods=['POST'])
def export_data(data_type):
    data_mappings = {
        'inventory': 'inventory',
        'borrower': 'borrowerslip',
        'calibration': 'calibration'
    }

    if data_type not in data_mappings:
        print("Invalid data type received.")
        return jsonify({'error': 'Invalid data type'}), 400

    table = data_mappings[data_type]

    export_filename = {
        'inventory': 'Inventory.csv',
        'borrowerslip': 'BorrowerSlip.csv',
        'calibration': 'Calibration.csv'
    }
    filename = export_filename.get(table)

    try:
        conn = db_util.get_db_conn()
        
        # Construct and execute the update query
        query = f"SELECT * FROM {table}"
        export_df = pd.read_sql_query(query, conn)
        export_path = f'datasets/{filename}'

        export_df.to_csv(export_path)

        conn.close()

        return send_file(export_path, as_attachment=True, download_name=filename)

    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


    
@app.route('/get_inventory_for_borrower', methods=['GET'])
def get_inventory_for_borrower():
    try:
        conn = db_util.get_db_conn()
        cursor = conn.cursor()
        
        query = "SELECT UniqueID, Name, ItemNo FROM inventory WHERE isBorrowed = 0"
        cursor.execute(query)
        
        inventory_items = [{'UniqueID': row[0], 'Name': row[1], 'ItemNo': row[2]} for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify({'success': True, 'inventory': inventory_items})
    
    except Exception as e:
        logging.error(f"Error fetching inventory for borrower: {str(e)}")
        return jsonify({'error': str(e)}), 500

def generate_unique_id(data):
    # Fill missing 'Room' with 'NoRoom'
    room = data.get('Room', 'NA')
    if not room:
        room = 'NA'
    room = room.replace(' ', '')

    # Extract first letters of 'Name'
    name = data.get('Name', '')
    name_first_letters = ''.join([word[0] for word in str(name).split()][:3]) if pd.notnull(name) else ''

    # Extract first letters of 'Brand'
    brand = data.get('Brand', '')
    brand_first_letters = ''.join([word[0] for word in str(brand).split()][:2]) if brand != '-' else ''

    # Take first five alphanumeric characters of 'SerialNo.'
    serial_no = str(data.get('SerialNo', ''))
    short_serial_no = re.sub(r'\W+', '', serial_no)[:5]

    # Concatenate parts to form 'UniqueID'
    item_no = str(data.get('ItemNo', ''))
    unique_id = f"{room}{name_first_letters}{brand_first_letters}{short_serial_no}{item_no}"

    # Remove non-alphanumeric characters from 'UniqueID'
    unique_id = re.sub(r'\W+', '', unique_id)

    return unique_id


if __name__ == '__main__':
    app.run(debug=True)