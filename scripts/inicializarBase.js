const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/users');
const Partida = require('../models/partidas');

async function initializeDatabase() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a MongoDB');

        // Verificar si la colección "users" existe
        const userCollectionExists = await mongoose.connection.db.listCollections({ name: 'users' }).hasNext();
        if (!userCollectionExists) {
            console.log('Creando colección "users"...');
            await User.createCollection();
        } else {
            console.log('La colección "users" ya existe.');
        }

        // Verificar si la colección "partidas" existe
        const partidaCollectionExists = await mongoose.connection.db.listCollections({ name: 'partidas' }).hasNext();
        if (!partidaCollectionExists) {
            console.log('Creando colección "partidas"...');
            await Partida.createCollection();
        } else {
            console.log('La colección "partidas" ya existe.');
        }

        console.log('Inicialización de la base de datos completada.');
    } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
        process.exit(1);
    }
}

module.exports = initializeDatabase;