function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
  document.querySelector(".overlay-content").style.display = "block";
  document.querySelector(".sidenav-open-button").style.display = "none";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.getElementById("main").style.marginLeft= "0";
  document.querySelector(".overlay-content").style.display = "none";
  document.querySelector(".sidenav-open-button").style.display = "block";
}