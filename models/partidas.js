const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // ID único de la partida
    players: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencia al ID del usuario
            color: { type: String, enum: ['w', 'b'], required: true }, // Color asignado al jugador
            name: { type: String }, // Nombre del jugador
            profilePicture: { type: String }, // Foto del jugador
        }
    ],
    result: {
        winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ID del ganador (opcional)
        draw: { type: Boolean, default: false } // Indica si la partida terminó en empate
    },
    moves: { type: [String], default: [] }, // Historial de movimientos
    createdAt: { type: Date, default: Date.now }, // Fecha de creación de la partida
    updatedAt: { type: Date, default: Date.now } // Fecha de última actualización
});

module.exports = mongoose.model('Partidas', gameSchema);