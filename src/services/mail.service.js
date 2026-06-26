const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,       // false para puerto 587 (usa STARTTLS, no SSL directo)
  requireTLS: true,    // exige upgrade a TLS antes de autenticar, requerido por Office 365
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'TLSv1.2', // cifrado moderno, no SSLv3 (obsoleto e inseguro)
  },
});

// Verifica la conexión SMTP al iniciar, para detectar errores de configuración
// (credenciales, host, puerto) ANTES de intentar enviar el primer correo real.
transporter.verify((error, success) => {
  if (error) {
    console.error('Error de conexión con el servidor de correo:', error.message);
  } else {
    console.log('Servidor de correo listo para enviar mensajes.');
  }
});

async function enviarCorreoSoporte(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    text: text,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { enviarCorreoSoporte, transporter };