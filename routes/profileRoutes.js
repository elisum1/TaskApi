const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      console.error('Error: usuario no autenticado correctamente.'); 
      return res.status(400).json({ message: 'Usuario no autenticado correctamente.' });
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.json({
      username: user.username,
      email: user.email,
      phone: user.phone,
      city: user.city,
      profilePhoto: user.profilePhoto 
    });
  } catch (err) {
    console.error('Error al obtener el perfil del usuario:', err);
    res.status(500).json({ message: 'Error al obtener el perfil del usuario.' });
  }
});

module.exports = router;
