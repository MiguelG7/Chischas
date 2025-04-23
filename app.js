const express = require('express');
const session = require('express-session');
const app = express();
const cookieParser = require('cookie-parser');
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/users'); // Importar el modelo de usuario
const inicializarBase = require('./scripts/inicializarBase'); // Importar el script de inicialización
const Game = require('./models/partidas'); // Importar modelo de partidas
const { Chess } = require('./chess_engine/chess.js'); // Importar la biblioteca de ajedrez

// Inicializar la base de datos
inicializarBase();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

// Configuración de sockets
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public')); // Hace que "public" sea el comienzo de la ruta relativa, permitiendo rutas como /javascript/snake en snake.ejs
app.set('view engine', 'ejs');
app.set('views', './views');

// Servir archivos estáticos desde node_modules
app.use('/chessboardjs', express.static('chess_engine/chessboardjs'));
app.use('/chessjs', express.static('chess_engine/chess.js'));
app.use('/socket.io-client', express.static('node_modules/socket.io-client/dist'));

app.locals.title = process.env.TITLE_ENV || "Chischás!";

app.use(express.urlencoded({ extended: true })); // Permite usar req.body para datos codificados en URL
app.use(express.json()); // Permite usar req.body para datos JSON

const indexRouter = require('./routes/index');
const chischasRouter = require('./routes/chischas');
const registroRouter = require('./routes/registro');
const loginRouter = require('./routes/login');
const partidasRouter = require('./routes/partidas');
const logoutRouter = require('./routes/logout');
const perfilRouter = require('./routes/perfil');

app.use(session({
    secret: 'mi-secreto',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // Duración de la cookie: 1 día
}));

app.use(cookieParser());

app.use(async (req, res, next) => {
    res.locals.session = req.session; // Hacer que la sesión esté disponible en las vistas
    res.locals.cookiesAccepted = req.cookiesAccepted || false;

    if (req.session.userId) {
        const user = await User.findById(req.session.userId).select('name profilePicture');
        res.locals.session.userName = user ? user.name : null;
        res.locals.session.userId = req.session.userId;
    }

    next();
});

// Configuración de rutas
app.use('/', indexRouter);
app.use('/chischas', chischasRouter);
app.use('/registro', registroRouter);
app.use('/login', loginRouter);
app.use('/partidas', partidasRouter);
app.use('/logout', logoutRouter);
app.use('/perfil', perfilRouter);

const games = {}; // Objeto para almacenar el estado de las partidas

const updateGameStatus = (gameId) => {
    const game = games[gameId];
    if (!game) return;

    const playerNames = Object.values(game.playerNames);
    const playerCount = game.players.length;

    io.to(gameId).emit("updateGameStatus", { playerNames, playerCount });
};

io.on("connection", (socket) => {
    console.log("Un jugador se ha conectado.");

    socket.on("joinGame", async ({ gameId, playerName, userId }) => {
        try {
            console.log(`Jugador ${playerName || userId} intentando unirse a la partida ${gameId}`);
            if (!playerName && !userId) {
                socket.emit("errorMessage", "El nombre del jugador o el ID de usuario es obligatorio.");
                return;
            }

            if (!games[gameId]) {
                games[gameId] = { 
                    players: [], 
                    turn: 'w', 
                    playerNames: {}, 
                    playerPictures: {}, 
                    history: [],
                    fen: null,
                };
            }

            const game = games[gameId];

            if (game.players.length >= 2) {
                socket.emit("errorMessage", "La partida ya está llena.");
                return;
            }

            // Buscar o crear un usuario
            let user;
            if (userId) {
                user = await User.findById(userId).select('name profilePicture');
            } else if (playerName) {
                user = await User.findOne({ name: playerName }).select('name profilePicture');
                if (!user) {
                    console.log(`Usuario no encontrado en la base de datos. Creando usuario temporal para ${playerName}.`);
                    user = { name: playerName, profilePicture: '/uploads/default-profile.jpg' };
                }
            }

            if (!user) {
                socket.emit("errorMessage", "No se pudo encontrar o crear el usuario.");
                return;
            }

            // Añadir al jugador a la partida
            game.players.push(socket.id);
            game.playerNames[socket.id] = user.name;
            game.playerPictures[socket.id] = user.profilePicture;
            socket.join(gameId);

            // Mostrar los nombres de los jugadores
            const playerNames = Object.values(game.playerNames);
            console.log(`Jugador 1: ${playerNames[0] || 'Esperando...'}`);
            console.log(`Jugador 2: ${playerNames[1] || 'Esperando...'}`);

            console.log("Número de jugadores en la partida:", game.players.length);
            if (game.players.length === 2) {
                console.log("LOS DOS JUGADORES SE HAN UNIDO");
                const [player1, player2] = game.players;
                const colors = Math.random() < 0.5 ? ['w', 'b'] : ['b', 'w'];

                // Asignar colores a los jugadores
                io.to(player1).emit("colorAssignment", {
                    color: colors[0],
                    opponentName: game.playerNames[player2],
                    opponentPicture: game.playerPictures[player2],
                });
                io.to(player2).emit("colorAssignment", {
                    color: colors[1],
                    opponentName: game.playerNames[player1],
                    opponentPicture: game.playerPictures[player1],
                });

                console.log("Asignando colores:", colors);
                console.log("Iniciando cuenta atrás para el juego:", gameId);

                // Emitir el evento de inicio de cuenta atrás
                setTimeout(() => {
                    io.to(gameId).emit("startCountdown");
                }, 1000);
            } else {
                socket.emit("waitingForOpponent", "Esperando a que se una el rival...");
            }

            // Emitir el estado actualizado del juego
            updateGameStatus(gameId);

            // Emitir el historial de movimientos al jugador que se une
            socket.emit("gameState", {
                fen: game.fen,
                history: game.history,
                turn: game.turn,
                playerNames: game.playerNames,
            });
        } catch (err) {
            console.error('Error al unir al usuario a la partida:', err);
        }
    });

    socket.on("move", async ({ gameId, move }) => {
        const game = games[gameId];
        if (!game) return;

        // Serializar el objeto de movimiento en un formato legible
        const moveWithPiece = {
            piece: move.piece,
            from: move.from,
            to: move.to,
            san: move.san,
        };

        game.history.push(moveWithPiece); // Guardar el movimiento serializado
        game.fen = move.after; // Actualizar el estado del tablero con el FEN resultante
        game.turn = game.turn === 'w' ? 'b' : 'w';

        console.log("Estado actual de la partida:", game);

        // Verificar si la partida ha terminado
        const chess = new Chess(game.fen);
        if (chess.isCheckmate()) {
            const winner = game.turn === 'b' ? 'w' : 'b'; // El turno opuesto gana
            const loser = game.turn;

            // Actualizar estadísticas en la base de datos
            if (game.players.length === 2) {
                const [player1, player2] = game.players;

                try {
                    const winnerId = mongoose.Types.ObjectId.isValid(player1) ? mongoose.Types.ObjectId(player1) : null;
                    const loserId = mongoose.Types.ObjectId.isValid(player2) ? mongoose.Types.ObjectId(player2) : null;

                    if (winnerId && loserId) {
                        await User.findByIdAndUpdate(winnerId, { $inc: { wins: 1, totalGames: 1 } });
                        await User.findByIdAndUpdate(loserId, { $inc: { losses: 1, totalGames: 1 } });
                    } else {
                        console.error("IDs de jugadores no válidos:", { winnerId, loserId });
                    }
                } catch (err) {
                    console.error("Error al actualizar estadísticas:", err);
                }
            }

            // Guardar el resultado en la base de datos
            try {
                await Game.create({
                    id: gameId,
                    players: Object.entries(game.playerNames).map(([socketId, name]) => ({
                        userId: socketId,
                        name,
                        color: game.players[0] === socketId ? 'w' : 'b',
                        profilePicture: game.playerPictures[socketId],
                    })),
                    result: { winner, draw: false },
                    moves: game.history.map(m => m.san),
                });
            } catch (err) {
                console.error("Error al guardar el resultado de la partida:", err);
            }

            io.to(gameId).emit("gameOver", { result: `¡Jaque mate! Ganador: ${winner}` });
            delete games[gameId];
            return;
        }

        if (chess.isDraw()) {
            // Actualizar estadísticas en la base de datos
            if (game.players.length === 2) {
                const [player1, player2] = game.players;

                try {
                    const player1Id = mongoose.Types.ObjectId.isValid(player1) ? mongoose.Types.ObjectId(player1) : null;
                    const player2Id = mongoose.Types.ObjectId.isValid(player2) ? mongoose.Types.ObjectId(player2) : null;

                    if (player1Id && player2Id) {
                        await User.findByIdAndUpdate(player1Id, { $inc: { draws: 1, totalGames: 1 } });
                        await User.findByIdAndUpdate(player2Id, { $inc: { draws: 1, totalGames: 1 } });
                    } else {
                        console.error("IDs de jugadores no válidos:", { player1Id, player2Id });
                    }
                } catch (err) {
                    console.error("Error al actualizar estadísticas:", err);
                }
            }

            // Guardar el resultado en la base de datos
            try {
                await Game.create({
                    id: gameId,
                    players: Object.entries(game.playerNames).map(([socketId, name]) => ({
                        userId: socketId,
                        name,
                        color: game.players[0] === socketId ? 'w' : 'b',
                        profilePicture: game.playerPictures[socketId],
                    })),
                    result: { draw: true },
                    moves: game.history.map(m => m.san),
                });
            } catch (err) {
                console.error("Error al guardar el resultado de la partida:", err);
            }

            io.to(gameId).emit("gameOver", { result: "¡La partida terminó en tablas!" });
            delete games[gameId];
            return;
        }

        // Enviar el movimiento al oponente
        socket.to(gameId).emit("opponentMove", move);

        // Emitir el historial actualizado a ambos jugadores
        io.to(gameId).emit("gameState", {
            fen: game.fen,
            history: game.history, // Enviar el historial serializado
            turn: game.turn,
            playerNames: game.playerNames,
        });
    });

    socket.on("chatMessage", ({ gameId, message, userName }) => {
        if (!message || !userName || !gameId) {
            console.error("Datos incompletos para el mensaje de chat:", { gameId, message, userName });
            return;
        }
        console.log(`Mensaje recibido en partida ${gameId}: ${message} (de ${userName})`);
        io.to(gameId).emit("chatMessage", { gameId, userName, message, timestamp: new Date().toLocaleTimeString() });
    });

    socket.on("disconnect", () => {
        console.log("Un jugador se ha desconectado.");
        for (const gameId in games) {
            const game = games[gameId];
            game.players = game.players.filter((id) => id !== socket.id);

            // Si no quedan jugadores, eliminar la partida
            if (game.players.length === 0) {
                delete games[gameId];
            } else {
                // Emitir el estado actualizado del juego
                updateGameStatus(gameId);
            }
        }
    });
});

server.listen(3000, () => {
    console.log("Servidor escuchando en http://localhost:3000");
});
