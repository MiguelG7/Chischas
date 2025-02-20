const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require("uuid"); // Importar UUID para generar IDs únicos

// Página principal de "chischas"
router.get('/', (req, res) => {
    res.render('chischas' , { gameId: null });
});

// Generar ID de partida y redirigir al usuario
router.get('/id', (req, res) => {
    const gameId = uuidv4(); // Genera un ID único
    res.redirect(`/chischas/${gameId}`); // Redirige a la partida con el ID generado
});

// Ruta de entrada a una partida con un ID específico
router.get('/:id', (req, res) => {

    const gameId = req.params.id;
    console.log("Entrando a /chischas/",gameId)
    res.render('chischas', { gameId }); // Carga una vista "partida.ejs"
});

module.exports = router;
