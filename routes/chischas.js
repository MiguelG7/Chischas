const express = require('express');
const router = express.Router();

router.get('/', (req,res) =>{
    console.log("entre a router.get('/ de /chischas");
    res.render('chischas');
});

module.exports = router;