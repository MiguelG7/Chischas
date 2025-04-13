document.addEventListener('DOMContentLoaded', function () {
    const crearLinkButton = document.getElementById('crearLink');
    if (crearLinkButton) {
        crearLinkButton.addEventListener('click', function (event) {
            event.preventDefault(); // Evita que el formulario se recargue

            fetch("/chischas/id")
                .then(response => response.url) // Obtiene la URL generada
                .then(url => {
                    document.getElementById("link").innerHTML = `Conéctate a: <a href="${url}" target="_blank">${url}</a>`;
                })
                .catch(error => console.error("Error al generar la partida:", error));
        });
    }
});

document.getElementById("joinGameButton").addEventListener("click", function() {
    const gameId = document.getElementById("gameIdInput").value;

    if (!gameId) {
        alert("Por favor, introduce un ID válido.");
        return;
    }

    // Redirigir al usuario a la partida correspondiente
    window.location.href = '/chischas/${gameId}';
});
