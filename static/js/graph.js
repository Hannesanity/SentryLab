var data;
var MonthStats;
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

var labHours = {
    0: '7 AM',
    1: '8 AM',
    2: '9 AM',
    3: '10 AM',
    4: '11 AM',
    5: '12 PM',
    6: '1 PM',
    7: '2 PM',
    8: '3 PM',
    9: '4 PM',
    10: '5 PM',
    11: '6 PM'
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

// Get the context of the canvas element we want to select
var ctx = document.getElementById('MonthStats').getContext('2d');
var ctx2 = document.getElementById('totalDurationPerMonth').getContext('2d');
var ctx3 = document.getElementById('peakHoursOfUsage').getContext('2d');
var ctx4 = document.getElementById('usagePatternsOverDays').getContext('2d');
var ctx5 = document.getElementById('borrowingPatterns').getContext('2d');
var ctx6 = document.getElementById('idleTime').getContext('2d');

// Create the chart
MonthStats = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Total Quantity Borrowed per Month',
            data: [],  // Initialize with empty data
            backgroundColor: '#ffea7e', // Updated color
            borderColor: 'rgba(255, 234, 126, 1)', // Updated color
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

// Get the context of the canvas element for the second graph



// Create the second chart
var totalDurationPerMonthChart = new Chart(ctx2, {
    type: 'bar',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Total Duration of Equipment Usage Per Month',
            data: [],  // Initialize with empty data
            backgroundColor: '#ffea7e', // Updated color
            borderColor: 'rgba(255, 234, 126, 1)', // Updated color
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
                    text: 'Total Duration in Hours'
                },
                beginAtZero: true
            }
        }
    }
});

// Create other charts
var peakHoursOfUsageChart = new Chart(ctx3, {
    type: 'line',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Peak Hours of Usage',
            data: [],  // Initialize with empty data
            backgroundColor: '#ffea7e', // Updated color
            borderColor: 'rgba(255, 234, 126, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Hours of the Day'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Usage Frequency'
                },
                beginAtZero: true
            }
        }
    }
});

var usagePatternsOverDaysChart = new Chart(ctx4, {
    type: 'line',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Usage Patterns Over Days of the Week',
            data: [],  // Initialize with empty data
            backgroundColor: '#ffea7e', // Updated color
            borderColor: 'rgba(255, 234, 126, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Days of the Week'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Usage Frequency'
                },
                beginAtZero: true
            }
        }
    }
});

var borrowingPatternsChart = new Chart(ctx5, {
    type: 'line',
    data: {
        labels: [],  // Initialize with empty labels
        datasets: [{
            label: 'Idle Time (1 = Idle)',
            data: [],  // Initialize with empty data
            backgroundColor: '#ffea7e', // Updated color
            borderColor: 'rgba(255, 234, 126, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
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
                    text: 'Idle or Available?'
                },
                beginAtZero: true
            }
        }
    }
});
var activeBorrowingsChart = new Chart(ctx6, {
    type: 'line',
    data: {
        labels: ['7', '8', '9', '10', '11', '12', '13', '14', '15'], // Hours of the day
        datasets: [{
            label: 'Active Borrowings',
            data: [3, 4, 5, 8, 10, 9, 9, 0, 4], // Replace with your actual data
            backgroundColor: '#ffea7e', // Updated color
            borderColor: 'rgba(255, 234, 126, 1)', // Updated color
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                ticks: {
                    color: '#FFFFFF' // this will change the x-axis tick labels to white
                },
                title: {
                    display: true,
                    text: 'Hour of the Day'
                }
            },
            y: {
                
                title: {
                    display: true,
                    text: 'Number of Active Borrowings'
                },
                beginAtZero: true
            }
        }
    }
});

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

$('#unique-id-select').change(function() {
    var selectedUniqueId = $(this).val();

    // Filter the data for the selected unique ID
    var filteredMonthlyData = allGraphData.monthly.filter(item => item.UniqueID === selectedUniqueId);
    var filteredWeeklyData = allGraphData.weekly.filter(item => item.UniqueID === selectedUniqueId);
    var filteredHourlyData = allGraphData.hourly.filter(item => item.UniqueID === selectedUniqueId);
    console.log('Filtered monthly data:', filteredMonthlyData);
    console.log('Filtered weekly data:', filteredWeeklyData);
    console.log('Filtered hourly data:', filteredHourlyData);

    var selectedData = data.find(function(item) {
        return item['UniqueID'] === selectedUniqueId;
    });


    if (selectedData) {
        document.getElementById('total-qty').textContent = selectedData['Frequency'];
        document.getElementById('avg-duration').textContent = formatAsTime(selectedData['Average Duration']);
        document.getElementById('total-dur').textContent = formatAsTime(selectedData['Total Duration']);
        document.getElementById('max-dur').textContent = formatAsTime(selectedData['Max Duration']);
        document.getElementById('min-dur').textContent = formatAsTime(selectedData['Min Duration']);
        document.getElementById('correlation').textContent = parseFloat(selectedData['Correlations']).toFixed(2);
        document.getElementById('outliers').textContent = parseFloat(selectedData['Outliers']).toFixed(2);
        document.getElementById('firstdateret').textContent = new Date(selectedData['First Return Date']).toLocaleDateString(); // Convert timestamp to date
        document.getElementById('firstdatebor').textContent = new Date(selectedData['First Borrow Date']).toLocaleDateString(); // Convert timestamp to date
        document.getElementById('lastdateret').textContent = new Date(selectedData['Last Return Date']).toLocaleDateString(); // Convert timestamp to date
        document.getElementById('lastdatebor').textContent = new Date(selectedData['Last Borrow Date']).toLocaleDateString(); // Convert timestamp to date
        document.getElementById('median-dur').textContent = formatAsTime(selectedData['Median Duration']);
        document.getElementById('std-dev-dur').textContent = selectedData['Standard Deviation Duration'].toFixed(2);
        document.getElementById('unique-dates').textContent = selectedData['Unique Dates'];
        document.getElementById('most-freq-day').textContent = selectedData['Most Frequent Day'];
        document.getElementById('range-duration').textContent = selectedData['Range Duration'].toFixed(2);
        document.getElementById('most-freq-month').textContent = selectedData['Most Frequent Month'];
    }
    
  
    // Update the charts if they exist
    if (MonthStats && totalDurationPerMonthChart && peakHoursOfUsageChart && usagePatternsOverDaysChart && borrowingPatternsChart) {
        // Update Monthly Stats Chart
        MonthStats.data.labels = filteredMonthlyData.map(item => monthNames[item.MONTH]);
        MonthStats.data.datasets[0].data = filteredMonthlyData.map(item => item.QUANTITY);
        MonthStats.update();

        totalDurationPerMonthChart.data.labels = filteredMonthlyData.map(item => monthNames[item.MONTH]);
        totalDurationPerMonthChart.data.datasets[0].data = filteredMonthlyData.map(item => item['TOTAL DURATION']);
        totalDurationPerMonthChart.update();

        // Update Weekly Usage Chart
        usagePatternsOverDaysChart.data.labels = filteredWeeklyData.map(item => dayNames[item['DAY OF WEEK']]);
        usagePatternsOverDaysChart.data.datasets[0].data = filteredWeeklyData.map(item => item.FREQUENCY);
        usagePatternsOverDaysChart.update();

        // Update Hourly Usage Chart
        peakHoursOfUsageChart.data.labels = filteredHourlyData.map(item => item['HOUR BORROWED'] + ':00');
        peakHoursOfUsageChart.data.datasets[0].data = filteredHourlyData.map(item => item['ACTIVE BORROWINGS']);
        peakHoursOfUsageChart.update();

        // Update Borrowing Patterns Chart
        borrowingPatternsChart.data.labels = filteredHourlyData.map(item => item['HOUR BORROWED'] + ':00');
        borrowingPatternsChart.data.datasets[0].data = filteredHourlyData.map(item => item['IDLE TIME PER HOUR']);
        borrowingPatternsChart.update();

        // Update Borrowing Patterns Chart
        activeBorrowingsChart.data.labels = filteredHourlyData.map(item => item['HOUR BORROWED'] + ':00');
        activeBorrowingsChart.data.datasets[0].data = filteredHourlyData.map(item => item['UPTIME_FLAG']);
        activeBorrowingsChart.update();

    }
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
  });

  function clearCharts() {

  }

  $('#unique-id-select').change(function() {
    var selectedUniqueId = $(this).val();
    // Check if the selected unique ID is empty
    if (!selectedUniqueId) {
            // Clear the data
        document.getElementById('total-qty').textContent = '';
        document.getElementById('avg-duration').textContent = '';
        document.getElementById('total-dur').textContent = '';
        document.getElementById('max-dur').textContent = '';
        document.getElementById('min-dur').textContent = '';
        document.getElementById('lastdate').textContent = '';
        document.getElementById('correlation').textContent = '';
        document.getElementById('outliers').textContent = '';
            
        MonthStats.data.labels = [];
        MonthStats.data.datasets[0].data = [];
        
        totalDurationPerMonthChart.data.labels = [];
        totalDurationPerMonthChart.data.datasets[0].data = [];
    
        peakHoursOfUsageChart.data.labels = [];
        peakHoursOfUsageChart.data.datasets[0].data = [];
    
        usagePatternsOverDaysChart.data.labels = [];
        usagePatternsOverDaysChart.data.datasets[0].data = [];
    
        borrowingPatternsChart.data.labels = [];
        borrowingPatternsChart.data.datasets[0].data = [];
    
        // Update the charts
        MonthStats.update();
        totalDurationPerMonthChart.update();
        peakHoursOfUsageChart.update();
        usagePatternsOverDaysChart.update();
        borrowingPatternsChart.update();

      return;  // Exit the function
    }



  });