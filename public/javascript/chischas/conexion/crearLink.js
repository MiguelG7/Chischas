document.getElementById("crearLink").addEventListener("click", function(event) {
    event.preventDefault(); // Evita que el formulario se recargue

    fetch("/chischas/id")
        .then(response => response.url) // Obtiene la URL generada
        .then(url => {
            document.getElementById("link").innerHTML = `Conéctate a: <a href="${url}">${url}</a>`;
        })
        .catch(error => console.error("Error al generar la partida:", error));
});