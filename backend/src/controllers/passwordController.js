const bcrypt = require('bcrypt');
const { sendPasswordResetEmail } = require('../services/emailService');
const { prisma } = require('../config/db');

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "El correo electrónico es requerido"
    });
  }

  try {
    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      // Limpiar token anterior antes de crear uno nuevo
      await prisma.user.update({
        where: { email },
        data: {
          resetToken: null,
          resetTokenExpiry: null
        }
      });

      await sendPasswordResetEmail(email);
    }

    // Siempre devolver el mismo mensaje por seguridad
    res.status(200).json({
      message: "Si el correo existe, recibirás un enlace de recuperación"
    });

  } catch (error) {
    console.error('Error en recuperación:', error);
    res.status(500).json({
      message: "Hubo un problema al procesar tu solicitud"
    });
  }
};

// Agregar método para verificar token y actualizar contraseña
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      message: "Token y nueva contraseña son requeridos"
    });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        message: "Token inválido o expirado"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    res.status(200).json({
      message: "Contraseña actualizada exitosamente"
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: "Error al actualizar la contraseña"
    });
  }
};