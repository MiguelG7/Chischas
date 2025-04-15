const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/users');
const Game = require('../models/partidas');

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
        const gameCollectionExists = await mongoose.connection.db.listCollections({ name: 'games' }).hasNext();
        if (!gameCollectionExists) {
            console.log('Creando colección "games"...');
            await Game.createCollection();
        } else {
            console.log('La colección "games" ya existe.');
        }

        // Cerrar la conexión
        await mongoose.connection.close();
        console.log('Inicialización de la base de datos completada.');
    } catch (err) {
        console.error('Error al inicializar la base de datos:', err);
        process.exit(1);
    }
}

initializeDatabase();