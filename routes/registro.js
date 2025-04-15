const express = require('express');
const router = express.Router();
const User = require('../models/users');

router.get('/', (req, res) => {
    res.render('registro'); // Renderiza el formulario de registro
});

router.post('/', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('El correo ya está registrado.');
        }

        // Crear un nuevo usuario
        const user = new User({ name, email, password });
        await user.save();

        res.status(201).send('Usuario registrado exitosamente.');
    } catch (err) {
        console.error('Error al registrar el usuario:', err);
        res.status(500).send('Error al registrar el usuario.');
    }
});

module.exports = router;