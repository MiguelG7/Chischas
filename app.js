const express = require('express');
const session = require('express-session');
const app = express();
const cookieParser = require('cookie-parser');
require('dotenv').config();

//sockets
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'));//hace que public sea el comienzo de la ruta relativa haciendo posible rutas como /javascript/snake en snake.ejs
app.set('view engine','ejs');
app.set('views','./views');

// Sirve archivos estáticos desde node_modules
app.use('/chessboardjs', express.static('chess_engine/chessboardjs'));
app.use('/chessjs', express.static('chess_engine/chess.js'));
app.use('/socket.io-client', express.static('node_modules/socket.io-client/dist'));

app.locals.title = process.env.TITLE_ENV;

app.use(express.urlencoded({ extended: true }));//hace que se pueda usar req.body
app.use(express.json());//hace que se pueda usar req.body

const indexRouter = require('./routes/index');
const chischasRouter = require('./routes/chischas');
const registroRouter = require('./routes/registro');

app.use(session({
    secret: 'mi-secreto',
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000 * 60 * 60 * 24}
}));

app.use(cookieParser());

app.use((req, res, next) => {
    res.locals.session = req.session; // Hacer que la sesión esté disponible en las vistas
    res.locals.cookiesAccepted = req.cookiesAccepted || false;
    console.log(`${req.method} request for ${req.url}`);
    next();
});

app.use('/', indexRouter);
app.use('/chischas', chischasRouter);
app.use('/registro', registroRouter);

const games = {}; // Objeto para almacenar el estado de las partidas

io.on("connection", (socket) => {
    console.log("Un jugador se ha conectado.");

    socket.on("joinGame", ({ gameId, playerName }) => {
        if (!games[gameId]) {
            // Crear una nueva partida si no existe
            games[gameId] = { 
                players: [], 
                turn: 'w', 
                playerNames: {}, 
                history: [], // Historial de movimientos
                fen: null // Estado actual del tablero
            };
        }

        const game = games[gameId];

        if (game.players.length >= 2) {
            socket.emit("errorMessage", "La partida ya está llena.");
            return;
        }

        // Añadir al jugador a la partida
        game.players.push(socket.id);
        game.playerNames[socket.id] = playerName;
        socket.join(gameId);
        console.log(`Jugador ${playerName} unido a la partida ${gameId}`);

        // Enviar el estado actual del juego al cliente
        socket.emit("gameState", { 
            fen: game.fen, 
            history: game.history, 
            turn: game.turn, 
            playerNames: game.playerNames 
        });

        // Asignar colores al azar cuando haya dos jugadores
        if (game.players.length === 2) {
            const [player1, player2] = game.players;
            const colors = Math.random() < 0.5 ? ['w', 'b'] : ['b', 'w'];

            // Enviar colores y nombres a ambos jugadores
            io.to(player1).emit("colorAssignment", {
                color: colors[0],
                opponentName: game.playerNames[player2],
            });
            io.to(player2).emit("colorAssignment", {
                color: colors[1],
                opponentName: game.playerNames[player1],
            });

            // Notificar que la cuenta atrás debe comenzar
            setTimeout(() => {
                io.to(gameId).emit("startCountdown");
            }, 1000); // Espera 1 segundo antes de iniciar la cuenta atrás
        } else {
            // Notificar al jugador que está esperando
            socket.emit("waitingForOpponent", "Esperando a que se una el rival...");
        }
    });

    socket.on("move", ({ gameId, move }) => {
        const game = games[gameId];
        if (!game) return;

        // Actualizar el historial y el estado del juego
        game.history.push(move);
        game.fen = move.fen; // Actualizar el estado del tablero
        game.turn = game.turn === 'w' ? 'b' : 'w';

        // Enviar el movimiento al oponente
        socket.to(gameId).emit("opponentMove", move);
    });

    socket.on("disconnect", () => {
        console.log("Un jugador se ha desconectado.");
        for (const gameId in games) {
            const game = games[gameId];
            game.players = game.players.filter((id) => id !== socket.id);

            // Si no quedan jugadores, eliminar la partida
            if (game.players.length === 0) {
                delete games[gameId];
            }
        }
    });
});

server.listen(3000, () => {
    console.log("Servidor escuchando en http://localhost:3000");
});
