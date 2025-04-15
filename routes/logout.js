const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login'); // Redirige al formulario de login
    });
});

module.exports = router;