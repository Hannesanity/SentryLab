import sqlite3
import logging


def get_db_conn():
    conn = sqlite3.connect('datasets/predlab.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_data_from_db(query):
    try:
        conn = get_db_conn()
        cursor = conn.cursor()
        cursor.execute(query)
        result = cursor.fetchall()
        conn.close()
        return [dict(row) for row in result]
    except Exception as e:
        logging.error("Error executing query: %s", e)
        raise