var overallStats;
Chart.defaults.global.defaultFontColor = '#FFFFFF';
Chart.defaults.global.defaultFontSize = 12;
Chart.defaults.global.defaultFontFamily = 'Arial, sans-serif';
let allRoomData = []; 
var calendar;



const octxQ1 = document.getElementById('quarter1Chart').getContext('2d');
const octxQ2 = document.getElementById('quarter2Chart').getContext('2d');
const octxQ3 = document.getElementById('quarter3Chart').getContext('2d');
const octxQ4 = document.getElementById('quarter4Chart').getContext('2d');
const rctx1 = document.getElementById('roomBorrowedChart').getContext('2d');
const rctx2 = document.getElementById('roomDurationChart').getContext('2d');
const rctx3 = document.getElementById('roomAverageChart').getContext('2d');


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
    .then(overallData => {
        overallStats = overallData;
        console.log('Room statistics data:', overallStats);

        // Populate the navbar dynamically based on the room names from the JSON data
        const navbarItems = document.getElementById('navbarItems');
        overallStats.forEach((room, index) => {
            console.log(`Room ${index + 1}: ${room.Room}`);
            const isActive = room.Room === 'Overall' ? 'active' : ''; // Highlight 'Overall' as active by default
            const listItem = document.createElement('li');
            listItem.className = `nav-item ${isActive}`;
            listItem.innerHTML = `<a class="nav-link" href="#">${room.Room}</a>`;
            navbarItems.appendChild(listItem);
        });

        // Event listener for updating room statistics based on room selection
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                const roomId = this.textContent.trim();
                updateRoomStats(overallStats, roomId);
                updateRoomBorrowedChart(roomId, allRoomData);
            });
        });

        // Initial update for the default room (e.g., 'Overall')
        updateRoomStats(overallStats, 'Overall');

        setTimeout(() => {
            // Update the Frequency Bar Chart
        }, 5000); // 5 second delay

        // Create the pie charts for each quarter after a delay
        setTimeout(() => {
            const quarter1Chart = createQuarterPieChart(octxQ1, overallStats.map(item => item['Q1 Count']), 'Q1');
            const quarter2Chart = createQuarterPieChart(octxQ2, overallStats.map(item => item['Q2 Count']), 'Q2');
            const quarter3Chart = createQuarterPieChart(octxQ3, overallStats.map(item => item['Q3 Count']), 'Q3');
            const quarter4Chart = createQuarterPieChart(octxQ4, overallStats.map(item => item['Q4 Count']), 'Q4');
        }, 10000); // 10 second delay
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
        // Sort the data by 'DateTime Borrowed'
        roomData.sort((a, b) => a['DateTimeBorrowed'] - b['DateTimeBorrowed']);

        allRoomData = roomData; // Store the sorted data globally

        // Initialize the chart with the default view, possibly 'Overall'
        updateRoomBorrowedChart('Overall', allRoomData);
              

        // Update the chart with the fetched data
        roomBorrowedChart.data.labels = allRoomData.map(item => new Date(item['DateTimeBorrowed']).toLocaleDateString('en-US'));
        roomBorrowedChart.data.datasets[0].data = allRoomData.map(item => item['Frequency']);
        roomBorrowedChart.update();

        roomDurationChart.data.labels = allRoomData.map(item => new Date(item['DateTimeBorrowed']).toLocaleDateString('en-US'));
        roomDurationChart.data.datasets[0].data = allRoomData.map(item => item['Duration Sum']);
        roomDurationChart.update();

        roomAverageChart.data.labels = allRoomData.map(item => new Date(item['DateTimeBorrowed']).toLocaleDateString('en-US'));
        roomAverageChart.data.datasets[0].data = allRoomData.map(item => item['Average Duration Per Use']);
        roomAverageChart.update();
    })
    .catch(error => console.error('Error fetching room statistics data:', error));


function updateRoomBorrowedChart(roomId, roomData) {
    console.log(`Updating charts for Room ID: ${roomId}`, roomData);

    // Filter data based on the selected room
    let filteredData;
    if (roomId === 'Overall') {
        filteredData = roomData; // Use all data if 'Overall' is selected
        console.log('Overall selected. Displaying data for all rooms.', filteredData);
    } else {
        // Filter data for the selected room
        filteredData = roomData.filter(item => item.Room === roomId);
        console.log(`Room ${roomId} selected. Displaying data for this room:`, filteredData);
    }

    // Check if filteredData contains elements before proceeding
    if (!filteredData || filteredData.length === 0) {
        console.warn(`No data available for Room ID: ${roomId}`);
        return; // Exit the function if no data is found for the selected room
    }

    // Extract labels and data for the charts
    const labels = filteredData.map(item => new Date(item['DateTimeBorrowed']).toLocaleDateString('en-US'));
    const frequencyData = filteredData.map(item => item['Frequency']);
    const durationData = filteredData.map(item => item['Duration Sum']);
    const averageDurationData = filteredData.map(item => item['Average Duration Per Use']);



    // Ensure charts are initialized and then update them
    if (roomBorrowedChart && roomDurationChart && roomAverageChart) {
        roomBorrowedChart.data.labels = labels;
        roomBorrowedChart.data.datasets[0].data = frequencyData;
        roomBorrowedChart.update();

        roomDurationChart.data.labels = labels;
        roomDurationChart.data.datasets[0].data = durationData;
        roomDurationChart.update();

        roomAverageChart.data.labels = labels;
        roomAverageChart.data.datasets[0].data = averageDurationData;
        roomAverageChart.update();
    } else {
        console.error('Charts not initialized!');
    }
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

function updateRoomStats(overallStats, roomId) {
    // Fetch room details from rooms.json
    $.getJSON('/static/rooms.json', function (rooms) {
        // Convert rooms array to a dictionary for easy lookup by RoomNumber
        const roomDetails = rooms.reduce((acc, room) => {
            acc[room.RoomNumber] = { name: room.RoomName, number: room.RoomNumber };
            return acc;
        }, {});

        // Filter the stats for the selected room
        console.log("Filtering stats for room:", roomId);
        const filteredStats = overallStats.filter(stat => stat.Room === roomId);

        // Get the room details from the fetched data
        const roomInfo = roomDetails[roomId] || { name: "Others", number: "N/A" };

        // Your logic to handle filteredStats and roomInfo goes here
        console.log("Room Info:", roomInfo);

        // Update the room information card
        document.getElementById('room-name').textContent = roomInfo.name;
        
        document.getElementById('room-number').textContent = roomInfo.number;

        // Check if there are any statistics for the room
        if (filteredStats.length > 0) {
            // Update other cards with specific stats as needed
            filteredStats.forEach((stat, index) => {
                // Update the content of each card
                document.getElementById('total-equipments').textContent = stat['Equipment Count'];
                document.getElementById('frequency').textContent = stat['Frequency'];
                document.getElementById('total-duration').textContent = formatAsTime(stat['Total Duration']);
                document.getElementById('average-duration').textContent = formatAsTime(stat['Average Duration']);
                document.getElementById('max-duration').textContent = formatAsTime(stat['Max Duration']);
                document.getElementById('median-duration').textContent = formatAsTime(stat['Median Duration']);
                document.getElementById('min-duration').textContent = formatAsTime(stat['Min Duration']);
                document.getElementById('standard-deviation').textContent = stat['Standard Deviation Duration'].toFixed(2);
                document.getElementById('unique-dates').textContent = stat['Unique Dates'];
                // Add more updates as needed
            });
        } else {
            document.getElementById('frequency').textContent = '0';
            document.getElementById('total-duration').textContent = '00:00';
            document.getElementById('average-duration').textContent = '00:00';
            document.getElementById('max-duration').textContent = '00';
            document.getElementById('median-duration').textContent = '00:00';
            document.getElementById('min-duration').textContent = '00:00';
            document.getElementById('standard-deviation').textContent = '0.00';
            document.getElementById('unique-dates').textContent = '0';
        }})
    
}

function populateInventorySelect(eqStats) {
    const inventorySelect = $('#inventory-select');
    inventorySelect.empty(); // Clear any existing options

    eqStats.forEach(stat => {
        inventorySelect.append(new Option(stat["EquipmentName"], stat["EquipmentName"]));
    });

    // Trigger change event to load the stats for the first item by default
    inventorySelect.change();
}

function updateEquipmentStats() {
    const selInventory = $('#inventory-select').val();
    fetch('static/eqstats.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    
    .then(eqStats => {
        if (!selInventory) {
            // If no item is selected, populate the select box first
            populateInventorySelect(eqStats);
        } else {
            // Fetch and display the stats for the selected equipment
            const equipmentStat = eqStats.find(stat => stat["EquipmentName"] === selInventory);

            if (equipmentStat) {
                console.log('Equipment Stat:', equipmentStat);
                
                document.getElementById('eqstat-avg').textContent = formatAsTime(equipmentStat['Average Duration']);                
                document.getElementById('eqstat-first-bor').textContent = new Date(equipmentStat['First Borrow Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                document.getElementById('eqstat-first-ret').textContent = new Date(equipmentStat['First Return Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                document.getElementById('eqstat-frequency').textContent = equipmentStat['Frequency'];
                document.getElementById('eqstat-last-bor').textContent = new Date(equipmentStat['Last Borrow Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                document.getElementById('eqstat-last-ret').textContent = new Date(equipmentStat['Last Return Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                document.getElementById('eqstat-maintenance-type').textContent = equipmentStat['Maintenance Type'];
                document.getElementById('eqstat-maintenance-frequency').textContent = equipmentStat['Maintenance Frequency'];
                document.getElementById('eqstat-max').textContent = formatAsTime(equipmentStat['Max Duration']);
                document.getElementById('eqstat-median').textContent = formatAsTime(equipmentStat['Median Duration']);
                document.getElementById('eqstat-min').textContent = formatAsTime(equipmentStat['Min Duration']);
                document.getElementById('eqstat-most-freq-day').textContent = equipmentStat['Most Frequent Day'];
                document.getElementById('eqstat-most-freq-month').textContent = equipmentStat['Most Frequent Month'];                
                document.getElementById('eqstat-peak-quarter').textContent = equipmentStat['Peak Quarter'];
                document.getElementById('eqstat-qty').textContent = equipmentStat['Quantity'];                
                document.getElementById('eqstat-room').textContent = equipmentStat['Room'];
                document.getElementById('eqstat-std-dev').textContent = formatAsTime(equipmentStat['Standard Deviation Duration']);
                document.getElementById('eqstat-status').textContent = equipmentStat['Status'];
                document.getElementById('eqstat-total').textContent = formatAsTime(equipmentStat['Total Duration'].toFixed(2));
                document.getElementById('eqstat-unique-dates').textContent = equipmentStat['Unique Dates'];
                fetchEquipmentSchedule(equipmentStat['EquipmentName']);

                // Now you can use this data to populate your DataTable or other UI elements
            } else {
                console.warn('No stats found for selected inventory:', selInventory);
            }
        }
    })
    .catch(error => console.error('Error fetching equipment stats:', error));
}


$(document).ready(function() {
    updateEquipmentStats(); // Load unique IDs based on the selected equipment
    $('#inventory-select').change(updateEquipmentStats); // Attach the event handler
    
});

document.addEventListener('DOMContentLoaded', function() {

    document.querySelectorAll('[data-toggle="tooltip"]').forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    var calendarEl = document.getElementById('calendar');

    window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'listMonth', // Set the default view to listMonth
        views: {
            listMonth: {
                buttonText: 'List View'
            },
            dayGridMonth: {
                buttonText: 'Month View'
            }
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth' // Add buttons for month and list views
        },
        events: [] // Start with no events
    });

    calendar.render();
});

function redirectToCalendar(date) {
    calendar.gotoDate(date);
    calendar.currentDateStr = date; // Store the date to be highlighted
}

function fetchEquipmentSchedule(equipmentName) {
    console.log('Fetching schedule for:', equipmentName);
    fetch('static/sched.json') // Adjust URL to your JSON file location
        .then(response => response.json())
        .then(allSchedules => {
            // Filter schedules based on the equipment name, ignoring item number
            const schedules = allSchedules.filter(
                s => s.Name.toLowerCase() === equipmentName.toLowerCase()
            );

            if (schedules.length > 0) {
                console.log('Matching schedules found:', schedules);

                // Clear existing events on the calendar
                calendar.getEvents().forEach(event => event.remove());

                // Loop through each schedule and add maintenance events to the calendar
                schedules.forEach(schedule => {
                    const itemNumber = schedule["ItemNo"] ? schedule["ItemNo"] : '';

                    if (schedule.NextMaintenanceDate_MLR) {
                        calendar.addEvent({                       

                            title: `${equipmentName} ${itemNumber} ${schedule['MaintenanceType']} - MLR`,
                            start: schedule.NextMaintenanceDate_MLR
                        });
                    }

                    if (schedule.NextMaintenanceDate_KNN) {
                        calendar.addEvent({
                            title: `${equipmentName} ${itemNumber} ${schedule['MaintenanceType']} - KNN`,
                            start: schedule.NextMaintenanceDate_KNN
                        });
                    }

                    if (schedule.NextMaintenanceDate_SVR) {
                        calendar.addEvent({
                            title: `${equipmentName} ${itemNumber} ${schedule['MaintenanceType']} - SVR`,
                            start: schedule.NextMaintenanceDate_SVR
                        });
                    }
                });

                // Redirect to the first available maintenance date if needed
                redirectToCalendar(
                    schedules[0].NextMaintenanceDate_MLR ||
                    schedules[0].NextMaintenanceDate_KNN ||
                    schedules[0].NextMaintenanceDate_SVR
                );

            } else {
                console.error('No schedule found for:', equipmentName);
            }
        })
        .catch(error => console.error('Error fetching schedules:', error));
}








