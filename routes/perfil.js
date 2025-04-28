const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const User = require('../models/users');

// Ruta para mostrar el perfil del usuario
const Game = require('../models/partidas');

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, `${req.session.userId}-${Date.now()}${path.extname(file.originalname)}`);
    },
});
const upload = multer({ storage });

// Middleware para proteger la ruta
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

router.get('/', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.session.userId).lean();
        const games = await Game.find({
            'players.userId': req.session.userId
        }).lean();

        const formattedGames = games.map(game => {
            const player = game.players.find(p => p.userId.toString() === req.session.userId);
            const opponent = game.players.find(p => p.userId.toString() !== req.session.userId);

            return {
                id: game.id,
                date: game.createdAt,
                opponentName: opponent ? opponent.name : 'Desconocido',
                result: game.result.draw
                    ? 'Empate'
                    : game.result.winner === req.session.userId
                    ? 'Victoria'
                    : 'Derrota',
                color: player.color
            };
        });

        res.render('perfil', { user, games: formattedGames });
    } catch (err) {
        console.error('Error al cargar el perfil:', err);
        res.status(500).send('Error al cargar el perfil.');
    }
});

// Ruta para actualizar el perfil del usuario
router.post('/', isAuthenticated, upload.single('profilePicture'), async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            email: req.body.email,
        };

        if (req.file) {
            updates.profilePicture = `/uploads/${req.file.filename}`;
        }

        await User.findByIdAndUpdate(req.session.userId, updates);
        res.redirect('/perfil');
    } catch (err) {
        console.error('Error al actualizar el perfil:', err);
        res.status(500).send('Error al actualizar el perfil.');
    }
});

module.exports = router;