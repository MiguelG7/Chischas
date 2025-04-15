const express = require('express');
const router = express.Router();
const User = require('../models/users');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
    res.render('login'); // Renderiza el formulario de login
});

router.post('/', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Buscar al usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).send('Correo o contraseña incorrectos.');
        }

        // Verificar la contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).send('Correo o contraseña incorrectos.');
        }

        // Establecer la sesión del usuario
        req.session.userId = user._id;
        res.status(200).send('Inicio de sesión exitoso.');
    } catch (err) {
        console.error('Error al iniciar sesión:', err);
        res.status(500).send('Error al iniciar sesión.');
    }
});

module.exports = router;