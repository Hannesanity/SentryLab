document.addEventListener("DOMContentLoaded", function () {
  function openNav() {
    const sidenav = document.getElementById("mySidenav");
    const mainContent = document.getElementById("main");
    const openButton = document.querySelector(".sidenav-open-button");

    if (sidenav && mainContent) {
      sidenav.style.width = "250px";
      mainContent.style.marginLeft = "250px";
      if (openButton) openButton.style.display = "none";
    } else {
      console.error("Sidebar or Main Content not found.");
    }
  }

  function closeNav() {
    const sidenav = document.getElementById("mySidenav");
    const mainContent = document.getElementById("main");
    const openButton = document.querySelector(".sidenav-open-button");

    if (sidenav && mainContent) {
      sidenav.style.width = "0";
      mainContent.style.marginLeft = "0";
      if (openButton) openButton.style.display = "block";
    } else {
      console.error("Sidebar or Main Content not found.");
    }
  }

  // Attaching the functions to the window object to make them accessible globally if needed
  window.openNav = openNav;
  window.closeNav = closeNav;

  // Add event listeners to the sidebar-specific elements only
  const openButton = document.querySelector(".sidenav-open-button");
  const closeButton = document.querySelector(".closebtn");

  if (openButton) {
    openButton.addEventListener("click", openNav);
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeNav);
  }
  
})
