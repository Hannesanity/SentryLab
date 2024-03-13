$(document).ready(function() {
  $('#dataTable').DataTable();
});

document.getElementById('uploadButton').addEventListener('click', function() {
document.getElementById('fileInput').click(); // Trigger the file input click event
});

document.getElementById('fileInput').addEventListener('change', function(event) {
const file = event.target.files[0];
readAndParseFile(file); // Read and parse the file when the file input changes
});

function readAndParseFile(file) {
Papa.parse(file, {
  header: true,
  complete: function(results) {
      var data = results.data;
      var tableElement = $('#dataTable');
      if ($.fn.dataTable.isDataTable('#dataTable')) {
          tableElement.DataTable().destroy(); // Destroy the existing DataTables instance
      }
      tableElement.empty(); // Empty the table element
      
      // Create thead and tbody
      var thead = $('<thead>').appendTo(tableElement);
      var tbody = $('<tbody>').appendTo(tableElement);

      // Create columns based on the first row
      var firstRow = data.shift(); // Remove and get the first row
      var tr = $('<tr>').appendTo(thead);
      $.each(firstRow, function(index, value) {
          $('<th>').text(index).appendTo(tr); // Create and append th elements
      });

      // Add remaining rows to tbody
      $.each(data, function(index, rowData) {
          var row = $('<tr>').appendTo(tbody);
          $.each(rowData, function(key, value) {
              $('<td>').text(value).appendTo(row); // Create and append td elements
          });
      });

      // Initialize DataTables
      tableElement.DataTable();
  }
});
}