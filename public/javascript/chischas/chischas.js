document.addEventListener("DOMContentLoaded", () => {
    const gameBoard = document.querySelector("#gameboard");
    const filas = 8, columnas = 8;
    const letras = ["a", "b", "c", "d", "e", "f", "g", "h"];

    // Configurar el tablero con grid responsivo
    gameBoard.style.display = "grid";
    gameBoard.style.gridTemplateColumns = "repeat(8, 12.5%)"; // Cada casilla ocupa el 12.5% del ancho total
    gameBoard.style.gridTemplateRows = "repeat(8, 12.5%)"; // Cada casilla ocupa el 12.5% de la altura total
    gameBoard.style.width = "90vmin"; // Ancho del tablero adaptado al tamaño de la pantalla
    gameBoard.style.height = "90vmin"; // Altura del tablero adaptada al tamaño de la pantalla
    gameBoard.style.border = "2px solid black";
    gameBoard.style.margin = "auto"; // Centra el tablero en la pantalla

    for (let fila = 0; fila < filas; fila++) {
        for (let col = 0; col < columnas; col++) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.style.width = "100%"; // Cada casilla ocupa el 100% de su celda
            square.style.height = "100%"; // La casilla llena completamente la celda
            square.style.display = "flex";
            square.style.alignItems = "center";
            square.style.justifyContent = "center";
            square.style.fontSize = "2vmin"; // Tamaño del texto relativo a la pantalla
            square.dataset.position = `${letras[col]}${8 - fila}`; // Asigna coordenadas

            // Alterna los colores de las casillas
            square.style.backgroundColor = (fila + col) % 2 === 0 ? "#EEEED2" : "#769656";

            gameBoard.appendChild(square);
        }
    }
});

