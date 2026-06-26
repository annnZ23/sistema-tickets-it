const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { enviarCorreoSoporte } = require("./mail.service");

const HORA_EN_MS = 60 * 60 * 1000;

async function revisarEncuestasPendientes() {
  console.log(`[cron] Revisando encuestas pendientes (${new Date().toLocaleString()})`);

  try {
    const encuestasPendientes = await prisma.encuestaSatisfaccion.findMany({
      where: { estado: "Pendiente" },
      include: { ticket: true },
    });

    for (const encuesta of encuestasPendientes) {
      const horasTranscurridas = (Date.now() - new Date(encuesta.enviadaAt).getTime()) / HORA_EN_MS;

      if (horasTranscurridas >= 48) {
        await prisma.encuestaSatisfaccion.update({
          where: { id: encuesta.id },
          data: { estado: "SinRespuesta" },
        });
        console.log(`[cron] Encuesta del ticket #${encuesta.ticketId} marcada como SinRespuesta`);
        continue;
      }

      if (horasTranscurridas >= 24 && !encuesta.recordatorioEnviado) {
        const linkEncuesta = `http://localhost:5173/encuesta/${encuesta.ticketId}`;

        try {
          await enviarCorreoSoporte(
            encuesta.ticket.correo,
            `Recordatorio: califica tu ticket #${encuesta.ticketId}`,
            `Hola ${encuesta.ticket.nombre},\n\n` +
              `Hace un día resolvimos tu incidente "${encuesta.ticket.tipo}" y nos encantaría conocer tu opinión.\n\n` +
              `Califica el servicio aquí:\n${linkEncuesta}\n\n` +
              `Este es el único recordatorio que enviaremos.\n\n` +
              `Gracias por tu tiempo.`
          );

          await prisma.encuestaSatisfaccion.update({
            where: { id: encuesta.id },
            data: { recordatorioEnviado: true },
          });

          console.log(`[cron] Recordatorio enviado para el ticket #${encuesta.ticketId}`);
        } catch (err) {
          console.error(`[cron] No se pudo enviar el recordatorio del ticket #${encuesta.ticketId}:`, err.message);
        }
      }
    }
  } catch (error) {
    console.error("[cron] Error al revisar encuestas pendientes:", error);
  }
}

function iniciarCronEncuestas() {
  cron.schedule("0 * * * *", revisarEncuestasPendientes);
  console.log("Cron de encuestas pendientes programado (cada hora).");
}

module.exports = { iniciarCronEncuestas, revisarEncuestasPendientes };