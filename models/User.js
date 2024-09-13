// models/user.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetTokenExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  profilePhoto: {  // Corregido aquí
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true // Si deseas que se creen campos de fecha de creación y actualización
});

// Métodos adicionales para el manejo de tokens de reseteo
User.findByResetToken = function (token) {
  if (!token) {
    throw new Error('Reset token is required');
  }
  
  return this.findOne({
    where: {
      resetToken: token,
      resetTokenExpiry: { [Op.gt]: new Date() } // Verifica si el token no ha expirado
    }
  });
};

User.updateResetToken = function (userId, token, expiry) {
  return this.update(
    { resetToken: token, resetTokenExpiry: expiry },
    { where: { id: userId } }
  );
};

module.exports = User;
