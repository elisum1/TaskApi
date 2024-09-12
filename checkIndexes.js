// checkIndexes.js

const { sequelize } = require('./models/User'); // Ajusta la ruta según la ubicación de tus modelos

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a la base de datos correctamente.');

    // Consulta para mostrar los índices de la tabla 'Users'
    return sequelize.query('SHOW INDEX FROM Users');
  })
  .then(([results, metadata]) => {
    console.log('Índices de la tabla Users:', results);
    process.exit(); // Cierra el proceso después de obtener los índices
  })
  .catch(err => {
    console.error('Error al obtener los índices:', err);
    process.exit(1); // Cierra el proceso en caso de error
  });
