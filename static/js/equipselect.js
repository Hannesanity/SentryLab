

document.getElementById("equipment-select").addEventListener("change", function() {
    var selectedEquipment = this.value;
    // Make AJAX request to Flask route with selected equipment name
    fetch('/equipment_stats/' + selectedEquipment)
      .then(response => response.json())
      .then(data => {
        // Update HTML elements with new statistics
        document.getElementById("total-quantity").textContent = data.total_quantity;
        document.getElementById("avg-duration").textContent = data.avg_duration;
      });
  });