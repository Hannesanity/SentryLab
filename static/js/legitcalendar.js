let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();
let maintenanceDates = [];
let depreciationDates = [];

const day = document.querySelector(".calendar-dates");

const currdate = document
	.querySelector(".calendar-current-date");

const prenexIcons = document
	.querySelectorAll(".calendar-navigation span");

// Array of month names
const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];

// Function to generate the calendar
function manipulate() {
    let dayone = new Date(Date.UTC(year, month, 1)).getUTCDay();
    let lastdate = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    let lit = "";
    for (let i = 1; i <= lastdate; i++) {
        let currentDate = new Date(Date.UTC(year, month, i));
        let isToday = currentDate.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10) ? 'active' : '';
        let isMaintenance = maintenanceDates.some(d => datesEqual(d, currentDate));
        let isDepreciation = depreciationDates.some(d => datesEqual(d, currentDate));
		
        let additionalClass = '';
        if (isMaintenance) additionalClass = 'maintenance-date';
        if (isDepreciation) additionalClass = 'depreciation-date';

        lit += `<li class="${isToday} ${additionalClass}">${i}</li>`;
    }
    day.innerHTML = lit;
}

function datesEqual(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
}


manipulate();

const updateActiveDate = (clickedDate) => {
    document.querySelectorAll('.calendar-dates li').forEach(date => {
        date.classList.remove('active');
    });

    clickedDate.classList.add('active');
    console.log(`Clicked date: ${clickedDate.textContent}`);
};
// Attach a click event listener to each icon
prenexIcons.forEach(icon => {
    icon.addEventListener("click", () => {
        month = icon.id === "calendar-prev" ? month - 1 : month + 1;

        if (month < 0 || month > 11) {
            date = new Date(year, month, 1);
            year = date.getFullYear();
            month = date.getMonth();
        } else {
            date = new Date();
        }

        manipulate();
    });
});


function parseDate(input) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        // Parse as UTC
        return new Date(Date.UTC(input.slice(0, 4), input.slice(5, 7) - 1, input.slice(8, 10)));
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
        const parts = input.split('/');
        // Parse as UTC
        return new Date(Date.UTC(parts[2], parts[1] - 1, parts[0]));
    }
    return null;
}

