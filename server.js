// server.js
const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const db = require('./config/database');
const cors = require('cors'); // Importar cors
const bodyParser = require('body-parser');

// Cargar las variables de entorno
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const profileRoutes = require('./routes/profileRoutes'); // Importar las rutas de perfil
const { authenticateToken } = require('./middleware/authMiddleware');
const updateRouter = require('./routes/updateRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar CORS
app.use(cors({
  origin: ['https://task-web-brown.vercel.app', 'https://task-web-elisum1s-projects.vercel.app'], // Lista de orígenes permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Si necesitas enviar cookies con las solicitudes
}));

require('./models/User');
require('./models/Task');

// Importar asociaciones
require('./models/associations');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/auth', authenticateToken, updateRouter);
app.use('/api/auth', authenticateToken, taskRoutes);
app.use('/api/auth', authenticateToken, profileRoutes); // Añadir las rutas de perfil

// Sincronizar modelos y crear tablas
db.sync({ alter: true }) // Cambia a 'true' si quieres que las tablas se sobrescriban cada vez que se inicia el servidor
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch((err) => console.error('Error creating database tables:', err));

// Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
