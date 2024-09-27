var data;
var graphData;
let allGraphData = {
    monthly: null,
    weekly: null,
    hourly: null
};
var calendarsched;

Chart.defaults.global.defaultFontColor = '#FFFFFF';
Chart.defaults.global.defaultFontSize = 12;
Chart.defaults.global.defaultFontFamily = 'Arial, sans-serif';


  var filterToCanvasMap = {
    'filter1': ['yearTotalDur', 'yearFreq', 'yearUtil', 'yearMinMaxDur'],
    'filter2': ['monthTotalDur', 'monthUtil', 'monthMinMaxDur', 'monthFreq'],
    'filter3': ['weekFreq', 'weekTotalDur', 'weekMinMaxDur'],
    'filter4': ['hourUptime', 'hourBorrow', 'hourAvgDur', 'hourOccu']
};

// Update the canvas visibility based on the selected filter
function updateCanvasVisibility(selectedFilter) {
    document.querySelectorAll('[data-filter]').forEach(function(element) {
        element.style.display = 'none';
    });

    if (selectedFilter === 'overall') {
        document.querySelectorAll('[data-filter="overall"]').forEach(function(element) {
            element.style.display = 'block';
        });
    } else {
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

// Functions when the page loads
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

// Fetch Yearly Data
fetch('static/yearly.json')
    .then(response => response.json())
    .then(data => {
        allGraphData.year = data;
        console.log('Yearly data:', allGraphData.year);
    })
    .catch(error => console.error('Error fetching year data:', error));

// Fetch Overall Data
fetch('static/overall.json')
    .then(response => response.json())
    .then(data => {
        allGraphData.overall = data;
        console.log('Overall data:', allGraphData.overall);
    })
    .catch(error => console.error('Error fetching year data:', error));

// Canvas
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


// Chart functions
// For monthly charts
var monthTotalDurationChart = new Chart(ctx2, {
    type: 'bar',
    data: {
        labels: [], 
        datasets: [{
            label: 'Total Duration of Equipment Usage Per Month',
            data: [], 
            backgroundColor: '#5A81B2', 
            borderColor: 'rgba(90, 129, 178, 1)', 
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


var monthUtilChart = new Chart(ctx3, {
    type: 'line',
    data: {
        labels: [],  
        datasets: [{
            label: 'Monthly Utilization Rate',
            data: [],  
            backgroundColor: '#5A81B2', 
            borderColor: 'rgba(90, 129, 178, 1)',
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
        labels: [],
        datasets: [
            {
                label: 'Min Duration',
                data: [], 
                borderColor: 'rgba(255, 99, 132, 1)', 
                borderWidth: 1,
                borderDash: [5, 5]
            },
            {
                label: 'Average Duration',
                data: [], 
                borderColor: 'rgba(255, 255, 224, 1)', 
                borderWidth: 1,
                borderDash: [5, 5]
            },
            {
                label: 'Max Duration',
                data: [], 
                borderColor: 'rgba(54, 162, 235, 1)', 
                borderWidth: 1
            }

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
        labels: [],  
        datasets: [{
            label: 'Frequency per Month',
            data: [],  
            backgroundColor: '#5A81B2', 
            borderColor: 'rgba(90, 129, 178, 1)', 
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

// For weekly charts
var weekTotalDurationChart = new Chart(ctx6, {
    type: 'bar',
    data: {
        labels: [],  
        datasets: [{
            label: 'Total Duration of Equipment Usage Per week',
            data: [],  
            backgroundColor: '#5A81B2', 
            borderColor: 'rgba(90, 129, 178, 1)', 
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
        labels: [],
        datasets: [
            {
                label: 'Min Duration',
                data: [], 
                borderColor: 'rgba(255, 99, 132, 1)', 
                borderWidth: 1,
                borderDash: [5, 5]
            },
            {
                label: 'Average Duration',
                data: [], 
                borderColor: 'rgba(255, 255, 224, 1)', 
                borderWidth: 1,
                borderDash: [5, 5]
            },
            {
                label: 'Max Duration',
                data: [], 
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }
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
        labels: [],  
        datasets: [{
            label: 'Frequency per week',
            data: [],  
            backgroundColor: '#5A81B2', 
            borderColor: 'rgba(90, 129, 178, 1)', 
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

// For daily charts
var hourUptimeChart = new Chart(ctx10, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Uptime',
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.5)', 
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            fill: false 
        }, {
            label: 'Idle Time',
            data: [], 
            backgroundColor: 'rgba(255, 99, 132, 0.5)', 
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
            backgroundColor: 'rgba(54, 162, 235, 0.5)', 
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            fill: true, 
            borderDash: [5,5]
        }, {
            label: 'Returned',
            data: [] ,
            backgroundColor: 'rgba(255, 99, 132, 0.5)', 
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: true 
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                stacked: true 
            }
        }
    }
});


var hourAvgDurChart = new Chart(ctx12, {
    type: 'line',
    data: {
        labels: [],  
        datasets: [{
            label: 'Average Duration',
            data: [], 
            backgroundColor: '#5A81B2',
            borderColor: 'rgba(90, 129, 178, 1)', 
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
        labels: [], 
        datasets: [{
            label: 'Times that the equipment is occupied',
            data: [],  
            backgroundColor: '#5A81B2',
            borderColor: 'rgba(90, 129, 178, 1)', 
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

// For overall charts
var yearMinMaxDurChart = new Chart(ctx14, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [
            {
                label: 'Min Duration',
                data: [], 
                borderColor: 'rgba(255, 99, 132, 1)', 
                borderWidth: 1,
                borderDash: [5,5]
            },
            {
                label: 'Average Duration',
                data: [], 
                borderColor: 'rgba(255, 255, 224, 1)', 
                borderWidth: 1,
                borderDash: [5,5]
            },
            {
                label: 'Max Duration',
                data: [], 
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }

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
    const canvas = document.getElementById(canvasId);
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
                ctx.font = 'bold 16px Arial'; 
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#333'; 
                const text = healthPercentage.toFixed(1) + '%'; 
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

// Formatting time purposes
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

// Updating selected equipment
function updateSelectedEquipmentData(selectedUniqueId) {
    fetch('/static/items.json')
    .then(response => response.json())
    .then(itemsData => {
        // Finding items based on selected UniqueID
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

    
    var filteredMonthlyData = allGraphData.monthly.filter(item => item.UniqueID === selectedUniqueId);
    var filteredWeeklyData = allGraphData.weekly.filter(item => item.UniqueID === selectedUniqueId);
    var filteredHourlyData = allGraphData.hourly.filter(item => item.UniqueID === selectedUniqueId);
    var filteredYearData = allGraphData.year.filter(item => item.UniqueID === selectedUniqueId);
    var filteredOverallData = allGraphData.overall.filter(item => item.UniqueID === selectedUniqueId);
    var selectedData = data.find(function(item) {
        return item['UniqueID'] === selectedUniqueId;
    });

    console.log(selectedData)

    if (selectedData) {
        document.getElementById('total-qty').textContent = selectedData['Frequency'];
        document.getElementById('late-return').textContent = selectedData['Late Return'];
        document.getElementById('avg-duration').textContent = formatAsTime(selectedData['Average Duration']);
        document.getElementById('total-dur').textContent = formatAsTime(selectedData['Total Duration']);
        document.getElementById('max-dur').textContent = formatAsTime(selectedData['Max Duration']);
        document.getElementById('min-dur').textContent = formatAsTime(selectedData['Min Duration']);
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
        
        var nextMaintenanceDate = selectedData['NextMaintenanceDate_MLR'];

        if (nextMaintenanceDate) {
            redirectToSchedule(nextMaintenanceDate, 'dayGridMonth');
        }

        var events = [
            {
                title: selectedData['Equipment Name'] + ' ' + selectedData['MAINTENANCE TYPE'] + ' based on MLR',
                start: selectedData['NextMaintenanceDate_MLR'],
                allDay: true,
                classNames: ['maintenance-event'] 
            },
            {
                title: selectedData['Equipment Name'] + ' ' + selectedData['MAINTENANCE TYPE'] + ' based on KNN',
                start: selectedData['NextMaintenanceDate_KNN'],
                allDay: true,
                classNames: ['maintenance-event']
            },
            {
                title: selectedData['Equipment Name'] + ' ' + selectedData['MAINTENANCE TYPE'] + ' based on SVR',
                start: selectedData['NextMaintenanceDate_SVR'],
                allDay: true,
                classNames: ['maintenance-event']
            },
            {
                title: selectedData['Equipment Name'] + ' Depreciation based on MLR',
                start: selectedData['DepreciationDate_MLR'],
                allDay: true,
                classNames: ['depreciation-event'] 
            },
            {
                title: selectedData['Equipment Name'] + ' Depreciation based on KNN',
                start: selectedData['DepreciationDate_KNN'],
                allDay: true,
                classNames: ['depreciation-event']
            },
            {
                title: selectedData['Equipment Name'] + ' Depreciation based on SVR',
                start: selectedData['DepreciationDate_SVR'],
                allDay: true,
                classNames: ['depreciation-event']
            }
        ];

        // Clear previous events
        window.calendarsched.getEventSources().forEach(eventSource => eventSource.remove());

        // Add new events
        window.calendarsched.addEventSource(events);

       
    }
    
    // Update Monthly Stats Chart    
    monthTotalDurationChart.data.labels = filteredMonthlyData.map(item => monthNames[item.MONTH]);
    monthTotalDurationChart.data.datasets[0].data = filteredMonthlyData.map(item => item['TotalDuration']);
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
    weekTotalDurationChart.data.datasets[0].data = filteredWeeklyData.map(item => item['TotalDuration']);
    weekTotalDurationChart.update();

    weekMinMaxDurChart.data.labels = filteredWeeklyData.map(item => dayNames[item['DAY OF WEEK']]);
    weekMinMaxDurChart.data.datasets[0].data = filteredWeeklyData.map(item => item['MIN DURATION']);
    weekMinMaxDurChart.data.datasets[1].data = filteredWeeklyData.map(item => item['AVERAGE DURATION']);
    weekMinMaxDurChart.data.datasets[2].data = filteredWeeklyData.map(item => item['MAX DURATION']);
    weekMinMaxDurChart.update();

    weekUtilChart.data.labels = filteredWeeklyData.map(item => dayNames[item['DAY OF WEEK']]);
    weekUtilChart.data.datasets[0].data = filteredWeeklyData.map(item => item['DAILY UTILIZATION']);
    weekUtilChart.update();


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
    hourOccuChart.data.datasets[0].data = filteredHourlyData.map(item => item['Occupancy Count']);
    hourOccuChart.update();

    // Update Years Chart
    yearMinMaxDurChart.data.labels = filteredYearData.map(item => item['YEAR']);
    yearMinMaxDurChart.data.datasets[0].data = filteredYearData.map(item => item['MIN DURATION']);
    yearMinMaxDurChart.data.datasets[1].data = filteredYearData.map(item => item['AVERAGE DURATION']);
    yearMinMaxDurChart.data.datasets[2].data = filteredYearData.map(item => item['MAX DURATION']);
    yearMinMaxDurChart.update();

    yearTotalDurationChart.data.labels = filteredYearData.map(item => item['YEAR']);
    yearTotalDurationChart.data.datasets[0].data = filteredYearData.map(item => item['TotalDuration']);
    yearTotalDurationChart.update();

    yearFreqChart.data.labels = filteredYearData.map(item => item['YEAR']);
    yearFreqChart.data.datasets[0].data = filteredYearData.map(item => item['FREQUENCY']);
    yearFreqChart.update();

    yearUtilChart.data.labels = filteredYearData.map(item => item['YEAR']);
    yearUtilChart.data.datasets[0].data = filteredYearData.map(item => item['YEAR UTILIZATION']);
    yearUtilChart.update();


}

// Update the selected equipment data when the unique ID changes
$('#unique-id-select').change(function() {
    var selectedUniqueId = $(this).val();
    updateSelectedEquipmentData(selectedUniqueId); // Call the function to update the data
});

// Functions when the page loads
$(document).ready(function() {
    updateUniqueIdSelect();
    $('#equipment-select').change(updateUniqueIdSelect); 
});


// Initialize the calendar along with calendar functions
document.addEventListener('DOMContentLoaded', function() {

    document.querySelectorAll('[data-toggle="tooltip"]').forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    var calendarEl = document.getElementById('schedulercal');

    window.calendarsched = new FullCalendar.Calendar(calendarEl, {
        initialView: 'listMonth', 
        views: {
            listYear: {
                buttonText: 'Year View' 
            },
            listMonth: {
                buttonText: 'Month View'
            },
            dayGridMonth: {
                buttonText: 'Month Events'
            }
        },
        headerToolbar: {
            left: 'prev,next', 
            center: 'title',
            right: 'dayGridMonth,listMonth,listYear' 
        },
        events: [            
        ]
    });

    calendarsched.render();
});

// Function to redirect to the schedule view
function redirectToSchedule(date) {
    if (window.calendarsched) {        
        window.calendarsched.gotoDate(date);
        window.calendarsched.changeView('listMonth');
    } else {
        console.error('Calendar is not initialized.');
    }
}