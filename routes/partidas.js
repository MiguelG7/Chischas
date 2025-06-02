const express = require('express');
const router = express.Router();
const Game = require('../models/partidas');
const User = require('../models/users');
const { v4: uuidv4 } = require('uuid');


router.post('/crear', async (req, res) => {
  const { player1Id, player2Id } = req.body;

  try {
    const player1 = await User.findById(player1Id);
    const player2 = await User.findById(player2Id);

    if (!player1 || !player2) {
      return res.status(404).send('Uno o ambos jugadores no existen.');
    }

    const game = new Game({
      id: uuidv4(),
      players: [
        { userId: player1._id, color: 'w' },
        { userId: player2._id, color: 'b' }
      ]
    });

    await game.save();
    res.status(201).send('Partida creada exitosamente.');
  } catch (err) {
    console.error('Error al crear la partida:', err);
    res.status(500).send('Error al crear la partida.');
  }
});

module.exports = router;