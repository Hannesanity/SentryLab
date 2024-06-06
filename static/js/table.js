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

var daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

$(document).ready(function() {
    // Initialize counters for days and months
    var dayCounts = Array(7).fill(0); // Initialize an array of length 7 (days of the week) with zeros
    var monthCounts = Array(12).fill(0); // Initialize an array of length 12 (months of the year) with zeros

    // Fetch the JSON data and populate the DataTable
    $.getJSON('static/equip.json', function(data) {
        // Iterate over the data to count occurrences of days and months
        data.forEach(function(item) {
            // Increment the count for the most frequent day
            dayCounts[item['Most Frequent Day']]++;

            // Increment the count for the most frequent month
            monthCounts[item['Most Frequent Month'] - 1]++; // Subtract 1 to match array index (zero-based)

            // Add more logic here if needed
        });

        // Output the counts (for testing)
        console.log("Day Counts:", dayCounts);
        console.log("Month Counts:", monthCounts);

        // Now you can use dayCounts and monthCounts to display the data in your HTML/JS as needed
    });
});

$(document).ready(function() {
    // Fetch the JSON data and populate the DataTable
    $.getJSON('static/equip.json', function(data) {
        $('#equipstats').DataTable({
            data: data,
            columns: [
                { data: 'EQUIPMENT NAME' },
                { data: 'QUANTITY sum', title: 'Times Borrowed' },
                { data: 'DURATION (HRS) sum', title: 'Total Duration (hrs)' },
                { data: 'DURATION (HRS) mean', title: 'Average Duration (hrs)' },
                { data: 'DURATION (HRS) max', title: 'Max Duration (hrs)' },
                { data: 'DURATION (HRS) min', title: 'Min Duration (hrs)' },
                { data: 'DURATION (HRS) median', title: 'Median Duration (hrs)' },
                { data: 'DURATION (HRS) std', title: 'Standard Deviation Duration (hrs)' },
                { data: 'Active/Inactive Status' },
                { data: 'DATETIME BORROWED max', title: 'Last Borrowed Date', render: function(data) {
                    return new Date(data).toLocaleDateString();
                }},
                { data: 'DATETIME BORROWED min', title: 'First Borrowed Date', render: function(data) {
                    return new Date(data).toLocaleDateString();
                }},
                { data: 'DATETIME RETURNED max', title: 'Last Return Date', render: function(data) {
                    return new Date(data).toLocaleDateString();
                }},
                { data: 'DATETIME RETURNED min', title: 'First Return Date', render: function(data) {
                    return new Date(data).toLocaleDateString();
                }},
                { data: 'Maintenance Frequency' },
                { data: 'Utilization per day (%)', render: function(data) {
                    return (data * 100).toFixed(2) + '%';
                }},
                { data: 'Most Frequent Day', render: function(data) {
                    // Convert the day number to a day name
                    return daysOfWeek[data];
                }},
                { data: 'Most Frequent Month', render: function(data) {
                    // Convert the month number to a month name (subtract 1 because array is zero-indexed)
                    return monthsOfYear[data - 1];}}
                // Add more columns if needed
            ]
        });
        $('#equipstats tbody').on('click', 'tr', function() {
            var data = inactiveTable.row(this).data();
            console.log('Inactive Row Clicked:', data);
        });
    });
});