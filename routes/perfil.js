const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const User = require('../models/users');

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

// Ruta para mostrar el perfil del usuario
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('Usuario no encontrado.');
        }

        res.render('perfil', { user }); // Renderiza la vista del perfil con los datos del usuario
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