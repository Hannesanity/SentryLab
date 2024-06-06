$(document).ready(function() {
    $('#updateButton').click(function() {
      $('#statusMessage').text('Processing statistics, please wait!');
      $('#progressBar').css('width', '0%').attr('aria-valuenow', 0);
      $('#progressLabel').text('0%');
      $('.progress-container').show();
  
      $.ajax({
        url: '/process_data',
        type: 'POST',
        xhr: function() {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener("progress", function(evt) {
            if (evt.lengthComputable) {
              var percentComplete = evt.loaded / evt.total;
              percentComplete = parseInt(percentComplete * 100);
              $('#progressBar').css('width', percentComplete + '%').attr('aria-valuenow', percentComplete);
              $('#progressLabel').text(percentComplete + '%');
            }
          }, false);
          return xhr;
        },
        success: function(response) {
          $('#statusMessage').text('Process done!');
          $('#progressBar').css('width', '100%').attr('aria-valuenow', 100);
          $('#progressLabel').text('100%');
  
          setTimeout(function() {
            $('#statusMessage').text('Processing done! Restarting...');
            setTimeout(function() {
              location.reload();
            }, 10000); // Wait for 10 seconds before reloading
          }, 2000); // Wait for 2 seconds after process is complete
        },
        error: function() {
          $('#statusMessage').text('Error processing data. Please Refresh');
        }
      });
    });
  
    $('#trainButton').click(function() {
      $('#statusMessage').text('Training in progress, please wait.');
      $('#progressBar').css('width', '0%').attr('aria-valuenow', 0);
      $('#progressLabel').text('0%');
      $('.progress-container').show();
  
      $.ajax({
        url: '/train_data',
        type: 'POST',
        xhr: function() {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener("progress", function(evt) {
            if (evt.lengthComputable) {
              var percentComplete = evt.loaded / evt.total;
              percentComplete = parseInt(percentComplete * 100);
              $('#progressBar').css('width', percentComplete + '%').attr('aria-valuenow', percentComplete);
              $('#progressLabel').text(percentComplete + '%');
            }
          }, false);
          return xhr;
        },
        success: function(response) {
          $('#statusMessage').text('Training complete!');
          $('#progressBar').css('width', '100%').attr('aria-valuenow', 100);
          $('#progressLabel').text('100%');
  
          setTimeout(function() {
            $('#statusMessage').text('Processing done! Restarting...');
            setTimeout(function() {
              location.reload();
            }, 10000); // Wait for 10 seconds before reloading
          }, 10000); // Wait for 2 seconds after process is complete
        },
        error: function() {
          $('#statusMessage').text('Error training data. Please refresh');
        }
      });
    });
  });
  