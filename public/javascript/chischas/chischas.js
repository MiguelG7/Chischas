import { Chess } from '/chessjs/dist/esm/chess.js';

const socket = io(); // Inicializa el cliente de Socket.IO
let playerColor = null; // Color del jugador
let chess = null; // Instancia de Chess.js
let board = null; // Instancia de ChessBoard.js
let playerName = null; // Nombre del jugador
let gameId = null; // ID de la partida

socket.on("connect", () => {
    console.log("Conectado al servidor de Socket.IO con ID:", socket.id);
});

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('board1')) {
        gameId = window.location.pathname.split('/').pop(); // Obtiene el ID de la partida desde la URL
        playerName = prompt("Introduce tu nombre:"); // Solicita el nombre del jugador

        // Unirse a la partida
        socket.emit("joinGame", { gameId, playerName });

        // Mostrar animación de espera
        const colorSortingModal = document.getElementById('color-sorting-modal');
        colorSortingModal.classList.remove('hidden');

        // Esperar al rival
        socket.on("waitingForOpponent", (message) => {
            console.log(message);
            alert(message);
        });

        // Verificar si ambos jugadores han ingresado sus nombres
        socket.on("bothPlayersReady", () => {
            console.log("Ambos jugadores están listos. Sorteando colores...");
            socket.emit("startColorSorting", { gameId });
        });

        // Asignar color al jugador
        socket.on("colorAssignment", ({ color, opponentName }) => {
            playerColor = color;

            // Mostrar animación épica de "versus"
            const vsModal = document.getElementById('vs-modal');
            vsModal.querySelector('#player1-name').textContent = playerName;
            vsModal.querySelector('#player2-name').textContent = opponentName;
            vsModal.classList.remove('hidden');

            // Iniciar cuenta atrás sincronizada
            socket.emit("startCountdown", { gameId });
        });

        // Mostrar cuenta atrás sincronizada
        socket.on("startCountdown", () => {
            console.log("Cuenta atrás iniciada");

            const vsModal = document.getElementById('vs-modal');
            const colorSortingModal = document.getElementById('color-sorting-modal');

            // Configurar el contador
            let countdown = 3; // Segundos para el conteo regresivo
            const countdownElement = document.createElement('p');
            countdownElement.id = 'countdown';
            countdownElement.style.marginTop = '20px';
            countdownElement.style.fontSize = '1.5rem';
            countdownElement.style.color = 'white';
            countdownElement.textContent = `La partida comienza en: ${countdown}`;
            vsModal.appendChild(countdownElement);

            // Iniciar el temporizador
            const interval = setInterval(() => {
                countdown -= 1;
                countdownElement.textContent = `La partida comienza en: ${countdown}`;

                if (countdown === 0) {
                    clearInterval(interval); // Detener el temporizador

                    // Eliminar el contador y ocultar los modales
                    countdownElement.remove(); // Elimina el elemento del contador
                    vsModal.classList.add('hidden'); // Oculta el modal de "VS"
                    colorSortingModal.classList.add('hidden'); // Oculta el modal de "Decidiendo tu color"

                    // Inicializar el tablero
                    chess = new Chess();
                    board = ChessBoard('board1', {
                        draggable: true,
                        position: 'start',
                        pieceTheme: '/chessboardjs/www/img/chesspieces/wikipedia/{piece}.png',
                        orientation: playerColor === 'w' ? 'white' : 'black', // Orientar el tablero según el color
                        onDrop: (source, target) => {
                            if (chess.turn() !== playerColor) {
                                return 'snapback'; // No es el turno del jugador
                            }

                            const move = chess.move({
                                from: source,
                                to: target,
                                promotion: 'q', // Promoción automática a reina
                            });

                            if (move === null) return 'snapback'; // Movimiento inválido

                            board.position(chess.fen()); // Actualiza el tablero

                            // Enviar el movimiento al oponente
                            socket.emit("move", { gameId, move });
                        },
                    });

                    // Mostrar el color asignado
                    alert(`¡La partida ha comenzado! Tú juegas con las ${playerColor === 'w' ? 'blancas' : 'negras'}.`);
                }
            }, 1000); // Actualizar cada segundo
        });

        // Escuchar movimientos del oponente
        socket.on("opponentMove", (move) => {
            chess.move(move); // Actualiza la lógica del juego
            board.position(chess.fen()); // Actualiza el tablero
        });

        // Manejar desconexión del oponente
        socket.on("opponentDisconnected", (message) => {
            console.log(message);
            alert(message);
        });
    }
});
