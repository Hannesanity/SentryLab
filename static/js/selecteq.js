// Define 'data' outside of the fetch promise
var data;

fetch('/static/stats.json')
    .then(response => response.json())
    .then(fetchedData => {
        // Assign the fetched data to 'data'
        data = fetchedData;
    })
    .catch(error => console.error('Error:', error));




    function updateUniqueIdSelect() {
        var selectedEquipment = $('#equipment-select').val();
    
        $.getJSON('/static/items.json', function(data) {
            var uniqueIdSelect = $('#unique-id-select');
    
            // Clear the current options
            uniqueIdSelect.empty();
    
            // Add the new options
            $.each(data, function(index, item) {
                // Check if the item is active and matches the selected equipment
                if (item.IsActive && item.Name === selectedEquipment) {
                    uniqueIdSelect.append($('<option></option>').attr('value', item.UniqueID).text(item.UniqueID));
                }
            });
    
            // Trigger the change event for the unique ID select element
            uniqueIdSelect.trigger('change');
        });
    }
    
    // Call the function when the equipment changes
    $('#equipment-select').change(updateUniqueIdSelect);
    
    // Call the function when the page loads
    $(document).ready(updateUniqueIdSelect);
    
function updateEquipmentSelect() {
    $.getJSON('/static/items.json', function(data) {
        var equipmentSelect = $('#equipment-select');

        // Clear the current options
        equipmentSelect.empty();

        // Get unique, active equipment names
        var activeEquipments = [...new Set(data.filter(item => item.IsActive).map(item => item.Name))];

        // Add the new options
        $.each(activeEquipments, function(index, equipmentName) {
            equipmentSelect.append($('<option></option>').attr('value', equipmentName).text(equipmentName));
        });

        // Trigger the change event for the equipment select element
        equipmentSelect.trigger('change');
    });
}
$(document).ready(updateEquipmentSelect);

    



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
