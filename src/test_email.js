const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { enviarCorreoSoporte } = require("./services/mail.service");

async function probarCorreo() {
  try {
    console.log("Intentando enviar correo de prueba...");

    const correoDestino = process.argv[2]; // pasamos el correo como argumento

    if (!correoDestino) {
      console.error("Uso: node test_email.js destinatario@correo.com");
      process.exit(1);
    }

    await enviarCorreoSoporte(
      correoDestino,
      "Prueba de configuración SMTP",
      "Si recibes este correo, la configuración de nodemailer con Office 365 está funcionando correctamente."
    );

    console.log(`Correo enviado correctamente a ${correoDestino}`);
  } catch (error) {
    console.error("Error al enviar el correo:", error.message);
    console.error(error);
  }
}
probarCorreo();