const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendPasswordResetEmail = async (toEmail) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: 'Recuperación de Contraseña - Constructor App',
      html: `
        <h1>Recuperación de Contraseña</h1>
        <p>Has solicitado recuperar tu contraseña.</p>
        <p>Por favor, haz clic en el siguiente enlace para restablecerla:</p>
        <a href="http://localhost:5173/reset-password?token=123">Restablecer Contraseña</a>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.response);
    return true;
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
};

module.exports = { sendPasswordResetEmail };