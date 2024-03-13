var pieChart = document.getElementById('pieChart').getContext('2d');

var myPieChart = new Chart(pieChart, {
	type: 'pie',
	data: {
		datasets: [{
			data: [50, 35, 15],
			backgroundColor :["#1d7af3","#f3545d","#fdaf4b"],
			borderWidth: 0
		}],
		labels: ['New Visitors', 'Subscribers', 'Active Users']
	},
	options : {
		responsive: true,
		maintainAspectRatio: false,
		legend: {
			position : 'bottom',
			labels : {
				fontColor: 'rgb(154, 154, 154)',
				fontSize: 11,
				usePointStyle : true,
				padding: 20
			}
		},
		pieceLabel: {
			render: 'percentage',
			fontColor: 'white',
			fontSize: 14,
		},
		tooltips: false,
		layout: {
			padding: {
				left: 20,
				right: 20,
				top: 20,
				bottom: 20
			}
		}
	}
})