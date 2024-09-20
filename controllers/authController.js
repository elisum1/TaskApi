const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { Op } = require('sequelize');
const cloudinary = require('../config/cloudinary');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'tu-correo@gmail.com',
    pass: 'tu-contraseña'
  }
});

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  console.log('Register request received:', { username, email });

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log('Password hashed successfully');

    const newUser = await User.create({ username, email, password: hashedPassword });
    console.log('User registered successfully:', newUser);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request received:', { email });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('Invalid email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);
    res.cookie('token', token, { httpOnly: true });
    console.log('User logged in successfully:', user.id);
    res.status(200).json({ message: 'Logged in successfully', token });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ message: 'Error logging in user' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  console.log('User logged out successfully');
  res.status(200).json({ message: 'Logged out successfully' });
};

exports.updateUser = async (req, res) => {
  try {
    console.log('--- Iniciando actualización de usuario ---');

    if (!req.user || !req.user.userId) {
      console.error('Error: usuario no autenticado correctamente.');
      return res.status(400).json({ message: 'Usuario no autenticado correctamente.' });
    }

    const userId = req.user.userId;
    console.log('Updating user with ID:', userId);

    const { username, email, city, phone, country, password } = req.body;
    console.log('Datos recibidos para actualización:', { username, email, city, phone, country, password });

    const user = await User.findByPk(userId);
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.city = city || user.city;
    user.phone = phone || user.phone;
    user.country = country || user.country;
    if (password) {
      user.password = bcrypt.hashSync(password, 10);
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      user.profilePhoto = result.secure_url; // Guarda la URL del archivo en la base de datos
    }

    await user.save();
    console.log('User updated successfully:', user);
    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        city: user.city,
        country: user.country,
        profilePhoto: user.profilePhoto
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'No se encontró ningún usuario con ese correo electrónico' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 36000000;

    await User.update({ resetToken, resetTokenExpiry }, { where: { id: user.id } });

    const resetUrl = `https://taskapi-7z2t.onrender.com/api/auth/reset-password/${resetToken}`;

    await transporter.sendMail({
      to: email,
      from: 'no-reply@tuapp.com',
      subject: 'Solicitud de recuperación de contraseña',
      html: `<p>Hiciste una solicitud de recuperación de contraseña. Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>
             <p>Si no hiciste esta solicitud, ignora este correo.</p>`
    });

    res.status(200).json({ message: 'Correo de recuperación enviado' });
  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error);
    res.status(500).json({ message: 'Error al solicitar recuperación de contraseña' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    await User.update(
      { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
      { where: { id: user.id } }
    );

    res.status(200).json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
};
