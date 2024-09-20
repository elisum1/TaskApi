// routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');
const { Op } = require('sequelize');


const router = express.Router();

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'elias.um94@gmail.com',
    pass: 'gjms nzph mjaq knqw'
  }
});

/// Registro de usuario
router.post('/register', async (req, res) => {
  const { username, email, password, phone, city } = req.body;

  // Validación de campos obligatorios
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Los campos username, email y password son obligatorios' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      phone: phone || null, // Permite phone como null si no está presente
      city: city || null    // Permite city como null si no está presente
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente', user: newUser });
  } catch (error) {
    console.error('Error registrando el usuario:', error);
    res.status(500).json({ error: 'Error registrando el usuario' });
  }
});


// Login de usuario
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Email o contraseña inválidos' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Email o contraseña inválidos' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.json({ message: 'Inicio de sesión exitoso', token, user });
  } catch (error) {
    console.error('Error iniciando sesión:', error);
    res.status(500).json({ error: 'Error iniciando sesión' });
  }
});

// Logout de usuario
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Cierre de sesión exitoso' });
});

// Solicitar recuperación de contraseña
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(resetToken)
    const resetTokenExpiry = Date.now() + 3180000; // 1 hora

    await User.update({ resetToken, resetTokenExpiry }, { where: { id: user.id } });

    const resetUrl = `http://${req.headers.host}/api/auth/reset-password/${resetToken}`;

    await transporter.sendMail({
      to: email,
      from: 'no-reply@tuapp.com',
      subject: 'Solicitud de recuperación de contraseña',
      html: `<p>Hiciste una solicitud de recuperación de contraseña. Haz clic en el siguiente enlace para restablecer tu contraseña:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si no hiciste esta solicitud, ignora este correo.</p>`
    });

    res.status(200).json({ message: 'Correo de recuperación enviado' });
  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error);
    res.status(500).json({ message: 'Error al solicitar recuperación de contraseña' });
  }
});

// Mostrar formulario de restablecimiento de contraseña
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  res.send(`
    <html>
      <head>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #333;
            color: #fff;
            font-family: Arial, sans-serif;
          }
          .container {
            background-color: #444;
            padding: 20px;
            border-radius: 8px;
            width: 300px;
            text-align: center;
          }
          h1 {
            margin-bottom: 20px;
            font-size: 24px;
            color: #f39c12;
          }
          p {
            margin-bottom: 20px;
            font-size: 16px;
          }
          input[type="password"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: none;
            border-radius: 4px;
          }
          button {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 4px;
            background-color: #f39c12;
            color: #fff;
            font-size: 16px;
            cursor: pointer;
          }
          button:hover {
            background-color: #e67e22;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Task Master</h1>
          <p>Recuperación de contraseña</p>
          <form action="/api/auth/reset-password" method="POST">
            <input type="hidden" name="token" value="${token}" />
            <input type="password" name="newPassword" placeholder="Nueva contraseña" required />
            <button type="submit">Restablecer contraseña</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// Restablecer contraseña
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: Date.now() }
      }
    });

    if (!user) return res.status(400).json({ message: 'Token inválido o expirado' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword, resetToken: null, resetTokenExpiry: null }, { where: { id: user.id } });

    res.redirect('https://task-web-brown.vercel.app'); 
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
});

// Actualizar perfil de usuario
router.put('/update', authenticateToken, async (req, res) => {
  const { username, email, phone, city, password, newPassword } = req.body;

  try {
    const userId = req.user.userId;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      
      if (newPassword) {
        user.password = await bcrypt.hash(newPassword, 10);
      }
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.city = city || user.city;

    await user.save();
    res.json({ message: 'Perfil actualizado exitosamente', user });
  } catch (error) {
    console.error('Error actualizando el perfil:', error);
    res.status(500).json({ error: 'Error actualizando el perfil' });
  }
});

module.exports = router;
