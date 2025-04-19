const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { prisma } = require('../config/db');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // Añadir para ver logs detallados
  logger: true // Añadir para ver logs detallados
});

// Función para probar la conexión del email
const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Conexión SMTP establecida correctamente');
    console.log('📧 Usando cuenta:', process.env.EMAIL_USER);
    return true;
  } catch (error) {
    console.error('❌ Error en la conexión SMTP:', error);
    console.error('🔑 Revisa las credenciales en .env:', {
      user: process.env.EMAIL_USER,
      passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
    });
    return false;
  }
};

const sendPasswordResetEmail = async (toEmail) => {
  try {
    console.log('🚀 Iniciando envío de correo a:', toEmail);
    
    // Verificar la conexión antes de enviar
    const isConnected = await testEmailConnection();
    if (!isConnected) {
      throw new Error('No se pudo establecer conexión con el servidor de correo');
    }

    console.log('✅ Conexión verificada, generando token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    console.log('💾 Actualizando usuario en la base de datos...');
    await prisma.user.update({
      where: { email: toEmail },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log('🔗 URL de recuperación generada:', resetUrl);

    const mailOptions = {
      from: `"Constructor App" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Recuperación de Contraseña - Constructor App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #0066cc;">Recuperación de Contraseña</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #dee2e6; border-radius: 4px; margin-top: 20px;">
            <p>Has solicitado recuperar tu contraseña.</p>
            <p>Haz clic en el siguiente botón para restablecerla:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #0066cc; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Restablecer Contraseña
              </a>
            </div>
            <p style="color: #6c757d; font-size: 14px;">
              Este enlace expirará en 1 hora por seguridad.<br>
              Si no solicitaste este cambio, puedes ignorar este correo.
            </p>
          </div>
        </div>
      `
    };

    console.log('📨 Enviando correo...');
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email enviado:', info.messageId);
    console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return { success: true };

  } catch (error) {
    console.error('❌ Error en sendPasswordResetEmail:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  testEmailConnection
};