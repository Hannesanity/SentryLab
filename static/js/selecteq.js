$('#equipment-select').change(function() {
    var selectedEquipment = $(this).val();
    console.log('Selected Equipment:', selectedEquipment);  // Log the selected equipment

    $.getJSON('/unique_ids', {
        equipment_name: selectedEquipment
    }, function(data) {
        console.log('Received Data:', data);  // Log the received data
        var uniqueIdSelect = $('#unique-id-select');

        // Clear the current options
        uniqueIdSelect.empty();

        // Add the new options
        $.each(data.unique_ids, function(index, uniqueId) {
            console.log('Adding option:', uniqueId);  // Log the unique ID being added
            uniqueIdSelect.append($('<option></option>').attr('value', uniqueId).text(uniqueId));
        });
    });
});

// Define 'data' outside of the fetch promise
var data;

fetch('/static/stats.json')
    .then(response => response.json())
    .then(fetchedData => {
        // Assign the fetched data to 'data'
        data = fetchedData;
        console.log('Fetched Data:', data);  // Log the fetched data
    })
    .catch(error => console.error('Error:', error));

var selectElement = document.getElementById('unique-id-select');  // Changed from 'equipment-select'

// Add an event listener for the 'change' event
selectElement.addEventListener('change', function() {
    var selectedUniqueId = selectElement.value;
    console.log('Selected Unique ID:', selectedUniqueId);  // Log the selected unique ID

    // Find the corresponding data
    var selectedData = data.find(function(item) {
        return item['UniqueID'] === selectedUniqueId;
    });
    console.log('Selected Data:', selectedData);  // Log the selected data

    // Update the cards
    if (selectedData) {
        document.getElementById('total-qty').textContent = selectedData['Frequency'];
        document.getElementById('avg-duration').textContent = parseFloat(selectedData['Average Duration']).toFixed(2);
        document.getElementById('total-dur').textContent = parseFloat(selectedData['Total Duration']).toFixed(2);
        document.getElementById('max-dur').textContent = parseFloat(selectedData['Max Duration']).toFixed(2);
        document.getElementById('min-dur').textContent = parseFloat(selectedData['Min Duration']).toFixed(2);
        document.getElementById('lastdate').textContent = parseFloat(selectedData['Last Used Date']).toFixed(2);
        document.getElementById('correlation').textContent = parseFloat(selectedData['Correlations']).toFixed(2);
        document.getElementById('outliers').textContent = parseFloat(selectedData['Outliers']).toFixed(2);
    }
});


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

