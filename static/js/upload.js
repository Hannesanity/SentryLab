$(document).ready(function() {
    function fetchInventoryData() {
        $('#inventory-table').DataTable({
            processing: true,
            serverSide: true,
            ajax: {
                url: '/data/inventory',
                type: 'GET'
            },
            columns: [
                { data: 'UniqueID' },
                { data: 'Name' },
                { data: 'Room' },
                { data: 'ItemNo' },
                { data: 'SerialNo' },
                { data: 'Brand' },
                {
                    data: null,
                    className: "dt-center",
                    render: function(data, type, row) {
                        return '<button class="btn btn-primary update-btn">Update</button> <button class="btn btn-danger delete-btn">Delete</button>';
                    },
                    orderable: false
                }
            ],
            destroy: true  // Reinitialize the table
        });
    }

    function fetchBorrowerData() {
        $('#borrower-table').DataTable({
            processing: true,
            serverSide: true,
            ajax: {
                url: '/data/borrower',
                type: 'GET'
            },
            columns: [
                { data: 'BorrowerSlipID' },
                { data: 'UniqueID' },
                { data: 'EquipmentName' },
                { data: 'DateTimeBorrowed' },
                { data: 'DateTimeReturned' },
                { data: 'TotalDuration' },
                {
                    data: null,
                    className: "dt-center",
                    render: function(data, type, row) {
                        return '<button class="btn btn-primary update-btn">Update</button> <button class="btn btn-danger delete-btn">Delete</button>';
                    },
                    orderable: false
                }
            ],
            destroy: true  // Reinitialize the table
        });
    }
    
    function fetchCalibrationData() {
        $('#calibration-table').DataTable({
            processing: true,
            serverSide: true,
            ajax: {
                url: '/data/calibration',
                type: 'GET'
            },
            columns: [
                { data: 'CalibrationID' },
                { data: 'UniqueID' },
                { data: 'TypeOfService' },
                { data: 'Description' },
                { data: 'Manufacturer' },
                { data: 'ModelNo' },
                { data: 'SerialNo' },
                { data: 'ProcedureNo' },
                { data: 'AsLeft' },
                { data: 'OrderNo' },
                { data: 'CalibrationLoc' },
                { data: 'DateReceived' },
                { data: 'CalibrationDate' },
                { data: 'CalibrationDue' },
                { data: 'RelativeHumidity' },
                { data: 'AmbientTemperature' },
                {
                    data: null,
                    className: "dt-center",
                    render: function(data, type, row) {
                        return '<button class="btn btn-primary update-btn">Update</button> <button class="btn btn-danger delete-btn">Delete</button>';
                    },
                    orderable: false
                }
            ],
            destroy: true  // Reinitialize the table
        });
    }

    function populateInventorySelect(selectedUniqueID) {
        $.ajax({
            url: '/get_inventory_for_borrower',
            type: 'GET',
            success: function(response) {
                console.log('Response received:', response);
                if (response.success) {
                    var select = $('#inventorySelect');
                    console.log('Select element:', select);
                    select.empty();
                    console.log('Select emptied');
                    select.append($('<option></option>').attr('value', '').text('Select an item'));
                    console.log('Default option added');
                    $.each(response.inventory, function(i, item) {
                        var option = $('<option></option>')
                            .attr('value', item.UniqueID)
                            .attr('equip-name', item.Name)
                            .text(item.Name + ' #' +  item.ItemNo + ' ID: ' + item.UniqueID);
                        
                        // Set this option as selected if it matches the selectedUniqueID
                        if (item.UniqueID === selectedUniqueID) {
                            option.prop('selected', true);
                        }
                        
                        select.append(option);
                    });
                    console.log('All items added');
                } else {
                    console.error('Error fetching inventory:', response.error);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error fetching inventory:', errorThrown);
            }
        });
    }

    // Function to show/hide tables based on selected filter
    function showFilteredTable(filter) {
        $('.row[data-filter]').hide();
        $('.row[data-filter="' + filter + '"]').show();
    }

    $(document).on('change', '#returnedCheck', function() {
        console.log("Checkbox state changed:", this.checked);
        if ($(this).is(':checked')) {
            $('#returnedFields').show();
            $('#daterettxt').attr('required', true);
            $('#timerettxt').attr('required', true);
        } else {
            $('#returnedFields').hide();
            $('#daterettxt').attr('required', false);
            $('#timerettxt').attr('required', false);
        }
    });

    

    // Navbar click event to switch filters and set active filter
    $('.navbar-nav .nav-link').click(function() {
        var filter = $(this).attr('data-filter');
        $('.navbar-nav .nav-link').removeClass('active');
        $(this).addClass('active');
        showFilteredTable(filter);
        fetchData(filter);
    });

    // Upload button click event
    $('#uploadBtn').click(function() {
        var formData = new FormData();
        var files = $('#fileInput')[0].files;
        var activeFilter = $('.navbar-nav .nav-link.active').attr('data-filter');

        if (files.length > 0) {
            formData.append('file', files[0]);

            $.ajax({
                url: '/upload/' + activeFilter,
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                success: function(response) {
                    alert(response.success || response.error);
                    fetchData(activeFilter);
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('Error uploading file:', errorThrown);
                }
            });
        } else {
            alert('Please select a file to upload.');
        }
    });

    $('#exportBtn').click(function() {
        var activeFilter = $('.navbar-nav .nav-link.active').attr('data-filter');
        $.ajax({
            url: '/export/' + activeFilter,
            type: 'POST',
            success: function(response) {
                alert(response.success || response.error);
                fetchData(activeFilter);
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Error during export:', errorThrown);
                alert('Error during export: ' + textStatus);
            }
        });
    });

    // Initial fetch to populate the table
    function fetchData(filter) {
        if (filter === 'inventory') {
            fetchInventoryData();
        } else if (filter === 'borrower') {
            fetchBorrowerData();
        } else if (filter === 'calibration') {
            fetchCalibrationData();
        }
    }

    // Set default filter and load data
    var defaultFilter = 'borrower';
    $('.navbar-nav .nav-link[data-filter="' + defaultFilter + '"]').addClass('active');
    showFilteredTable(defaultFilter);
    fetchData(defaultFilter);

     // Click event for Add Data button
     $('#addBtn').click(function() {
        var selectedTable = $('.row[data-filter]:visible').attr('data-filter');
        var modalTitle = '';
        var formContent = '';

        if (selectedTable === 'inventory') {
            modalTitle = 'Add Inventory Data';
            formContent = `
                <div class="mb-3">
                    <label for="invnametxt" class="form-label">Equipment Name</label>
                    <input type="text" class="form-control" id="invnametxt" name="Name" required>
                </div>
                <div class="mb-3">
                    <label for="roomtxt" class="form-label">Room</label>
                    <select class="form-select" id="roomtxt" name="Room" required>
                        <option value="" disabled selected>Select a room</option>
                        <option value="ENB201">ENB201</option>
                        <option value="ENB204">ENB204</option>
                        <option value="ENB205">ENB205</option>
                        <option value="TC101">TC101</option>
                        <option value="TC102">TC102</option>
                        <option value="ER201">ER201</option>
                        <option value="Others">Others</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label for="itemnotxt" class="form-label">Item Number</label>
                    <input type="text" class="form-control" id="itemnotxt" name="ItemNo" required>
                </div>
                <div class="mb-3">
                    <label for="serialnottxt" class="form-label">Serial Number</label>
                    <input type="text" class="form-control" id="serialnottxt" name="SerialNo" required>
                </div>
                <div class="mb-3">
                    <label for="brandtxt" class="form-label">Brand</label>
                    <input type="text" class="form-control" id="brandtxt" name="Brand" required>
                </div>
                <input type="hidden" id="uniqueidtxt" name="UniqueID">
                <!-- Add other inventory fields here -->
            `;
            $('#form-content').html(formContent);
        } else if (selectedTable === 'borrower') {
            modalTitle = 'Add Borrower Data';
            formContent = `
                <div class="mb-3">
                    <label for="inventorySelect" class="form-label">Equipment</label>
                    <select class="form-control" id="inventorySelect" name="UniqueID" required>
                        <option value="">Select an item</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label for="datebortxt" class="form-label">Date Borrowed</label>
                    <input type="date" class="form-control" id="datebortxt" name="DateBorrowed" required>
                </div>
                <div class="mb-3">
                    <label for="timebortxt" class="form-label">Time Borrowed</label>
                    <input type="time" class="form-control" id="timebortxt" name="TimeBorrowed" required>
                </div>
                <div class="form-check mt-3">
                    <input class="form-check-input" type="checkbox" id="returnedCheck">
                    <label class="form-check-label" for="returnedCheck">
                        Returned
                    </label>
                </div>
                <div id="returnedFields" style="display: none;">
                    <div class="mb-3">
                        <label for="daterettxt" class="form-label">Date Returned</label>
                        <input type="date" class="form-control" id="daterettxt" name="DateReturned">
                    </div>
                    <div class="mb-3">
                        <label for="timerettxt" class="form-label">Time Returned</label>
                        <input type="time" class="form-control" id="timerettxt" name="TimeReturned">
                    </div>
                </div>
                <!-- Add other borrower fields here -->
            `;
            $('#form-content').html(formContent);
            //Get the current day
            document.getElementById("datebortxt").valueAsDate = new Date();
            document.getElementById("daterettxt").valueAsDate = new Date();

            // Get the current time
            var currentDate = new Date();
            var currentTime = currentDate.toTimeString().slice(0, 5);
            $('#timebortxt').val(currentTime);
            $('#timerettxt').val(currentTime);

            populateInventorySelect();
        } else if (selectedTable === 'calibration') {
            modalTitle = 'Add Calibration Data';
            formContent = `
                <div class="mb-3">
                    <label for="uniqueidtxt" class="form-label">Unique ID</label>
                    <input type="text" class="form-control" id="uniqueidtxt" name="UniqueID" required>
                </div>
                <div class="mb-3">
                    <label for="typeservicetxt" class="form-label">Type of Service</label>
                    <input type="text" class="form-control" id="typeservicetxt" name="TypeOfService" required>
                </div>
                <div class="mb-3">
                    <label for="descriptiontxt" class="form-label">Description</label>
                    <input type="text" class="form-control" id="descriptiontxt" name="Description" required>
                </div>
                <div class="mb-3">
                    <label for="manufacturerstxt" class="form-label">Manufacturer</label>
                    <input type="text" class="form-control" id="manufacturerstxt" name="Manufacturer" required>
                </div>
                <div class="mb-3">
                    <label for="modelnotxt" class="form-label">Model No.</label>
                    <input type="text" class="form-control" id="modelnotxt" name="ModelNo" required>
                </div>
                <div class="mb-3">
                    <label for="serialnotxt" class="form-label">Serial No.</label>
                    <input type="text" class="form-control" id="serialnotxt" name="SerialNo" required>
                </div>
                <div class="mb-3">
                    <label for="procedurenotxt" class="form-label">Procedure No.</label>
                    <input type="text" class="form-control" id="procedurenotxt" name="ProcedureNo" required>
                </div>
                <div class="mb-3">
                    <label for="aslefttxt" class="form-label">As Left</label>
                    <input type="text" class="form-control" id="aslefttxt" name="AsLeft" required>
                </div>
                <div class="mb-3">
                    <label for="ordernotxt" class="form-label">Order No.</label>
                    <input type="text" class="form-control" id="ordernotxt" name="OrderNo" required>
                </div>
                <div class="mb-3">
                    <label for="calibrationloctxt" class="form-label">Calibration Location</label>
                    <input type="text" class="form-control" id="calibrationloctxt" name="CalibrationLoc" required>
                </div>
                <div class="mb-3">
                    <label for="datereceivedtxt" class="form-label">Date Received</label>
                    <input type="date" class="form-control" id="datereceivedtxt" name="DateReceived" required>
                </div>
                <div class="mb-3">
                    <label for="calibrationdatetxt" class="form-label">Calibration Date</label>
                    <input type="date" class="form-control" id="calibrationdatetxt" name="CalibrationDate" required>
                </div>
                <div class="mb-3">
                    <label for="calibrationduetxt" class="form-label">Calibration Due</label>
                    <input type="date" class="form-control" id="calibrationduetxt" name="CalibrationDue" required>
                </div>
                <div class="mb-3">
                    <label for="relativehumiditytxt" class="form-label">Relative Humidity</label>
                    <input type="text" class="form-control" id="relativehumiditytxt" name="RelativeHumidity" required>
                </div>
                <div class="mb-3">
                    <label for="ambienttemperaturetxt" class="form-label">Ambient Temperature</label>
                    <input type="text" class="form-control" id="ambienttemperaturetxt" name="AmbientTemperature" required>
                </div>
                <!-- Add other calibration fields here -->
            `;
            $('#form-content').html(formContent);     

            document.getElementById("calibrationdatetxt").valueAsDate = new Date();
            document.getElementById("calibrationduetxt").valueAsDate = new Date();
            document.getElementById("datereceivedtxt").valueAsDate = new Date();
        } else {
            console.error("No matching selected table");
        }
        $('#addDataModal .modal-title').text(modalTitle);
        $('#addDataModal').modal('show');

        $('#returnedCheck').change(function() {
            if (this.checked) {
                $('#returnedFields').show();
            } else {
                $('#returnedFields').hide();
            }
        });
    });

    $('#saveDataBtn').on('click', function() {
        var selectedTable = $('.row[data-filter]:visible').attr('data-filter');
        var data = {};

        switch(selectedTable) {
            case 'inventory':
                data = {
                    Name: $('#invnametxt').val(),
                    Room: $("#roomtxt option:selected").text(),
                    ItemNo: $('#itemnotxt').val(),
                    SerialNo: $('#serialnottxt').val(),
                    Brand: $('#brandtxt').val(),
                    UniqueID: $('#uniqueidtxt').val()
                };
                console.log(data.Room)
                break;

            case 'borrower':
                var dateBorrowed = $('#datebortxt').val();
                var timeBorrowed = $('#timebortxt').val();
                var isReturned = $('#returnedCheck').is(':checked');
                
                data = {
                    UniqueID: $('#inventorySelect').val(),
                    EquipmentName: $('#inventorySelect option:selected').attr('equip-name'),
                    DateBorrowed: dateBorrowed,
                    TimeBorrowed: timeBorrowed,
                    DateTimeBorrowed: dateBorrowed + ' ' + timeBorrowed,
                    isReturned: isReturned ? 1 : 0
                };
            
                if (isReturned) {
                    var dateReturned = $('#daterettxt').val();
                    var timeReturned = $('#timerettxt').val();
                    data.DateReturned = dateReturned;
                    data.TimeReturned = timeReturned;
                    data.DateTimeReturned = dateReturned + ' ' + timeReturned;
                    
                    // Calculate total duration
                    var borrowedTimestamp = new Date(data.DateTimeBorrowed);
                    var returnedTimestamp = new Date(data.DateTimeReturned);
                    var durationMillis = returnedTimestamp - borrowedTimestamp;
                    var days = Math.floor(durationMillis / (1000 * 60 * 60 * 24));
                    var hours = Math.floor((durationMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    var minutes = Math.floor((durationMillis % (1000 * 60 * 60)) / (1000 * 60));
                    var seconds = Math.floor((durationMillis % (1000 * 60)) / 1000);
                    
                    data.DaysDuration = days;
                    data.TimeDuration = hours.toString().padStart(2, '0') + ':' + 
                                        minutes.toString().padStart(2, '0') + ':' + 
                                        seconds.toString().padStart(2, '0');
                    data.TotalDuration = (days > 0 ? days + ' days, ' : '') + 
                                            hours.toString().padStart(2, '0') + ':' + 
                                            minutes.toString().padStart(2, '0') + ':' + 
                                            seconds.toString().padStart(2, '0');
                } else {
                    data.DateReturned = null;
                    data.TimeReturned = null;
                    data.DateTimeReturned = null;
                    data.DaysDuration = null;
                    data.TimeDuration = null;
                    data.TotalDuration = null;
                }
            break;

            case 'calibration':
                data = {
                    UniqueID: $('#uniqueidtxt').val(),
                    TypeOfService: $('#typeservicetxt').val(),
                    Description: $('#descriptiontxt').val(),
                    Manufacturer: $('#manufacturerstxt').val(),
                    ModelNo: $('#modelnotxt').val(),
                    SerialNo: $('#serialnotxt').val(),
                    ProcedureNo: $('#procedurenotxt').val(),
                    AsLeft: $('#aslefttxt').val(),
                    OrderNo: $('#ordernotxt').val(),
                    CalibrationLoc: $('#calibrationloctxt').val(),
                    DateReceived: $('#datereceivedtxt').val(),
                    CalibrationDate: $('#calibrationdatetxt').val(),
                    CalibrationDue: $('#calibrationduetxt').val(),
                    RelativeHumidity: $('#relativehumiditytxt').val(),
                    AmbientTemperature: $('#ambienttemperaturetxt').val()
                };
                break;

            default:
                console.error("No matching selected table");
                return;
        }

        // Send AJAX request
        $.ajax({
            url: '/add/' + selectedTable,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                if (response.success) {
                    console.log(data)
                    alert(selectedTable + ' data added successfully!');
                    clearForm(selectedTable);
                    if (typeof window['fetch' + capitalize(selectedTable) + 'Data'] === 'function') {
                        window['fetch' + capitalize(selectedTable) + 'Data']();
                    }
                } else {
                    alert('Error: ' + response.error);
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                alert('Error adding ' + selectedTable + ' data: ' + errorThrown);
            }
        });
    });

    function clearForm(formType) {
        switch(formType) {
            case 'inventory':
                $('#invnametxt, #roomtxt, #itemnotxt, #serialnottxt, #brandtxt, #uniqueidtxt').val('');
                break;
            case 'borrower':
                $('#equipnametxt, #datebortxt, #timebortxt, #daterettxt, #timerettxt').val('');
                $('#returnedCheck').prop('checked', false);
                $('#returnedFields').hide();
                break;
            case 'calibration':
                $('#uniqueidtxt, #typeservicetxt, #descriptiontxt, #manufacturerstxt, #modelnotxt, #serialnotxt, #procedurenotxt, #aslefttxt, #ordernotxt, #calibrationloctxt, #datereceivedtxt, #calibrationdatetxt, #calibrationduetxt, #relativehumiditytxt, #ambienttemperaturetxt').val('');
                break;
        }
    }

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Function to populate inventory update modal
    function populateInventoryUpdateModal(data, updateUrl) {
        var formContent = `
            <div class="mb-3">
                <label for="invnametxt" class="form-label">Equipment Name</label>
                <input type="text" class="form-control" id="invnametxt" name="Name" value="${data.Name || ''}" required>
            </div>
            <div class="mb-3">
                <label for="roomtxt" class="form-label">Room</label>
                <select class="form-select" id="roomtxt" name="Room" required>
                    <option value="" disabled>Select a room</option>
                    <option value="ENB201" ${data.Room === 'ENB201' ? 'selected' : ''}>ENB201</option>
                    <option value="ENB204" ${data.Room === 'ENB204' ? 'selected' : ''}>ENB204</option>
                    <option value="ENB205" ${data.Room === 'ENB205' ? 'selected' : ''}>ENB205</option>
                    <option value="TC101" ${data.Room === 'TC101' ? 'selected' : ''}>TC101</option>
                    <option value="TC102" ${data.Room === 'TC102' ? 'selected' : ''}>TC102</option>
                    <option value="ER201" ${data.Room === 'ER201' ? 'selected' : ''}>ER201</option>
                    <option value="Others" ${data.Room === 'Others' ? 'selected' : ''}>Others</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="itemnotxt" class="form-label">Item Number</label>
                <input type="text" class="form-control" id="itemnotxt" name="ItemNo" value="${data.ItemNo || ''}" required>
            </div>
            <div class="mb-3">
                <label for="serialnottxt" class="form-label">Serial Number</label>
                <input type="text" class="form-control" id="serialnottxt" name="SerialNo" value="${data.SerialNo || ''}" required>
            </div>
            <div class="mb-3">
                <label for="brandtxt" class="form-label">Brand</label>
                <input type="text" class="form-control" id="brandtxt" name="Brand" value="${data.Brand || ''}" required>
            </div>
            <input type="hidden" id="uniqueidtxt" name="UniqueID" value="${data.UniqueID}">
        `;
        $('#updateDataForm').html(formContent);
        $('#updateDataModal').data('update-url', updateUrl);  // Store update URL
        $('#updateDataModal').modal('show');
    }

    function populateBorrowerUpdateModal(data, updateUrl) {
        // Ensure data values are in correct format or default to an empty string if undefined
        var dateBorrowed = data.DateBorrowed ? new Date(data.DateBorrowed).toISOString().split('T')[0] : '';
        var timeBorrowed = data.TimeBorrowed ? data.TimeBorrowed.slice(0, 5) : '';
        var dateReturned = data.DateReturned ? new Date(data.DateReturned).toISOString().split('T')[0] : '';
        var timeReturned = data.TimeReturned ? data.TimeReturned.slice(0, 5) : '';        
    
        // Create form content
        var formContent = `
            <input type="hidden" id="borroweridtxt" name="BorrowerID">
            <div class="mb-3">
                <label for="inventorySelect" class="form-label">Equipment</label>
                <select class="form-control" id="inventorySelect" name="UniqueID" required>
                    <option value="">Select an item</option>
                </select>
            </div>
            <div class="mb-3">
                <label for="datebortxt" class="form-label">Date Borrowed</label>
                <input type="date" class="form-control" id="datebortxt" name="DateBorrowed" value="${dateBorrowed}" required>
            </div>
            <div class="mb-3">
                <label for="timebortxt" class="form-label">Time Borrowed</label>
                <input type="time" class="form-control" id="timebortxt" name="TimeBorrowed" value="${timeBorrowed}" required>
            </div>
            <div class="form-check mt-3">
                <input class="form-check-input" type="checkbox" id="returnedCheck" ${data.DateReturned ? 'checked' : ''}>
                <label class="form-check-label" for="returnedCheck">Returned</label>
            </div>
            <div id="returnedFields" style="display: ${data.DateReturned ? 'block' : 'none'};">
                <div class="mb-3">
                    <label for="daterettxt" class="form-label">Date Returned</label>
                    <input type="date" class="form-control" id="daterettxt" name="DateReturned" value="${dateReturned}">
                </div>
                <div class="mb-3">
                    <label for="timerettxt" class="form-label">Time Returned</label>
                    <input type="time" class="form-control" id="timerettxt" name="TimeReturned" value="${timeReturned}">
                </div>
            </div>
        `;
    
        // Update the form content
        $('#updateDataForm').html(formContent);
        $('#updateDataModal').data('update-url', updateUrl);  // Store update URL
        $('#updateDataModal').modal('show');
        $('#borroweridtxt').val(data.BorrowerSlipID);
        populateInventorySelect(data.UniqueID);
    
        // Toggle the returned fields visibility based on the checkbox state
        $('#returnedCheck').change(function() {
            $('#returnedFields').toggle(this.checked);
        });
    }

    // Function to populate calibration update modal
    function populateCalibrationUpdateModal(data, updateUrl) {
        console.log(data)
        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return isNaN(date) ? '' : date.toISOString().split('T')[0];
        }
        var formContent = `
            <input type="hidden" id="calibidtxt" name="CalibrationID">
            <div class="mb-3">
                <label for="uniqueidtxt" class="form-label">Unique ID</label>
                <input type="text" class="form-control" id="uniqueidtxt" name="UniqueID" value="${data.UniqueID || ''}" required>
            </div>
            <div class="mb-3">
                <label for="typeservicetxt" class="form-label">Type of Service</label>
                <input type="text" class="form-control" id="typeservicetxt" name="TypeOfService" value="${data.TypeOfService || ''}" required>
            </div>
            <div class="mb-3">
                <label for="descriptiontxt" class="form-label">Description</label>
                <input type="text" class="form-control" id="descriptiontxt" name="Description" value="${data.Description || ''}" required>
            </div>
            <div class="mb-3">
                <label for="manufacturerstxt" class="form-label">Manufacturer</label>
                <input type="text" class="form-control" id="manufacturerstxt" name="Manufacturer" value="${data.Manufacturer || ''}" required>
            </div>
            <div class="mb-3">
                <label for="modelnotxt" class="form-label">Model No.</label>
                <input type="text" class="form-control" id="modelnotxt" name="ModelNo" value="${data.ModelNo || ''}" required>
            </div>
            <div class="mb-3">
                <label for="serialnotxt" class="form-label">Serial No.</label>
                <input type="text" class="form-control" id="serialnotxt" name="SerialNo" value="${data.SerialNo || ''}" required>
            </div>
            <div class="mb-3">
                <label for="procedurenotxt" class="form-label">Procedure No.</label>
                <input type="text" class="form-control" id="procedurenotxt" name="ProcedureNo" value="${data.ProcedureNo || ''}" required>
            </div>
            <div class="mb-3">
                <label for="aslefttxt" class="form-label">As Left</label>
                <input type="text" class="form-control" id="aslefttxt" name="AsLeft" value="${data.AsLeft || ''}" required>
            </div>
            <div class="mb-3">
                <label for="ordernotxt" class="form-label">Order No.</label>
                <input type="text" class="form-control" id="ordernotxt" name="OrderNo" value="${data.OrderNo || ''}" required>
            </div>
            <div class="mb-3">
                <label for="calibrationloctxt" class="form-label">Calibration Location</label>
                <input type="text" class="form-control" id="calibrationloctxt" name="CalibrationLoc" value="${data.CalibrationLoc || ''}" required>
            </div>
            <div class="mb-3">
                <label for="datereceivedtxt" class="form-label">Date Received</label>
                <input type="date" class="form-control" id="datereceivedtxt" name="DateReceived" value="${formatDate(data.DateReceived)}" required>
            </div>
            <div class="mb-3">
                <label for="calibrationdatetxt" class="form-label">Calibration Date</label>
                <input type="date" class="form-control" id="calibrationdatetxt" name="CalibrationDate" value="${formatDate(data.CalibrationDate)}" required>
            </div>
            <div class="mb-3">
                <label for="nextcalibrationtxt" class="form-label">Next Calibration</label>
                <input type="date" class="form-control" id="nextcalibrationtxt" name="NextCalibration" value="${formatDate(data.NextCalibration)}" required>
            </div>
        `;
        
        $('#updateDataForm').html(formContent);
        $('#updateDataModal').data('update-url', updateUrl);  // Store update URL
        $('#updateDataModal').modal('show');
        $('#calibidtxt').val(data.CalibrationID);
        console.log($('#calibidtxt').val())
    }


    // Add event listeners for update and delete buttons
    addEventListeners('#inventory-table', '/update/inventory', populateInventoryUpdateModal);
    addEventListeners('#borrower-table', '/update/borrower', populateBorrowerUpdateModal);
    addEventListeners('#calibration-table', '/update/calibration', populateCalibrationUpdateModal);

    
    

    function addEventListeners(tableId, updateUrl, populateModalFunction) {
        $(document).on('click', tableId + ' .update-btn', function() {
            var rowData = $(tableId).DataTable().row($(this).parents('tr')).data();
            populateModalFunction(rowData, updateUrl);
        });

        $(document).on('click', tableId + ' .delete-btn', function() {
            var row = $(this).closest('tr');
            var table = $(tableId).DataTable();
            var rowData = table.row(row).data();
            var dataType = $('.navbar-nav .nav-link.active').attr('data-filter');
        
            if (confirm('Are you sure you want to delete this record?')) {
                $.ajax({
                    url: '/delete/' + dataType,  // This now matches your new Flask route
                    method: 'DELETE',
                    data: JSON.stringify(rowData),
                    contentType: 'application/json',
                    success: function(response) {
                        console.log('Response:', response);  // Log the response
                        if (response.success) {
                            alert('Data deleted successfully!');
                            table.row(row).remove().draw();
                        } else {
                            alert('Error: ' + response.error);
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.error('Error deleting data:', errorThrown);  // Log error
                        alert('Error deleting data: ' + errorThrown);
                    }
                });
                
            }
        });

        $(document).off('click', '#saveUpdatedDataBtn').on('click', '#saveUpdatedDataBtn', function() {
            console.log("Save button clicked");
            var dataType = $('.navbar-nav .nav-link.active').attr('data-filter');
            console.log("Data type:", dataType);
        
            var data = {};
        
            switch(dataType) {
                case 'inventory':
                    data = {
                        UniqueID: $('#uniqueidtxt').val(), 
                        Name: $('#invnametxt').val(),
                        Room: $("#roomtxt option:selected").text(),
                        ItemNo: $('#itemnotxt').val(),
                        SerialNo: $('#serialnottxt').val(),
                        Brand: $('#brandtxt').val()
                    };
                    break;
        
                case 'borrower':
                    var isReturned = $('#returnedCheck').is(':checked');
                    data = {
                        BorrowerSlipID: $('#borroweridtxt').val(),  
                        UniqueID: $('#inventorySelect').val(),
                        EquipmentName: $('#inventorySelect option:selected').text(),
                        DateBorrowed: $('#datebortxt').val(),
                        TimeBorrowed: $('#timebortxt').val(),
                        DateTimeBorrowed: $('#datebortxt').val() + ' ' + $('#timebortxt').val(),
                        isReturned: isReturned ? 1 : 0
                    };
                    if (isReturned) {
                        var dateReturned = $('#daterettxt').val();
                        var timeReturned = $('#timerettxt').val();
                        data.DateReturned = dateReturned;
                        data.TimeReturned = timeReturned;
                        data.DateTimeReturned = dateReturned + ' ' + timeReturned;
                        
                        // Calculate total duration
                        var borrowedTimestamp = new Date(data.DateTimeBorrowed);
                        var returnedTimestamp = new Date(data.DateTimeReturned);
                        var durationMillis = returnedTimestamp - borrowedTimestamp;
                        var days = Math.floor(durationMillis / (1000 * 60 * 60 * 24));
                        var hours = Math.floor((durationMillis % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        var minutes = Math.floor((durationMillis % (1000 * 60 * 60)) / (1000 * 60));
                        var seconds = Math.floor((durationMillis % (1000 * 60)) / 1000);
                        
                        data.DaysDuration = days;
                        data.TimeDuration = hours.toString().padStart(2, '0') + ':' + 
                                            minutes.toString().padStart(2, '0') + ':' + 
                                            seconds.toString().padStart(2, '0');
                        data.TotalDuration = (days > 0 ? days + ' days, ' : '') + 
                                                hours.toString().padStart(2, '0') + ':' + 
                                                minutes.toString().padStart(2, '0') + ':' + 
                                                seconds.toString().padStart(2, '0');
                    }
                    break;
        
                case 'calibration':
                    data = {
                        CalibrationID: $('#calibidtxt').val(),  
                        UniqueID: $('#uniqueidtxt').val(),
                        TypeOfService: $('#typeservicetxt').val(),
                        Description: $('#descriptiontxt').val(),
                        Manufacturer: $('#manufacturerstxt').val(),
                        ModelNo: $('#modelnotxt').val(),
                        SerialNo: $('#serialnotxt').val(),
                        ProcedureNo: $('#procedurenotxt').val(),
                        AsLeft: $('#aslefttxt').val(),
                        OrderNo: $('#ordernotxt').val(),
                        CalibrationLoc: $('#calibrationloctxt').val(),
                        DateReceived: $('#datereceivedtxt').val(),
                        CalibrationDate: $('#calibrationdatetxt').val(),
                        CalibrationDue: $('#calibrationduetxt').val(),
                        RelativeHumidity: $('#relativehumiditytxt').val(),
                        AmbientTemperature: $('#ambienttemperaturetxt').val()
                    };
                    break;
        
                default:
                    console.error("No matching selected table");
                    return;
            }
        
            console.log("Data to be sent:", data);
        
            $.ajax({
                url: '/update/' + dataType,
                method: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                success: function(response) {
                    console.log('Response:', response);
                    if (response.success) {
                        alert('Data updated successfully!');
                        // Refresh the table or update the specific row
                    } else {
                        alert('Error: ' + response.error);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('Error updating data:', errorThrown);
                    console.error('Status:', textStatus);
                    console.error('Response:', jqXHR.responseText);
                    alert('Error updating data: ' + errorThrown);
                }
            });
        });
    }

    // Function to format time and total duration columns in the table
    function formatDuration(duration) {
        var hours = Math.floor(duration);
        var minutes = Math.round((duration - hours) * 60);
        return hours + 'h ' + minutes + 'm';
    }

    // Custom render function for time and total duration columns
    $.fn.dataTable.render.duration = function() {
        return function(data, type, row) {
            if (type === 'display' || type === 'filter') {
                return formatDuration(data);
            }
            return data;
        };
    };
       
});
