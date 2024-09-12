// models/associations.js
const User = require('./User');
const Task = require('./Task');

// Definir relaciones
User.hasMany(Task, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
Task.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

console.log('Associations set up successfully.');
