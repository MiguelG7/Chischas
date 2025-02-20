const express = require('express');
const router = express.Router();

router.get('/', (req,res) =>{
    console.log("entre a router.get('/");
    res.render('registro');
});

module.exports = router;