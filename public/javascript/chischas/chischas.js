// filepath: c:\Users\migue\OneDrive - Fundación Universitaria San Pablo CEU\4to año\TFG\TFG\public\javascript\chischas\chischas.js
import { Chess } from '/chessjs/dist/esm/chess.js';

const socket = io(); // Inicializa el cliente de Socket.IO

socket.on("connect", () => {
    console.log("Conectado al servidor de Socket.IO con ID:", socket.id);
});

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('board1')) {
        const chess = new Chess();
        const gameId = window.location.pathname.split('/').pop(); // Obtiene el ID de la partida desde la URL

        // Unirse a la partida
        socket.emit("joinGame", gameId);

        const board = ChessBoard('board1', {
            draggable: true,
            position: 'start',
            pieceTheme: '/chessboardjs/www/img/chesspieces/wikipedia/{piece}.png',
            onDrop: (source, target) => {
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

        // Escuchar movimientos del oponente
        socket.on("opponentMove", (move) => {
            chess.move(move); // Actualiza la lógica del juego
            board.position(chess.fen()); // Actualiza el tablero
        });
    }
});

