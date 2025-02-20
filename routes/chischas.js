const express = require('express');
const router = express.Router();

router.get('/', (req,res) =>{
    console.log("entre a router.get('/ de /chischas");
    res.render('chischas');
});

router.get('/inicio_partida', (req,res) =>{
    res.send('has entrado en /inicio_partida');
});

module.exports = router;