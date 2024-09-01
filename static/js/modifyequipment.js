$(document).ready(function() {
    // Fetch the JSON data and populate the DataTable
    $.getJSON('static/eqstats.json', function(data) {
        
        var table = $('#roomstats').DataTable({
            data: data,
            columns: [
                { data: 'Equipment Name', title: 'Equipment Name' },
                { data: 'Room', title: 'Room' },
                { data: 'Quantity', title: 'Quantity' },
                { data: 'Frequency', title: 'Total Times Borrowed' },
                { data: 'Total Quantity', title: 'Quantity' },
                { data: 'Total Duration', title: 'Total Duration', render: $.fn.dataTable.render.number(',', '.', 2) },
                { data: 'Average Duration', title: 'Average Duration', render: $.fn.dataTable.render.number(',', '.', 2) },
                { data: 'Outliers', title: 'Outliers Count' },
                { data: 'Late Return', title: 'Late Returns', },
                { data: 'Maintenance Frequency', title: 'Maintenance Frequency' },
                { data: 'Status', title: 'Status' },
                { data: 'Peak Quarter', title: 'Peak Quarter' },
                
                // Add more columns if needed
            ],
            // Additional DataTable options can be set here if needed
            // Enable state saving
        stateSave: true,

        // Enable responsive design
        responsive: true,

        // Add export buttons
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ],

        // Customize the default order
        order: [[1, 'asc']], // Example: Order by the 'Frequency' column

        // Implement row details
        "createdRow": function(row, data, dataIndex) {
            if (data.Outliers > 5) { // Example condition
                $(row).addClass('highlight'); // Add class to rows with outliers > 5
            }
        },
        
        
    });
    
    
    var columnIndex = getColumnIndexByName(table, 'Room');
    console.log(columnIndex)
    function getColumnIndexByName(table, columnName) {
        return table.columns().header().toArray().findIndex(header => $(header).html() === columnName);
    }
    
    // Now setup the event listeners here inside the same ready function
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent the default link behavior
            const selectedRoomId = this.textContent.trim();

            if (selectedRoomId === "Overall") {
                table.column(columnIndex).search('').draw(); // Show all entries
            } else {
                table.column(columnIndex).search(selectedRoomId).draw(); // Filter based on the selected room
            }
        });
    });

    // Custom search functionality
    $('#custom-search-box').on('keyup', function() {
        table.search(this.value).draw();
        });
    });
   
});

