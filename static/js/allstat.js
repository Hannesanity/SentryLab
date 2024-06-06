// Fetch Monthly Data
fetch('static/graph_data.json')
    .then(response => response.json())
    .then(data => {
        graphData = data;
    })
    .catch(error => console.error('Error fetching monthly data:', error));

var ctxa1 = document.getElementById('TotalEqUsage').getContext('2d');
var ctxa2 = document.getElementById('UtilRatePerDay').getContext('2d');
var ctxa3 = document.getElementById('FreqEqUsage').getContext('2d');
var ctxa4 = document.getElementById('FreqEquUsageMonth').getContext('2d');

// Create the chart
var TotalEqUsageChart = new Chart(ctxa1, {
    type: 'bar',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Total Duration of Equipment',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Months'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Quantity'
                },
                beginAtZero: true
            }
        }
    }
});


// Create the second chart
var UtilRatePerDayChart = new Chart(ctxa2, {
    type: 'bar',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Utilization Rate of Equipment per Day',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Most Frequent Day'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Utilization per Day(%)'
                },
                beginAtZero: true
            }
        }
    }
});

// Create other charts
var FreqEqUsageChart = new Chart(ctxa3, {
    type: 'line',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Frequency of Equipment Usage in a Week',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Day'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Frequency'
                },
                beginAtZero: true
            }
        }
    }
});

var FreqEqUsageMonthChart = new Chart(ctxa4, {
    type: 'line',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Frequency of Equipment Usage per Month',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Month'    
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Frequency'
                },
                beginAtZero: true
            }
        }
    }
});

$('#unique-id-select').change(function() {

    // Filter the data for the selected unique ID
    var filteredGraphData = graphData.filter(item => item.UniqueID === selectedUniqueId);

    
  
    // Update the charts if they exist
    if (TotalEqUsageChart && UtilRatePerDayChart && FreqEqUsageChart && FreqEqUsageMonthChart) {
        TotalEqUsageChart.data.labels = updatedLabels;  // Provide updated labels
        TotalEqUsageChart.data.datasets[0].data = updatedData;  // Provide updated data
        TotalEqUsageChart.update();  // Update the chart

        UtilRatePerDayChart.data.labels = updatedLabels;  // Provide updated labels
        UtilRatePerDayChart.data.datasets[0].data = updatedData;  // Provide updated data
        UtilRatePerDayChart.update();  // Update the chart

        FreqEqUsageChart.data.labels = updatedLabels;  // Provide updated labels
        FreqEqUsageChart.data.datasets[0].data = updatedData;  // Provide updated data
        FreqEqUsageChart.update();  // Update the chart

        FreqEqUsageMonthChart.data.labels = updatedLabels;  // Provide updated labels
        FreqEqUsageMonthChart.data.datasets[0].data = updatedData;  // Provide updated data
        FreqEqUsageMonthChart.update();  // Update the chart

    }
  });
