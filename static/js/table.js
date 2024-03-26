$(document).ready(function() {
    var inactiveTable = $('#inactive-table-body').DataTable();
    var activeTable = $('#active-table-body').DataTable();

    $.getJSON('/static/items.json', function(data) {
        data.forEach(function(item, index) {
            // Prepare the row data
            var rowData = [
                index + 1,
                item['Item No.'],
                item['Name'],
                item['UniqueID'],
                item['Room'],
                item['Brand']
            ];

            // Add the row to the appropriate table
            if (item.IsActive) {
                activeTable.row.add(rowData).draw();
            } else {
                var rowNode = inactiveTable.row.add(rowData).draw().node();
                $(rowNode).addClass('inactive-item');
            }
        });
    });
});



$(document).ready(function() {
    // Fetch the JSON data and populate the DataTable
    $.getJSON('static/equip.json', function(data) {
        $('#equipstats').DataTable({
            data: data,
            columns: [
                { data: 'EQUIPMENT NAME' }, // Matches the JSON key for equipment name
                // The 'Times Borrowed' column is not present in your JSON data.
                // You need to calculate or include this data in your JSON if required.
                { data: 'Total Borrowed Quantity' }, // Matches the JSON key for total borrowed quantity
                { data: 'Total Duration (hrs)' }, // Matches the JSON key for total duration
                { data: 'Average Duration (hrs)' }, // Matches the JSON key for average duration
                { data: 'Active/Inactive Status' }, // Matches the JSON key for active/inactive status
                { data: 'Last Borrowed Date', render: function(data) {
                    // Convert Unix timestamp to human-readable date
                    return new Date(data).toLocaleDateString();
                }},
                { data: 'Maintenance Frequency' }, // Matches the JSON key for maintenance frequency
                { data: 'Utilization per day (%)', render: function(data) {
                    // Format the utilization as a percentage
                    return (data * 100).toFixed(2) + '%';
                }}
            ]
        });
    });
});
