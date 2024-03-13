const mysql = require('mysql');
const Papa = require('papaparse');
const fs = require('fs');

// Parse the CSV file
Papa.parse(fs.createReadStream('path/to/your/file.csv'), {
  header: true,
  complete: function(results) {
    // Connect to the database
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'predlab'
    });

    connection.connect();

    // Loop through the data and insert each row into the database
    results.data.forEach(row => {
      connection.query('INSERT INTO your-table SET ?', row, function(error, results, fields) {
        if (error) throw error;
        // Row inserted successfully
      });
    });

    connection.end();
  }
});
