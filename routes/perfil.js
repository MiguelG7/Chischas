const express = require('express');
const router = express.Router();
const User = require('../models/users');

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

module.exports = router;