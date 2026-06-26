const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const ticketId = parseInt(process.argv[2]);
  const horasAtras = parseFloat(process.argv[3]);

  if (!ticketId || !horasAtras) {
    console.error("Uso: node simular_tiempo_encuesta.js <ticketId> <horasAtras>");
    console.error("Ejemplo: node simular_tiempo_encuesta.js 3 25");
    process.exit(1);
  }

  const nuevaFecha = new Date(Date.now() - horasAtras * 60 * 60 * 1000);

  const encuesta = await prisma.encuestaSatisfaccion.update({
    where: { ticketId },
    data: { enviadaAt: nuevaFecha, recordatorioEnviado: false, estado: "Pendiente" },
  });

  console.log(`Encuesta del ticket #${ticketId} ahora simula haberse enviado hace ${horasAtras} horas.`);
  console.log(encuesta);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});