var data;
var graphData;
// Initialize an object to hold all the fetched data
let allGraphData = {
    monthly: null,
    weekly: null,
    hourly: null
};

Chart.defaults.global.defaultFontColor = '#FFFFFF';
Chart.defaults.global.defaultFontSize = 12;
Chart.defaults.global.defaultFontFamily = 'Arial, sans-serif';


  // Mapping of filter values to canvas IDs
  var filterToCanvasMap = {
    'filter1': ['yearTotalDur', 'yearFreq', 'yearUtil', 'yearMinMaxDur'],
    'filter2': ['monthTotalDur', 'monthUtil', 'monthMinMaxDur', 'monthFreq'],
    'filter3': ['weekFreq', 'weekTotalDur', 'weekMinMaxDur'],
    'filter4': ['hourUptime', 'hourBorrow', 'hourAvgDur', 'hourOccu']
};

function updateCanvasVisibility(selectedFilter) {
    console.log('Selected Filter:', selectedFilter); // Debugging line

    // Hide all elements with data-filter attribute first
    document.querySelectorAll('[data-filter]').forEach(function(element) {
        element.style.display = 'none';
    });

    // Check if the selected filter is 'overall'
    if (selectedFilter === 'overall') {
        // Show only the elements related to the 'overall' statistics
        document.querySelectorAll('[data-filter="overall"]').forEach(function(element) {
            element.style.display = 'block';
        });
    } else {
        // Show the elements related to the selected filter other than 'overall'
        document.querySelectorAll(`[data-filter="${selectedFilter}"]`).forEach(function(element) {
            element.style.display = 'block';
        });
    }
}

// Event listener for the graph filter select change
document.getElementById('graph-filter-select').addEventListener('change', function() {
    var selectedFilter = this.value;
    updateCanvasVisibility(selectedFilter);
});

// Initial call to set the default state
document.addEventListener('DOMContentLoaded', function() {
    updateCanvasVisibility(document.getElementById('graph-filter-select').value);
});

var monthNames = {
    1: 'January',
    2: 'February',
    3: 'March',
    4: 'April',
    5: 'May',
    6: 'June',
    7: 'July',
    8: 'August',
    9: 'September',
    10: 'October',
    11: 'November',
    12: 'December'
};

var dayNames = {
    0: 'Monday',
    1: 'Tuesday',
    2: 'Wednesday',
    3: 'Thursday',
    4: 'Friday',
    5: 'Saturday',
    6: 'Sunday'
};



// Fetch Monthly Data
fetch('static/monthly.json')
    .then(response => response.json())
    .then(data => {
        allGraphData.monthly = data;
        console.log('Monthly data:', allGraphData.monthly);
    })
    .catch(error => console.error('Error fetching monthly data:', error));

// Fetch Weekly Data
fetch('static/weekly.json')
    .then(response => response.json())
    .then(data => {
        allGraphData.weekly = data;
        console.log('Weekly data:', allGraphData.weekly);
    })
    .catch(error => console.error('Error fetching weekly data:', error));

// Fetch Hourly Data
fetch('static/hourly.json')
    .then(response => response.json())
    .then(data => {
        allGraphData.hourly = data;
        console.log('Hourly data:', allGraphData.hourly);
    })
    .catch(error => console.error('Error fetching hourly data:', error));

fetch('static/yearly.json')
    .then(response => response.json())
    .then(data => {
        allGraphData.year = data;
        console.log('Yearly data:', allGraphData.year);
    })
    .catch(error => console.error('Error fetching year data:', error));

fetch('static/overall.json')
    .then(response => response.json())
    .then(data => {
        allGraphData.overall = data;
        console.log('Overall data:', allGraphData.overall);
    })
    .catch(error => console.error('Error fetching year data:', error));

// Get the context of the canvas element we want to select
var ctx2 = document.getElementById('monthTotalDur').getContext('2d');
var ctx3 = document.getElementById('monthUtil').getContext('2d');
var ctx4 = document.getElementById('monthMinMaxDur').getContext('2d');
var ctx5 = document.getElementById('monthFreq').getContext('2d');
var ctx6 = document.getElementById('weekTotalDur').getContext('2d');
var ctx7 = document.getElementById('weekMinMaxDur').getContext('2d');
var ctx8 = document.getElementById('weekFreq').getContext('2d');
var ctx9 = document.getElementById('weekUtil').getContext('2d');
var ctx10 = document.getElementById('hourUptime').getContext('2d');
var ctx11 = document.getElementById('hourBorrow').getContext('2d');
var ctx12 = document.getElementById('hourAvgDur').getContext('2d');
var ctx13 = document.getElementById('hourOccu').getContext('2d');
var ctx14 = document.getElementById('yearMinMaxDur').getContext('2d');
var ctx15 = document.getElementById('yearTotalDur').getContext('2d');
var ctx16 = document.getElementById('yearFreq').getContext('2d');
var ctx17 = document.getElementById('yearUtil').getContext('2d');


// Create the chart


// Create the second chart
var monthTotalDurationChart = new Chart(ctx2, {
    type: 'bar',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Total Duration of Equipment Usage Per Month',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
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
                    text: 'Total Duration in Month'
                },
                beginAtZero: true
            }
        }
    }
});

// Create other charts
var monthUtilChart = new Chart(ctx3, {
    type: 'line',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Monthly Utilization Rate',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1,
            fill: true
        }]
    },
    options: {
        responsive: true,
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
                    text: 'Utilization Rate'
                },
                beginAtZero: true
            }
        }
    }
});

var monthMinMaxDurChart = new Chart(ctx4, {
    type: 'line',
    data: {
        labels: [], // This will be your x-axis labels, e.g., hours of the day
        datasets: [
            {
                label: 'Min Duration',
                data: [], // This will be your data for min duration
                borderColor: 'rgba(255, 99, 132, 1)', // Color for min duration line
                borderWidth: 1,
                borderDash: [5, 5]
            },
            {
                label: 'Average Duration',
                data: [], // This will be your data for average duration
                borderColor: 'rgba(255, 255, 224, 1)', // Color for average duration line
                borderWidth: 1,
                borderDash: [5, 5]
            },
            {
                label: 'Max Duration',
                data: [], // This will be your data for max duration
                borderColor: 'rgba(54, 162, 235, 1)', // Color for max duration line
                borderWidth: 1
            }
            // Add more datasets here if needed
        ]
    },
    options: {
        responsive: true,
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
                    text: 'Duration'
                },
                beginAtZero: true
            }
        }
    }
});

var monthFreqChart = new Chart(ctx5, {
    type: 'bar',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Frequency per Month',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
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


// Create the second chart
var weekTotalDurationChart = new Chart(ctx6, {
    type: 'bar',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Total Duration of Equipment Usage Per week',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Days of a Week'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Total Duration in Hours'
                },
                beginAtZero: true
            }
        }
    }
});


var weekMinMaxDurChart = new Chart(ctx7, {
    type: 'line',
    data: {
        labels: [], // This will be your x-axis labels, e.g., hours of the day
        datasets: [
            {
                label: 'Min Duration',
                data: [], // This will be your data for min duration
                borderColor: 'rgba(255, 99, 132, 1)', // Color for min duration line
                borderWidth: 1,
                borderDash: [5, 5]
            },
            {
                label: 'Average Duration',
                data: [], // This will be your data for average duration
                borderColor: 'rgba(255, 255, 224, 1)', // Color for average duration line
                borderWidth: 1,
                borderDash: [5, 5]
            },
            {
                label: 'Max Duration',
                data: [], // This will be your data for max duration
                borderColor: 'rgba(54, 162, 235, 1)', // Color for max duration line
                borderWidth: 1
            }
            // Add more datasets here if needed
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'week'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Duration'
                },
                beginAtZero: true
            }
        }
    }
});


var weekFreqChart = new Chart(ctx8, {
    type: 'bar',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Frequency per week',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'week'
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


var weekUtilChart = new Chart(ctx9, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Week Utilization',
            data: [],
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
            fill: true
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

var hourUptimeChart = new Chart(ctx10, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Uptime',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)', // Semi-transparent blue
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            fill: false // Fill the area under the line
        }, {
            label: 'Idle Time',
            data: [], // Assuming idle time is the inverse of uptime flag
            backgroundColor: 'rgba(255, 99, 132, 0.5)', // Semi-transparent red
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: false
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});


var hourBorrowChart = new Chart(ctx11, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Borrowed',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)', // Semi-transparent blue
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            fill: true, // Fill the area under the line
            borderDash: [5,5]
        }, {
            label: 'Returned',
            data: [] ,
            backgroundColor: 'rgba(255, 99, 132, 0.5)', // Semi-transparent red
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: true // Fill the area under the line
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                stacked: true // Stack the areas on the y-axis
            }
        }
    }
});


var hourAvgDurChart = new Chart(ctx12, {
    type: 'line',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Average Duration',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Average Duration'
                },
                beginAtZero: true
            }
        }
    }
});

var hourOccuChart = new Chart(ctx13, {
    type: 'bar',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Times that the equipment is occupied',
            data: [],  // Initialize with empty data
            backgroundColor: '#5A81B2', // Updated color
            borderColor: 'rgba(90, 129, 178, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Average Duration'
                },
                beginAtZero: true
            }
        }
    }
    });


var yearMinMaxDurChart = new Chart(ctx14, {
    type: 'line',
    data: {
        labels: [], // This will be your x-axis labels, e.g., hours of the day
        datasets: [
            {
                label: 'Min Duration',
                data: [], // This will be your data for min duration
                borderColor: 'rgba(255, 99, 132, 1)', // Color for min duration line
                borderWidth: 1,
                borderDash: [5,5]
            },
            {
                label: 'Average Duration',
                data: [], // This will be your data for min duration
                borderColor: 'rgba(255, 255, 224, 1)', // Color for min duration line
                borderWidth: 1,
                borderDash: [5,5]
            },
            {
                label: 'Max Duration',
                data: [], // This will be your data for max duration
                borderColor: 'rgba(54, 162, 235, 1)', // Color for max duration line
                borderWidth: 1
            }
            // Add more datasets here if needed
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Hour of the Day'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Duration'
                },
                beginAtZero: true
            }
        }
    }
});

var yearTotalDurationChart = new Chart(ctx15, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Total Duration',
            data: [],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

var yearFreqChart = new Chart(ctx16, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Frequency',
            data: [],
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

var yearUtilChart = new Chart(ctx17, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Year Utilization',
            data: [],
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1,
            fill: true
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

function createHealthBar(canvasId, healthPercentage) {
    console.log('Canvas ID:', canvasId); // Check the ID being queried
    const canvas = document.getElementById(canvasId);
    console.log('Canvas Element:', canvas);
    const ctx = canvas.getContext('2d');

    const data = {
        datasets: [{
            data: [healthPercentage, 100 - healthPercentage],
            backgroundColor: ['#4CAF50', '#ddd'],
            hoverBackgroundColor: ['#4CAF50', '#ddd'],
            borderWidth: 0
        }]
    };

    const options = {
        rotation: 1 * Math.PI,
        circumference: 1 * Math.PI,
        cutoutPercentage: 80,
        tooltips: { enabled: false },
        hover: { mode: null },
        maintainAspectRatio: false,
        responsive: true,
        legend: { display: false },
        animation: {
            animateRotate: true,
            animateScale: true,
            onComplete: function () {
                const width = ctx.canvas.width;
                const height = ctx.canvas.height;
                ctx.restore();
                ctx.font = 'bold 16px Arial'; // Adjust the font size and type as needed
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#333'; // Font color
                const text = healthPercentage.toFixed(1) + '%'; // Text to display
                const textX = Math.round((width - ctx.measureText(text).width) / 2);
                const textY = height / 2;
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: options
    });
}




function formatAsTime(hours) {
    const hh = Math.floor(hours);
    const mm = Math.round((hours - hh) * 60);
    if (hh === 0 && mm === 0) {
        return "0 minutes";
    } else if (hh === 0) {
        return `${mm} minute${mm !== 1 ? 's' : ''}`;
    } else if (mm === 0) {
        return `${hh} hour${hh !== 1 ? 's' : ''}`;
    } else {
        return `${hh} hour${hh !== 1 ? 's' : ''} ${mm} minute${mm !== 1 ? 's' : ''}`;
    }
}
// This function is called when #unique-id-select changes
function updateSelectedEquipmentData(selectedUniqueId) {
    // Fetch data from the JSON file
    fetch('/static/items.json')
    .then(response => response.json())
    .then(itemsData => {
        // Find the item with the selected unique ID
        var selectedItemData = itemsData.find(item => item.UniqueID === selectedUniqueId);
        if (selectedItemData) {
            document.getElementById('equipment-name').textContent = selectedItemData['Name'];
            document.getElementById('equipment-brand').textContent = selectedItemData['Brand'];
            document.getElementById('equipment-room').textContent = selectedItemData['Room'];
            document.getElementById('equipment-serial').textContent = selectedItemData['Serial No.'];
            console.log('Selected Equipment Data:', selectedItemData);
        } else {
            console.log('No item found with the provided unique ID.');
        }
    })
    .catch(error => console.error('Error:', error));

    // Filter the data for the selected unique ID   
    var filteredMonthlyData = allGraphData.monthly.filter(item => item.UniqueID === selectedUniqueId);
    var filteredWeeklyData = allGraphData.weekly.filter(item => item.UniqueID === selectedUniqueId);
    var filteredHourlyData = allGraphData.hourly.filter(item => item.UniqueID === selectedUniqueId);
    var filteredYearData = allGraphData.year.filter(item => item.UniqueID === selectedUniqueId);
    var filteredOverallData = allGraphData.overall.filter(item => item.UniqueID === selectedUniqueId);
    var selectedData = data.find(function(item) {
        return item['UniqueID'] === selectedUniqueId;
    });



    if (selectedData) {
        document.getElementById('total-qty').textContent = selectedData['Frequency'];
        document.getElementById('late-return').textContent = selectedData['Late Return'];
        document.getElementById('avg-duration').textContent = formatAsTime(selectedData['Average Duration']);
        document.getElementById('total-dur').textContent = formatAsTime(selectedData['Total Duration']);
        document.getElementById('max-dur').textContent = formatAsTime(selectedData['Max Duration']);
        document.getElementById('min-dur').textContent = formatAsTime(selectedData['Min Duration']);
        document.getElementById('correlation').textContent = parseFloat(selectedData['Correlations']).toFixed(2);
        document.getElementById('outliers').textContent = parseFloat(selectedData['Outliers']).toFixed(2);
        document.getElementById('firstdateret').textContent = new Date(selectedData['First Return Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('firstdatebor').textContent = new Date(selectedData['First Borrow Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('lastdateret').textContent = new Date(selectedData['Last Return Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('lastdatebor').textContent = new Date(selectedData['Last Borrow Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('median-dur').textContent = formatAsTime(selectedData['Median Duration']);
        document.getElementById('std-dev-dur').textContent = selectedData['Standard Deviation Duration'].toFixed(2);
        document.getElementById('unique-dates').textContent = selectedData['Unique Dates'];
        document.getElementById('most-freq-day').textContent = selectedData['Most Frequent Day'];
        document.getElementById('most-freq-month').textContent = selectedData['Most Frequent Month'];
        document.getElementById('range-duration').textContent = selectedData['Range Duration'].toFixed(2);
        document.getElementById('calib-due').textContent = selectedData['Calibration Due'];
        document.getElementById('last-calib').textContent = selectedData['Days Since Last Calibration'];
        document.getElementById('mainte-type').textContent = selectedData['MAINTENANCE TYPE'];
        document.getElementById('mainte-freq').textContent = selectedData['FREQUENCY'];
        document.getElementById('predicted-rul-mlr1').textContent = `${(selectedData['PredictedRUL_MLR'] * 365.25).toFixed(0)} days`;
        document.getElementById('predicted-rul-knn').textContent = `${(selectedData['PredictedRUL_KNN'] * 365.25).toFixed(0)} days`;
        document.getElementById('predicted-rul-svr').textContent = `${(selectedData['PredictedRUL_SVR'] * 365.25).toFixed(0)} days`;
        createHealthBar('health-percentage-mlr1', parseFloat(selectedData['EquipmentHealth_MLR']));
        createHealthBar('equipment-health-knn', parseFloat(selectedData['EquipmentHealth_KNN']));
        createHealthBar('equipment-health-svr', parseFloat(selectedData['EquipmentHealth_SVR']));
        document.getElementById('next-maintenance-date-mlr').textContent = new Date(selectedData['NextMaintenanceDate_MLR']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('next-maintenance-date-knn').textContent = new Date(selectedData['NextMaintenanceDate_KNN']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('next-maintenance-date-svr').textContent = new Date(selectedData['NextMaintenanceDate_SVR']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Set the text content for Depreciation Date
        document.getElementById('depreciation-date-mlr').textContent = new Date(selectedData['DepreciationDate_MLR']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('depreciation-date-knn').textContent = new Date(selectedData['DepreciationDate_KNN']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('depreciation-date-svr').textContent = new Date(selectedData['DepreciationDate_SVR']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Yearly Interpretation
        const sortedYearlyData = filteredYearData.sort((a, b) => a.YEAR - b.YEAR);
        const yearlyUl = document.createElement('ul');
        yearlyUl.style.listStyleType = "none";  // This removes the bullet points
        yearlyUl.className = "list-group"; // Apply Bootstrap list group class

        sortedYearlyData.forEach(item => {
            const li = document.createElement('li');
            li.className = "list-group-item"; // Apply Bootstrap list group item class
            li.textContent = item['Yearly Interpretation'];
            yearlyUl.appendChild(li);
        });
        
        const yearlyContainer = document.getElementById('yearly-int');
        yearlyContainer.innerHTML = ''; // Clear any existing content
        yearlyContainer.appendChild(yearlyUl);

        // Handling Monthly Data
        const sortedMonthlyData = filteredMonthlyData.sort((a, b) => a.MONTH - b.MONTH);
        const monthlyUl = document.createElement('ul');
        monthlyUl.style.listStyleType = "none"; // This removes the bullet points
        monthlyUl.className = "list-group"; // Apply Bootstrap list group class

        sortedMonthlyData.forEach(item => {
            const li = document.createElement('li');
            li.className = "list-group-item"; // Apply Bootstrap list group item class
            li.textContent = item['Monthly Interpretation'];
            monthlyUl.appendChild(li);
        });
        
        const monthlyContainer = document.getElementById('monthly-int');
        monthlyContainer.innerHTML = ''; // Clear any existing content
        monthlyContainer.appendChild(monthlyUl);
        
        const sortedDailyData = filteredWeeklyData.sort((a, b) => a['DAY OF WEEK'] - b['DAY OF WEEK']);
        const dailyUl = document.createElement('ul');
        dailyUl.style.listStyleType = "none"; // This removes the bullet points
        dailyUl.className = "list-group"; // Apply Bootstrap list group class

        sortedDailyData.forEach(item => {
            const li = document.createElement('li');
            li.className = "list-group-item"; // Apply Bootstrap list group item class
            li.textContent = item['Daily Interpretation'];
            dailyUl.appendChild(li);
        });
        
        const dailyContainer = document.getElementById('daily-int');
        dailyContainer.innerHTML = ''; // Clear any existing content
        dailyContainer.appendChild(dailyUl);

        // Handling Hourly Data
        const sortedHourlyData = filteredHourlyData.sort((a, b) => a.HOUR - b.HOUR);
        const hourlyUl = document.createElement('ul');
        hourlyUl.style.listStyleType = "none"; // This removes the bullet points
        hourlyUl.className = "list-group"; // Apply Bootstrap list group class

        sortedHourlyData.forEach(item => {
            const li = document.createElement('li');
            li.className = "list-group-item"; // Apply Bootstrap list group item class
            li.textContent = item['Hourly Interpretation'];
            hourlyUl.appendChild(li);
        });
        
        const hourlyContainer = document.getElementById('hourly-int');
        hourlyContainer.innerHTML = ''; // Clear any existing content
        hourlyContainer.appendChild(hourlyUl);
    }
    
    // Update Monthly Stats Chart
    
    monthTotalDurationChart.data.labels = filteredMonthlyData.map(item => monthNames[item.MONTH]);
    monthTotalDurationChart.data.datasets[0].data = filteredMonthlyData.map(item => item['TOTAL DURATION']);
    monthTotalDurationChart.update();

    monthUtilChart.data.labels = filteredMonthlyData.map(item => monthNames[item.MONTH]);
    monthUtilChart.data.datasets[0].data = filteredMonthlyData.map(item => item['MONTH UTILIZATION']);
    monthUtilChart.update();

    monthMinMaxDurChart.data.labels = filteredMonthlyData.map(item => monthNames[item.MONTH]);
    monthMinMaxDurChart.data.datasets[0].data = filteredMonthlyData.map(item => item['MIN DURATION']);
    monthMinMaxDurChart.data.datasets[1].data = filteredMonthlyData.map(item => item['AVERAGE DURATION']);
    monthMinMaxDurChart.data.datasets[2].data = filteredMonthlyData.map(item => item['MAX DURATION']);
    monthMinMaxDurChart.update();

    monthFreqChart.data.labels = filteredMonthlyData.map(item => monthNames[item.MONTH]);
    monthFreqChart.data.datasets[0].data = filteredMonthlyData.map(item => item['FREQUENCY']);
    monthFreqChart.update();

    // Update Weekly Usage Chart
    weekFreqChart.data.labels = filteredWeeklyData.map(item => dayNames[item['DAY OF WEEK']]);
    weekFreqChart.data.datasets[0].data = filteredWeeklyData.map(item => item.FREQUENCY);
    weekFreqChart.update();

    weekTotalDurationChart.data.labels = filteredWeeklyData.map(item => dayNames[item['DAY OF WEEK']]);
    weekTotalDurationChart.data.datasets[0].data = filteredWeeklyData.map(item => item['TOTAL DURATION']);
    weekTotalDurationChart.update();

    weekMinMaxDurChart.data.labels = filteredWeeklyData.map(item => dayNames[item['DAY OF WEEK']]);
    weekMinMaxDurChart.data.datasets[0].data = filteredWeeklyData.map(item => item['MIN DURATION']);
    weekMinMaxDurChart.data.datasets[1].data = filteredWeeklyData.map(item => item['AVERAGE DURATION']);
    weekMinMaxDurChart.data.datasets[2].data = filteredWeeklyData.map(item => item['MAX DURATION']);
    weekMinMaxDurChart.update();

    weekUtilChart.data.labels = filteredWeeklyData.map(item => dayNames[item['DAY OF WEEK']]);
    weekUtilChart.data.datasets[0].data = filteredWeeklyData.map(item => item['DAILY UTILIZATION']);
    weekUtilChart.update();


    // Update Borrowing Patterns Chart to change btw

    // Update Borrowing Patterns Chart
    hourUptimeChart.data.labels = filteredHourlyData.map(item => item['HOUR'] + ':00');
    hourUptimeChart.data.datasets[0].data = filteredHourlyData.map(item => item['UPTIME FLAG']);
    hourUptimeChart.data.datasets[1].data = filteredHourlyData.map(item => item['IDLE TIME']);
    console.log('Updated Uptime Data:', hourUptimeChart.data.datasets[0].data); // Check the uptime data
    console.log('Updated Idle Time Data:', hourUptimeChart.data.datasets[1].data); // Check the idle time data
    hourUptimeChart.update();

    hourBorrowChart.data.labels = filteredHourlyData.map(item => item['HOUR'] + ':00');
    hourBorrowChart.data.datasets[0].data = filteredHourlyData.map(item => item['BORROWED COUNT']);
    hourBorrowChart.data.datasets[1].data = filteredHourlyData.map(item => item['RETURNED COUNT']);
    hourBorrowChart.update();

    hourAvgDurChart.data.labels = filteredHourlyData.map(item => item['HOUR'] + ':00');
    hourAvgDurChart.data.datasets[0].data = filteredHourlyData.map(item => item['AVERAGE DURATION']);
    hourAvgDurChart.update();

    hourOccuChart.data.labels = filteredHourlyData.map(item => item['HOUR'] + ':00');
    hourOccuChart.data.datasets[0].data = filteredHourlyData.map(item => item['OCCUPANCY COUNT']);
    hourOccuChart.update();

    // Years Chart
    yearMinMaxDurChart.data.labels = filteredYearData.map(item => item['YEAR']);
    yearMinMaxDurChart.data.datasets[0].data = filteredYearData.map(item => item['MIN DURATION']);
    yearMinMaxDurChart.data.datasets[1].data = filteredYearData.map(item => item['AVERAGE DURATION']);
    yearMinMaxDurChart.data.datasets[2].data = filteredYearData.map(item => item['MAX DURATION']);
    yearMinMaxDurChart.update();

    yearTotalDurationChart.data.labels = filteredYearData.map(item => item['YEAR']);
    yearTotalDurationChart.data.datasets[0].data = filteredYearData.map(item => item['TOTAL DURATION']);
    yearTotalDurationChart.update();

    yearFreqChart.data.labels = filteredYearData.map(item => item['YEAR']);
    yearFreqChart.data.datasets[0].data = filteredYearData.map(item => item['FREQUENCY']);
    yearFreqChart.update();

    yearUtilChart.data.labels = filteredYearData.map(item => item['YEAR']);
    yearUtilChart.data.datasets[0].data = filteredYearData.map(item => item['YEAR UTILIZATION']);
    yearUtilChart.update();


}

$('#unique-id-select').change(function() {
    var selectedUniqueId = $(this).val();
    updateSelectedEquipmentData(selectedUniqueId); // Call the function to update the data
});

// Initialize the unique ID select when the page loads
$(document).ready(function() {
    updateUniqueIdSelect(); // Load unique IDs based on the selected equipment
    $('#equipment-select').change(updateUniqueIdSelect); // Attach the event handler
});

window.onload = function() {
    // Get the height of col-8
    var col8Height = document.querySelector('.col-8').offsetHeight;

    // Set the height of col-4 to match col-8
    var col4 = document.querySelector('.col-4');
    col4.style.height = col8Height + 'px';
};
window.addEventListener('load', function() {
    // Get the height of col-4
    var col4Height = document.querySelector('.col-4').offsetHeight;

    // Set the max-height of .box to match col-4's height
    var boxes = document.querySelectorAll('.statbox');
    boxes.forEach(function(box) {
        box.style.maxHeight = col4Height - 24 + 'px';
    });

    var statBoxHeight = document.querySelector('.statbox').offsetHeight;

    // Function to set max height and enable scrolling
    function setMaxHeightAndScrolling(id) {
        var element = document.getElementById(id);
        element.style.maxHeight = statBoxHeight - 24 + 'px'; // Adjust the 24px if needed for padding
        element.style.overflowY = 'auto'; // Add scrolling to the content
    }

    // Apply to all relevant elements
    
    setMaxHeightAndScrolling('monthly-int');
    setMaxHeightAndScrolling('daily-int');
    setMaxHeightAndScrolling('hourly-int'); 

    function adjustBoxHeights(rowSelector) {
        var rows = document.querySelectorAll(rowSelector);

        rows.forEach(function(row) {
            var infoBoxes = row.querySelectorAll('.infobox');
            var maxHeight = 0;

            // Find the maximum height in this row
            infoBoxes.forEach(function(box) {
                if (box.offsetHeight > maxHeight) {
                    maxHeight = box.offsetHeight;
                }
            });

            // Set all .infobox elements in this row to the maximum height
            infoBoxes.forEach(function(box) {
                box.style.height = maxHeight + 'px';
            });
        });
    }

    // Adjust heights for .infobox elements within the first row
    adjustBoxHeights('.row:first-child');

    // Adjust heights for .infobox elements within the second row
    adjustBoxHeights('.row:nth-child(2)');

    
});

