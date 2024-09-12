// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Middleware para autenticar y verificar el token JWT
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Obtener el token del encabezado de autorización

  if (!token) {
    console.log('Token no proporcionado');
    return res.status(403).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Invalid or Expired Token:', err);
      return res.status(403).json({ message: 'Invalid or Expired Token' });
    }
    
    // Asegúrate de que `decoded` contenga `userId` o ajusta según el contenido
    if (!decoded || !decoded.userId) {
      console.log('Decoded token does not contain userId:', decoded);
      return res.status(403).json({ message: 'Invalid token structure' });
    }

    console.log('Decoded User:', decoded);
    req.user = { userId: decoded.userId }; // Ajusta esto según los campos que tengas en el payload
    next();
  });
};
