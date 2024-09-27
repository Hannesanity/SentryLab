var overallStats;
Chart.defaults.global.defaultFontColor = '#FFFFFF';
Chart.defaults.global.defaultFontSize = 12;
Chart.defaults.global.defaultFontFamily = 'Arial, sans-serif';
let allRoomData = []; 
var calendar;


// Canvas
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
                    
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    
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

// Fetch overall data and create pie charts based on filter
fetch('static/overall_stats.json')
    .then(response => response.json())
    .then(overallData => {
        overallStats = overallData;
        console.log('Room statistics data:', overallStats);

        const navbarItems = document.getElementById('navbarItems');
        overallStats.forEach((room, index) => {
            console.log(`Room ${index + 1}: ${room.Room}`);
            const isActive = room.Room === 'Overall' ? 'active' : '';
            const listItem = document.createElement('li');
            listItem.className = `nav-item ${isActive}`;
            listItem.innerHTML = `<a class="nav-link" href="#">${room.Room}</a>`;
            navbarItems.appendChild(listItem);
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                const roomId = this.textContent.trim();
                updateRoomStats(overallStats, roomId);
                updateRoomBorrowedChart(roomId, allRoomData);
            });
        });

        updateRoomStats(overallStats, 'Overall');

        setTimeout(() => {
           
        }, 5000);

        setTimeout(() => {
            const quarter1Chart = createQuarterPieChart(octxQ1, overallStats.map(item => item['Q1 Count']), 'Q1');
            const quarter2Chart = createQuarterPieChart(octxQ2, overallStats.map(item => item['Q2 Count']), 'Q2');
            const quarter3Chart = createQuarterPieChart(octxQ3, overallStats.map(item => item['Q3 Count']), 'Q3');
            const quarter4Chart = createQuarterPieChart(octxQ4, overallStats.map(item => item['Q4 Count']), 'Q4');
        }, 5000); 
    })
    .catch(error => console.error('Error fetching room statistics data:', error));


function convertTimestampsToDateLabels(timestamps) {
    return timestamps.map(timestamp => new Date(timestamp).toLocaleDateString('en-US'));
}

// Charts
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
    

// Fetch room data and create line charts
fetch('static/room_stats.json')
    .then(response => response.json())
    .then(roomData => {
        console.log('Room statistics data:', roomData);
        roomData.sort((a, b) => a['DateTimeBorrowed'] - b['DateTimeBorrowed']);

        allRoomData = roomData; 

        updateRoomBorrowedChart('Overall', allRoomData);
              
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


// Function for updating charts
function updateRoomBorrowedChart(roomId, roomData) {
    console.log(`Updating charts for Room ID: ${roomId}`, roomData);

    let filteredData;
    if (roomId === 'Overall') {
        filteredData = roomData; 
        console.log('Overall selected. Displaying data for all rooms.', filteredData);
    } else {
        filteredData = roomData.filter(item => item.Room === roomId);
        console.log(`Room ${roomId} selected. Displaying data for this room:`, filteredData);
    }

    if (!filteredData || filteredData.length === 0) {
        console.warn(`No data available for Room ID: ${roomId}`);
        return;
    }

    const labels = filteredData.map(item => new Date(item['DateTimeBorrowed']).toLocaleDateString('en-US'));
    const frequencyData = filteredData.map(item => item['Frequency']);
    const durationData = filteredData.map(item => item['Duration Sum']);
    const averageDurationData = filteredData.map(item => item['Average Duration Per Use']);

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

// Function for update room statistics
function updateRoomStats(overallStats, roomId) {
    $.getJSON('/static/rooms.json', function (rooms) {
        const roomDetails = rooms.reduce((acc, room) => {
            acc[room.RoomNumber] = { name: room.RoomName, number: room.RoomNumber };
            return acc;
        }, {});
        
        roomId = roomId.replace(/([A-Z]+)(\d+)/, '$1 $2').trim();

        const filteredStats = overallStats.filter(stat => stat.Room === roomId);

        const roomInfo = roomDetails[roomId] || { name: "Others", number: "N/A" };

        document.getElementById('room-name').textContent = roomInfo.name;
        document.getElementById('room-number').textContent = roomInfo.number;
    
        if (filteredStats.length > 0) {
            filteredStats.forEach((stat, index) => {
                document.getElementById('total-equipments').textContent = stat['Equipment Count'];
                document.getElementById('frequency').textContent = stat['Frequency'];
                document.getElementById('total-duration').textContent = formatAsTime(stat['Total Duration']);
                document.getElementById('average-duration').textContent = formatAsTime(stat['Average Duration']);
                document.getElementById('max-duration').textContent = formatAsTime(stat['Max Duration']);
                document.getElementById('median-duration').textContent = formatAsTime(stat['Median Duration']);
                document.getElementById('min-duration').textContent = formatAsTime(stat['Min Duration']);
                document.getElementById('standard-deviation').textContent = stat['Standard Deviation Duration'].toFixed(2);
                document.getElementById('unique-dates').textContent = stat['Unique Dates'];
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

// Function for populating inventory
function populateInventorySelect(eqStats) {
    const inventorySelect = $('#inventory-select');
    inventorySelect.empty(); 

    eqStats.forEach(stat => {
        inventorySelect.append(new Option(stat["EquipmentName"], stat["EquipmentName"]));
    });

    inventorySelect.change();
}

// Function for updating equipment stats
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
            populateInventorySelect(eqStats);
        } else {
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
            } else {
                console.warn('No stats found for selected inventory:', selInventory);
            }
        }
    })
    .catch(error => console.error('Error fetching equipment stats:', error));
}

// Function when the page loads
$(document).ready(function() {
    updateEquipmentStats(); 
    $('#inventory-select').change(updateEquipmentStats);
    
});

// Function for initializing the calendar along with calendar functions
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-toggle="tooltip"]').forEach(tooltipTriggerEl => {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    var calendarEl = document.getElementById('calendar');

    window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'listMonth', 
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
            right: 'dayGridMonth,listMonth' 
        },
        events: [] 
    });

    calendar.render();
});

// Function to redirect to the calendar view
function redirectToCalendar(date) {
    calendar.gotoDate(date);
    calendar.currentDateStr = date; 
}


// Function to fetch equipment schedule
function fetchEquipmentSchedule(equipmentName) {
    console.log('Fetching schedule for:', equipmentName);
    fetch('static/sched.json') 
        .then(response => response.json())
        .then(allSchedules => {
            const schedules = allSchedules.filter(
                s => s.Name.toLowerCase() === equipmentName.toLowerCase()
            );

            if (schedules.length > 0) {
                console.log('Matching schedules found:', schedules);
                calendar.getEvents().forEach(event => event.remove());
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








