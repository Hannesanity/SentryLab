$(document).ready(function() {
    var table = $('#inactive-table-body').DataTable();

    $.getJSON('/static/inactive.json', function(data) {
        // 'data' is an array of objects representing your inventory data
        data.forEach(function(item, index) {
            table.row.add([
                index + 1,  // Index
                item['Item No.'],  // Item No.
                item['Name'],  // Item Name
                item['UniqueID'],  // Unique ID
                item['Room'],  // Location
                item['Brand']  // Brand
            ]).draw();
        });
    });
});

$(document).ready(function() {
    var table = $('#active-table-body').DataTable();  // Assuming you have a separate table for active items

    $.getJSON('/static/active.json', function(data) {
        // 'data' is an array of objects representing your inventory data
        data.forEach(function(item, index) {
            table.row.add([
                index + 1,  // Index
                item['Item No.'],  // Item No.
                item['Name'],  // Item Name
                item['UniqueID'],  // Unique ID
                item['Room'],  // Location
                item['Brand']  // Brand
            ]).draw();
        });
    });
});