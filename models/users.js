const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  totalGames: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  registrationDate: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  recentGames: { type: [String], default: [] },
  profilePicture: { type: String, default: '/uploads/default-profile.jpg' } // Ruta de la foto predeterminada
});

// Middleware para encriptar contraseñas antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);