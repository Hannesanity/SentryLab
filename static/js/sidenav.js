document.addEventListener("DOMContentLoaded", function () {
  const sidenav = document.getElementById("mySidenav");
  const mainContent = document.getElementById("main");
  const openButton = document.querySelector(".sidenav-open-button");
  const closeButton = document.querySelector(".closebtn");

  function openNav() {
    if (sidenav && mainContent) {
      sidenav.style.width = "250px";
      mainContent.style.marginLeft = "250px";
      mainContent.style.width = "calc(100% - 250px)";
      mainContent.style.flex = "1";
      if (openButton) openButton.style.display = "none";
    } 

    else {
      console.error("Sidebar or Main Content not found.");
    }
  }

  function closeNav() {
    if (sidenav && mainContent) {
      sidenav.style.width = "0";
      mainContent.style.marginLeft = "0";
      mainContent.style.width = "100%";
      if (openButton) openButton.style.display = "block";
    } else {
      console.error("Sidebar or Main Content not found.");
    }
  }

  window.openNav = openNav;
  window.closeNav = closeNav;

  if (openButton) {
    openButton.addEventListener("click", openNav);
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeNav);
  }
});
