const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { prisma } = require('../config/db');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #333333; padding: 20px; text-align: center;">
            <h1 style="color: #f9a825; margin: 0;">Recuperación de Contraseña</h1>
          </div>
          <div style="padding: 20px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.5;">
              Hola, has solicitado recuperar tu contraseña. Haz clic en el botón de abajo para restablecerla:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #f9a825; color: #ffffff; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: bold;">
                Restablecer Contraseña
              </a>
            </div>
            <p style="color: #666666; font-size: 14px; line-height: 1.5;">
              Este enlace expirará en 1 hora por seguridad.<br>
              Si no solicitaste este cambio, puedes ignorar este correo.
            </p>
            <p style="color: #999999; font-size: 12px; line-height: 1.5; text-align: center; margin-top: 20px;">
              Por favor, no respondas a este correo. Este mensaje fue enviado desde una dirección no monitoreada.
            </p>
          </div>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #999999;">
            <p style="margin: 0;">© 2025 Constructor App. Todos los derechos reservados.</p>
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
    console.error('❌ Error detallado:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  testEmailConnection
};