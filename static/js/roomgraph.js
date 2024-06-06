var overallStats;
Chart.defaults.global.defaultFontColor = '#FFFFFF';
Chart.defaults.global.defaultFontSize = 12;
Chart.defaults.global.defaultFontFamily = 'Arial, sans-serif';
let allRoomData = []; 


const octx1 = document.getElementById('overallfrequencyChart').getContext('2d');
const octx2 = document.getElementById('overalldurationSumChart').getContext('2d');
const octx3 = document.getElementById('overalldurationMeanChart').getContext('2d');
const octxQ1 = document.getElementById('quarter1Chart').getContext('2d');
const octxQ2 = document.getElementById('quarter2Chart').getContext('2d');
const octxQ3 = document.getElementById('quarter3Chart').getContext('2d');
const octxQ4 = document.getElementById('quarter4Chart').getContext('2d');
const rctx1 = document.getElementById('roomBorrowedChart').getContext('2d');
const rctx2 = document.getElementById('roomDurationChart').getContext('2d');
const rctx3 = document.getElementById('roomAverageChart').getContext('2d');

// Initialize the Frequency Bar Chart with empty data
var overallfrequencyChart = new Chart(octx1, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Number of Equipment Items',
            data: [],
            backgroundColor: '#5A81B2',
            borderColor: 'rgba(90, 129, 178, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Rooms'
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

// Initialize the Duration Sum Bar Chart with empty data
var overalldurationSumChart = new Chart(octx2, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Total Duration of Equipment Usage',
            data: [],
            backgroundColor: '#5A81B2',
            borderColor: 'rgba(90, 129, 178, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Rooms'
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

// Initialize the Duration Mean Bar Chart with empty data
var overalldurationMeanChart = new Chart(octx3, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Average Duration of Equipment Usage',
            data: [],
            backgroundColor: '#5A81B2',
            borderColor: 'rgba(90, 129, 178, 1)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Rooms'
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Average Duration in Hours'
                },
                beginAtZero: true
            }
        }
    }
});

// Function to create a pie chart for a specific quarter
function createQuarterPieChart(ctx, quarterData, quarterLabel) {
    console.log(`Creating pie chart for ${quarterLabel}:`, quarterData);
    // Filter out 'Overall' from the labels and data
    const filteredLabels = [];
    const filteredData = [];
    
    overallStats.forEach((item, index) => {
        if (item.Room !== "Overall") {
            filteredLabels.push(item.Room);
            filteredData.push(quarterData[index]);
        }
    });

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: filteredLabels,
            datasets: [{
                label: quarterLabel,
                data: filteredData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    // You can add more colors if needed
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    // Add more border colors if you have more rooms
                ],
                borderWidth: 1
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Equipment Usage by ' + quarterLabel
            }
        }
    });
}


fetch('static/overall_stats.json')
    .then(response => response.json())
    .then(overallData => { // Renamed 'data' to 'overallData'
        
        overallStats = overallData;
        console.log('Room statistics data:', overallStats);

        setTimeout(() => {
            // Update the Frequency Bar Chart
            overallfrequencyChart.data.labels = overallStats.map(item => item.Room);
            overallfrequencyChart.data.datasets[0].data = overallStats.map(item => item['Equipment Count']);
            overallfrequencyChart.update();

            // Update the Duration Sum Bar Chart
            overalldurationSumChart.data.labels = overallStats.map(item => item.Room);
            overalldurationSumChart.data.datasets[0].data = overallStats.map(item => item['Total Duration']);
            overalldurationSumChart.update();

            // Update the Duration Mean Bar Chart
            overalldurationMeanChart.data.labels = overallStats.map(item => item.Room);
            overalldurationMeanChart.data.datasets[0].data = overallStats.map(item => item['Average Duration']);
            overalldurationMeanChart.update();
        }, 5000); // 5 second delay

        // Create the pie charts for each quarter
        setTimeout(() => {
            // Create the pie charts for each quarter
            const quarter1Chart = createQuarterPieChart(octxQ1, overallStats.map(item => item['Q1 Count']), 'Q1');
            const quarter2Chart = createQuarterPieChart(octxQ2, overallStats.map(item => item['Q2 Count']), 'Q2');
            const quarter3Chart = createQuarterPieChart(octxQ3, overallStats.map(item => item['Q3 Count']), 'Q3');
            const quarter4Chart = createQuarterPieChart(octxQ4, overallStats.map(item => item['Q4 Count']), 'Q4');
        }, 10000); // 10 second delay

        // Add event listeners for room selection
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const roomId = this.textContent.trim();
                updateRoomStats(overallStats, roomId);
            });
            });
        
            // Initial update for the default room (e.g., 'Overall')
            updateRoomStats(overallStats, 'Overall');
    })

    .catch(error => console.error('Error fetching room statistics data:', error));







// For Room Stats
// Function to convert UNIX timestamps to a readable date format
function convertTimestampsToDateLabels(timestamps) {
    return timestamps.map(timestamp => new Date(timestamp).toLocaleDateString('en-US'));
}

// Create the chart using the context from a canvas element with id 'roomBorrowedChart'
var roomBorrowedChart = new Chart(rctx1, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Frequency of Equipment Usage Over Time',
            data: [],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

var roomDurationChart = new Chart (rctx2, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Total Duration of Equipment Usage',
            data: [],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Equipment'
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

    var roomAverageChart = new Chart (rctx3, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Average Duration of Equipment Usage',
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Equipment'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average Duration in Hours'
                    },
                    beginAtZero: true
                }
            }
        }
        });
    

fetch('static/room_stats.json')
    .then(response => response.json())
    .then(roomData => {
        console.log('Room statistics data:', roomData);
        // Sort the data by 'DATETIME BORROWED'
        roomData.sort((a, b) => a['DATETIME BORROWED'] - b['DATETIME BORROWED']);

        allRoomData = roomData; // Store the sorted data globally

        // Initialize the chart with the default view, possibly 'Overall'
        updateRoomBorrowedChart('Overall', allRoomData);

        // Prepare the labels and data for the chart (for the default or overall view)

        // Update the chart with the fetched data
        roomBorrowedChart.data.labels = allRoomData.map(item => new Date(item['DATETIME BORROWED']).toLocaleDateString('en-US'));
        roomBorrowedChart.data.datasets[0].data = allRoomData.map(item => item['Frequency']);
        roomBorrowedChart.update();

        roomDurationChart.data.labels = allRoomData.map(item => new Date(item['DATETIME BORROWED']).toLocaleDateString('en-US'));
        roomDurationChart.data.datasets[0].data = allRoomData.map(item => item['Duration Sum']);
        roomDurationChart.update();

        roomAverageChart.data.labels = allRoomData.map(item => new Date(item['DATETIME BORROWED']).toLocaleDateString('en-US'));
        roomAverageChart.data.datasets[0].data = allRoomData.map(item => item['Avverage Duration Per Use']);
        roomAverageChart.update();
    })
    .catch(error => console.error('Error fetching room statistics data:', error));

function handleRoomSelection(roomId) {
    console.log('Test!')
    updateRoomStats(overallStats, roomId);
    updateRoomBorrowedChart(roomId, allRoomData);
}

// Add event listeners to the navbar links to handle room selection
document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default link behavior

        const selectedRoomId = this.textContent.trim(); // Get the room ID from the link text

        // Update active state on nav items
        document.querySelectorAll('.navbar-nav .nav-item').forEach(item => {
            item.classList.remove('active'); // Remove active from all nav items
        });
        this.parentElement.classList.add('active'); // Add active to the clicked nav item
        handleRoomSelection(selectedRoomId);

        // Show or hide elements with data-filter="overall"
        if (selectedRoomId === "Overall") {
            document.querySelectorAll('[data-filter="overall"]').forEach(div => {
                div.style.display = ''; // Show the divs
            });
        } else {
            document.querySelectorAll('[data-filter="overall"]').forEach(div => {
                div.style.display = 'none'; // Hide the divs
            });
        }
    });
});

function updateRoomBorrowedChart(roomId, roomData) {
    console.log(`Updating charts for Room ID: ${roomId}`, roomData);
    let filteredData;
    if (roomId === 'Overall') {
        filteredData = roomData; // Use all data if 'Overall' is selected
        console.log('Overall selected. Displaying data for all rooms.', filteredData);
    } else {
        // Filter data for the selected room
        filteredData = roomData.filter(item => item.Room === roomId);
        console.log(`Room ${roomId} selected. Displaying data for this room:`, filteredData);
    }

    const labels = filteredData.map(item => new Date(item['DATETIME BORROWED']).toLocaleDateString('en-US'));
    const data = filteredData.map(item => item['Frequency']);
    console.log("Average Duration Data:", allRoomData.map(item => item['Average Duration Per Use']));


    if (roomBorrowedChart && roomDurationChart) {
        // Update the charts if they are already initialized
        roomBorrowedChart.data.labels = labels;
        roomBorrowedChart.data.datasets[0].data = data;
        roomBorrowedChart.update();

        roomDurationChart.data.labels = labels;
        roomDurationChart.data.datasets[0].data = filteredData.map(item => item['Duration Sum']);
        roomDurationChart.update();

        roomAverageChart.data.labels = labels;
        roomAverageChart.data.datasets[0].data = filteredData.map(item => item['Average Duration Per Use'])
        roomAverageChart.update();
    } else {
        console.error('Charts not initialized!');
    }
}

const roomDetails = {
    "ENB204": {
        name: "Electronics Laboratory #2",
        number: "ENB 204"
    },
    "ENB201": {
        name: "Electronics Laboratory #1",
        number: "ENB 201"
    },
    "ENB205": {
        name: "Electronics Laboratory #3",
        number: "ENB 205"
    },
    "TC101": {
        name: "Civil Engineering Laboratory #1",
        number: "TC 101"
    },
    "TC102": {
        name: "Civil Engineering Laboratory #2",
        number: "TC 102"
    },
    "ER201": {
        name: "Chemistry Lab",
        number: "ER 201"
    },
    "Others": {
        name: "Others",
        number: "N/A"
    },
    "Overall": {
        name: "Overall",
        number: "N/A"
    }
    };


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

function updateRoomStats(overallStats, roomId) {
    // Filter the stats for the selected room
    const filteredStats = overallStats.filter(stat => stat.Room === roomId);
    
    // Calculate the total number of equipments
    const totalEquipments = filteredStats.length;

    // Get the room details from the dictionary
    const roomInfo = roomDetails[roomId] || roomDetails["Others"];

    // Update the room information card
    document.getElementById('room-name').textContent = `Name: ${roomInfo.name}`;
    
    document.getElementById('room-number').textContent = `Number: ${roomInfo.number}`;

    // Check if there are any statistics for the room
    if (filteredStats.length > 0) {
        // Update other cards with specific stats as needed
        filteredStats.forEach((stat, index) => {
            // Update the content of each card
            document.getElementById('total-equipments').textContent = `Total Equipments: ${stat['Equipment Count']}`
            document.getElementById('frequency').textContent = `Frequency: ${stat['Frequency']}`;
            document.getElementById('total-duration').textContent = `Total Duration: ${formatAsTime(stat['Total Duration'])}`;
            document.getElementById('average-duration').textContent = `Average Duration: ${formatAsTime(stat['Average Duration'])}`;
            document.getElementById('max-duration').textContent = `Max Duration: ${formatAsTime(stat['Max Duration'])}`;
            document.getElementById('median-duration').textContent = `Typical Duration: ${formatAsTime(stat['Median Duration'])}`;
            document.getElementById('min-duration').textContent = `Min Duration: ${formatAsTime(stat['Min Duration'])}`;
            document.getElementById('standard-deviation').textContent = `Standard Deviation: ${stat['Standard Deviation Duration'].toFixed(2)}`;
            document.getElementById('unique-dates').textContent = `Unique Dates: ${stat['Unique Dates']}`;
            // Add more updates as needed
        });
    } else {
        document.getElementById('frequency').textContent = 'Frequency: 0';
        document.getElementById('total-duration').textContent = 'Total Duration: 00:00';
        document.getElementById('average-duration').textContent = 'Average Duration: 00:00';
        document.getElementById('max-duration').textContent = 'Max Duration: 00:00';
        document.getElementById('median-duration').textContent = 'Median Duration: 00:00';
        document.getElementById('min-duration').textContent = 'Min Duration: 00:00';
        document.getElementById('standard-deviation').textContent = 'Standard Deviation: 0.00';
        document.getElementById('unique-dates').textContent = 'Unique Dates: 0';
    }
    
}

    


$(document).ready(function() {
    // Fetch the JSON data and populate the DataTable
    $.getJSON('static/eqstats.json', function(data) {
        let filteredRoom = data.filter(item => item.condition);
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
                { data: 'Peak Quarter', title: 'Peak Quarter that the Equipment is Used' },
                
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
    $('#roomstats').on('click','tbody tr', function() {
        var rowData = table.row(this).data();
        console.log('Row clicked:', rowData);
        $('#interpretationList').text(rowData['Overall Interpretation']); // Update the interpretation box
        $('#roomstats tbody tr').removeClass('highlight');
        fetchEquipmentSchedule(rowData['Equipment Name']);

    
        // Add the 'highlight' class to the clicked row
        $(this).addClass('highlight');
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

function fetchEquipmentSchedule(equipmentName) {
    console.log('Fetching schedule for:', equipmentName);
    fetch('static/sched.json')  // URL to your schedules data
        .then(response => response.json())
        .then(allSchedules => {
            console.log('All fetched schedules:', allSchedules);
            var schedule = allSchedules.find(s => s.Name.toLowerCase() === equipmentName.toLowerCase());
            if (schedule) {
                console.log('Matching schedule found:', schedule);
                displaySchedules(schedule);
            } else {
                console.error('No schedule found for:', equipmentName);
            }
        })
        .catch(error => console.error('Error fetching schedules:', error));
}


function displaySchedules(schedule) {
    var content = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th colspan="3">${schedule.Name} - Maintenance Schedule</th>
                </tr>
                <tr>
                    <th>Maintenance Type</th>
                    <th>Next Maintenance Date</th>
                    <th>Depreciation Date</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${schedule['MAINTENANCE TYPE']}</td>
                    <td>${schedule.NextMaintenanceDate_MLR || 'N/A'}</td>
                    <td>${schedule.DepreciationDate_MLR || 'N/A'}</td>
                </tr>
                <tr>
                    <td>${schedule['MAINTENANCE TYPE']}</td>
                    <td>${schedule.NextMaintenanceDate_KNN || 'N/A'}</td>
                    <td>${schedule.DepreciationDate_KNN || 'N/A'}</td>
                </tr>
                <tr>
                    <td>${schedule['MAINTENANCE TYPE']}</td>
                    <td>${schedule.NextMaintenanceDate_SVR || 'N/A'}</td>
                    <td>${schedule.DepreciationDate_SVR || 'N/A'}</td>
                </tr>
            </tbody>
        </table>
    `;

    document.getElementById('scheduleDisplay').innerHTML = content;
}
