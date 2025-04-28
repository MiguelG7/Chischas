const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/login'); // Redirect to the login page
    });
});

module.exports = router;