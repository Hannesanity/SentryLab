// Define 'data' outside of the fetch promise
var data;

fetch('/static/stats.json')
    .then(response => response.json())
    .then(fetchedData => {
        // Assign the fetched data to 'data'
        data = fetchedData;
    })
    .catch(error => console.error('Error:', error));


    function updateUniqueIdSelect(callback) {
        var selectedEquipment = $('#equipment-select').val();
        console.log('Selected Equipment:', selectedEquipment);
    
        $.getJSON('/static/items.json', function(data) {
            var uniqueIdSelect = $('#unique-id-select');
            uniqueIdSelect.empty(); // Clear the current options
            let firstUniqueId = null;
    
            // Populate the unique ID select with active items that match the selected equipment
            $.each(data, function(index, item) {
                if (item.IsActive && item.Name === selectedEquipment) {
                    uniqueIdSelect.append($('<option></option>').attr('value', item.UniqueID).text(item.UniqueID));
                    if (!firstUniqueId) {
                        firstUniqueId = item.UniqueID; // Store the first unique ID
                    }
                }
            });
    
            if (firstUniqueId) {
                uniqueIdSelect.val(firstUniqueId); // Set the value to the first unique ID
                updateSelectedEquipmentData(firstUniqueId); // Update the data for the selected equipment
            }
    
            // Execute the callback function if provided
            if (typeof callback === 'function') {
                callback(firstUniqueId);
            }
        });
    }

// Call the function when the equipment changes
$('#equipment-select').change(function() {
    updateUniqueIdSelect(function(firstUniqueId) {
        // Now that we have the first unique ID, trigger the change event
        $('#unique-id-select').val(firstUniqueId).trigger('change');
    });
});

// Initialize the unique ID select when the page loads
$(document).ready(function() {
    updateEquipmentSelect(); // Load equipment select options on page load
    $('#equipment-select').change(function() {
        updateUniqueIdSelect(function(firstUniqueId) {
            // Trigger the change event after the unique ID select is updated
            $('#unique-id-select').val(firstUniqueId).trigger('change');
        });
    });
});

function updateEquipmentSelect() {
    $.getJSON('/static/items.json', function(data) {
        var equipmentSelect = $('#equipment-select');
        equipmentSelect.empty();

        // Get unique, active equipment names
        var activeEquipments = [...new Set(data.filter(item => item.IsActive).map(item => item.Name))];

        // Add new options
        $.each(activeEquipments, function(index, equipmentName) {
            equipmentSelect.append($('<option></option>').attr('value', equipmentName).text(equipmentName));
        });

        // Trigger the change event to load unique IDs and details
        equipmentSelect.trigger('change');
    });
}
    



/*
function explain(correlation, outliers) {
    let correlationExplanation = '';
    let outliersExplanation = '';

    if (correlation > 0) {
        correlationExplanation = 'When more pieces of this equipment are borrowed, they tend to be borrowed for a longer total time. ';
    } else if (correlation < 0) {
        correlationExplanation = 'When more pieces of this equipment are borrowed, they tend to be borrowed for a shorter total time. ';
    } else if (isNaN(correlation)) {
        correlationExplanation = 'The correlation could not be calculated, possibly due to insufficient variance in the data. ';
    } else {
        correlationExplanation = 'There is no clear relationship between the quantity of equipment borrowed and the total borrowing time. ';
    }

    if (outliers.length > 0) {
        outliersExplanation = 'There are some unusual cases where the equipment was kept for much longer or shorter than usual. ';
    } else {
        outliersExplanation = 'There are no unusual cases in the borrowing time for this equipment. ';
    }

    return {
        correlationExplanation: correlationExplanation,
        outliersExplanation: outliersExplanation
    };
}

// Call the explain function
let explanations = explain(correlation, outliers);

// Get the span elements
let correlationExplanationElement = document.getElementById('correlationExplanation');
let outliersExplanationElement = document.getElementById('outliersExplanation');

// Insert the explanations into the span elements
correlationExplanationElement.textContent = explanations.correlationExplanation;
outliersExplanationElement.textContent = explanations.outliersExplanation;
*/
