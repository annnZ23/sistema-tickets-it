// api-prisma-express/backend/controllers/reportController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function obtenerEstadisticasAdmin(req, res) {
  try {
    // Agrupación por tipo de incidente para tus métricas en Baprosa
    const porArea = await prisma.ticket.groupBy({
      by: ['tipo'], 
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // Contador de tickets generados desde BaproChat
    const ticketsBaproChat = await prisma.ticket.count({
      where: { correo: "baprochat@baprosa.com" } 
    });

    res.json({ 
      porArea, 
      porUsuario: [], 
      ticketsBaproChat, 
      problemasFrecuentes: [] 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function exportarExcelFiltros(req, res) {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { id: "desc" }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Exportación en formato CommonJS para tu index.js
module.exports = {
  obtenerEstadisticasAdmin,
  exportarExcelFiltros
};