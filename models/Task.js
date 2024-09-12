// models/Task.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Title is required' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Pendiente', // Establece el valor predeterminado como 'Pendiente'
    validate: {
      isIn: {
        args: [['Pendiente', 'En Progreso', 'Completada']],
        msg: 'Status must be one of: Pendiente, En Progreso, Completada',
      },
    },
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Normal', // Establece el valor predeterminado como 'Normal'
    validate: {
      isIn: {
        args: [['Low', 'Normal', 'High']],
        msg: 'Priority must be one of: Low, Normal, High',
      },
    },
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true, // La categoría es opcional
    validate: {
      notEmpty: { msg: 'Category cannot be empty' },
    },
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
});

module.exports = Task;
