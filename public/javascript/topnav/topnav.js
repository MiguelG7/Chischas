document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll(".topnav a");
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        // Eliminar la clase 'active' de todos los enlaces
        link.classList.remove("active");

        // Comparar href del enlace con la URL actual
        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active"); // Marcar la pestaña correcta
        }

        // Permitir que el usuario vea el cambio al hacer clic
        link.addEventListener("click", function () {
            navLinks.forEach(l => l.classList.remove("active"));
            this.classList.add("active");
        });
    });
});
