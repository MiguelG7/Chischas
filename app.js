const express = require('express');
const session = require('express-session');
const app = express();
const cookieParser = require('cookie-parser');
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/users'); // Importa el modelo de usuario
const inicializarBase = require('./scripts/inicializarBase'); // Importa el script de inicialización

// Inicializar la base de datos
inicializarBase();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error al conectar a MongoDB:', err));

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

app.locals.title = process.env.TITLE_ENV || "Chischás!";

app.use(express.urlencoded({ extended: true }));//hace que se pueda usar req.body
app.use(express.json());//hace que se pueda usar req.body

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
    cookie: {maxAge: 1000 * 60 * 60 * 24}
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

    socket.on("joinGame", async ({ gameId, playerName }) => {
        console.log(`Jugador ${playerName} intentando unirse a la partida ${gameId}`);
        if (!playerName) {
            socket.emit("errorMessage", "El nombre del jugador es obligatorio.");
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

        // Crear un usuario temporal si no se encuentra en la base de datos
        let user = await User.findOne({ name: playerName }).select('name profilePicture');
        if (!user) {
            console.log(`Usuario no encontrado en la base de datos. Creando usuario temporal para ${playerName}.`);
            user = { name: playerName, profilePicture: '/uploads/default-profile.png' };
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
    });

    socket.on("joinGame", async ({ userId, userName }) => {
        try {
            let user;
            if (userId) {
                // Buscar al usuario logueado
                user = await User.findById(userId).select('name profilePicture');
            } else if (userName) {
                // Crear un usuario temporal para no logueados
                user = { name: userName, profilePicture: '/uploads/default-profile.png' };
            }

            if (!user) {
                socket.emit('errorMessage', 'No se pudo encontrar o crear el usuario.');
                return;
            }

            // Añadir al jugador a la partida
            game.players.push(socket.id);
            game.playerNames[socket.id] = user.name;
            game.playerPictures[socket.id] = user.profilePicture;
            socket.join(gameId);

            // Lógica para unir al usuario a la partida
            console.log(`${user.name} se unió a la partida.`);
            // Emitir datos al cliente
        } catch (err) {
            console.error('Error al unir al usuario a la partida:', err);
        }
    });

    socket.on("move", ({ gameId, move }) => {
        const game = games[gameId];
        if (!game) return;

        // Actualizar el historial y el estado del juego
        game.history.push(move); // Guardar el movimiento completo
        game.fen = move.after; // Actualizar el estado del tablero con el FEN resultante
        game.turn = game.turn === 'w' ? 'b' : 'w';

        console.log("Estado actual de la partida:", game);

        // Enviar el movimiento al oponente
        socket.to(gameId).emit("opponentMove", move);

        // Emitir el historial actualizado a ambos jugadores
        io.to(gameId).emit("gameState", {
            fen: game.fen,
            history: game.history.map((m) => m.san), // Enviar solo SAN al cliente
            turn: game.turn,
            playerNames: game.playerNames,
        });
    });

    socket.on("chatMessage", ({ gameId, message, playerName }) => {
        if (!message || !playerName) return; // Validar entrada
        console.log(`Mensaje recibido en partida ${gameId}: ${message} (de ${playerName})`);
        io.to(gameId).emit("chatMessage", { playerName, message, timestamp: new Date().toLocaleTimeString() });
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
