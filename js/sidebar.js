(() => {
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const backdrop = document.getElementById("sidebarBackdrop");
    const toggleIcon = toggle?.querySelector("i");

    // Laptop/desktop breakpoint: Tailwind xl = 1280px
    const desktopQuery = window.matchMedia("(min-width: 1280px)");

    if (!sidebar || !toggle || !backdrop) {
        console.error("Sidebar elements not found.");
        return;
    }

    // Open sidebar on mobile/tablet
    function openSidebar() {
        if (desktopQuery.matches) return;

        sidebar.classList.remove("-translate-x-full");
        sidebar.classList.add("translate-x-0");

        backdrop.classList.remove("hidden");
        backdrop.classList.add("block");

        document.body.classList.add("overflow-hidden");

        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Close navigation menu");

        toggleIcon?.classList.replace("fa-bars", "fa-xmark");
    }

    // Close sidebar on mobile/tablet
    function closeSidebar() {
        sidebar.classList.add("-translate-x-full");
        sidebar.classList.remove("translate-x-0");

        backdrop.classList.add("hidden");
        backdrop.classList.remove("block");

        document.body.classList.remove("overflow-hidden");

        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open navigation menu");

        toggleIcon?.classList.replace("fa-xmark", "fa-bars");
    }

    // Hamburger button
    toggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.contains("translate-x-0");

        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    // Close when clicking outside the sidebar
    backdrop.addEventListener("click", closeSidebar);

    // Close after clicking a navigation link on mobile/tablet
    sidebar.querySelectorAll("nav a").forEach((link) => {
        link.addEventListener("click", () => {
            if (!desktopQuery.matches) {
                closeSidebar();
            }
        });
    });

    // Close using the Escape key
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    // Reset sidebar when changing between mobile and desktop sizes
    desktopQuery.addEventListener("change", closeSidebar);
})();