const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const upload = require('../config/multerConfig'); // Multer para manejar la carga de archivos
const cloudinary = require('../config/cloudinary'); // Configuración de Cloudinary

const router = express.Router();

// Actualizar perfil de usuario
router.put('/update', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('--- Iniciando solicitud de actualización de perfil ---');
    
    const { username, email, phone, city, password, newPassword } = req.body;
    console.log('Datos recibidos:', { username, email, phone, city, password, newPassword });

    // Obtener el ID del usuario autenticado desde req.user
    const userId = req.user.userId;
    console.log('ID del usuario autenticado:', userId);
    
    // Buscar y actualizar el usuario en la base de datos
    const user = await User.findByPk(userId);
    if (!user) {
        console.log('Usuario no encontrado con ID:', userId);
        return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Mostrar datos actuales del usuario
    console.log('Datos actuales del usuario:', {
        username: user.username,
        email: user.email,
        phone: user.phone,
        city: user.city,
        password: user.password,
    });
    
    // Si se proporciona una contraseña actual, valida y actualiza la contraseña
    if (password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña actual incorrecta.' });
        }
        
        // Si se proporciona una nueva contraseña, encripta y actualiza la contraseña
        if (newPassword) {
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedNewPassword;
        }
    }

    // Actualizar los demás campos del perfil
    user.username = username || user.username;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.city = city || user.city;

    // Subir la foto de perfil a Cloudinary si se ha cargado una nueva
    if (req.file) {
      console.log('Subiendo imagen a Cloudinary...');
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'profile_photos', // Carpeta en Cloudinary donde se guardarán las imágenes
          transformation: [{ width: 300, height: 300, crop: 'fill' }] // Opcional: transformar la imagen
        });
        user.profilePhoto = result.secure_url; // Guardar la URL segura de la imagen en el usuario
        console.log('Imagen subida a Cloudinary:', result.secure_url);
      } catch (cloudinaryError) {
        console.error('Error al subir la imagen a Cloudinary:', cloudinaryError);
        return res.status(500).json({ error: 'Error al subir la imagen' });
      }
    }

    // Guardar los cambios
    await user.save();
    
    console.log('Perfil actualizado exitosamente:', user);
    
    // Responder con los datos actualizados del usuario
    res.json({
        message: 'Perfil actualizado exitosamente',
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            city: user.city,
            profilePhoto: user.profilePhoto // Añadir la URL de la foto de perfil
        },
    });
  } catch (error) {
    console.error('Error actualizando el perfil:', error);
    res.status(500).json({ error: 'Error actualizando el perfil' });
  }
});

module.exports = router;
