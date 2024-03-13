var barChart = document.getElementById('barChart').getContext('2d');

var myBarChart = new Chart(barChart, {
	type: 'bar',
	data: {
		labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		datasets : [{
			label: "Sales",
			backgroundColor: 'rgb(23, 125, 255)',
			borderColor: 'rgb(23, 125, 255)',
			data: [3, 2, 9, 5, 4, 6, 4, 6, 7, 8, 7, 4],
		}],
	},
	options: {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			yAxes: [{
				ticks: {
					beginAtZero:true
				}
			}]
		},
	}
}); 