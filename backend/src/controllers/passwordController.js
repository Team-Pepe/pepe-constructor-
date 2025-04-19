const { sendPasswordResetEmail } = require('../services/emailService');
const prisma = require('../config/prisma');

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      await sendPasswordResetEmail(email);
    }

    // Siempre devolver el mismo mensaje por seguridad
    res.status(200).json({
      message: "Si el correo existe, recibirás un enlace de recuperación."
    });
  } catch (error) {
    console.error('Error en recuperación:', error);
    res.status(500).json({
      message: "Hubo un problema al procesar tu solicitud."
    });
  }
};