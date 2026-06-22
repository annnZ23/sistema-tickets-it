const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function obtenerEstadisticasAdmin(req, res) {
  try {
    const totalTickets = await prisma.ticket.count();
    const enProceso = await prisma.ticket.count({ where: { estado: "Creado" } });
    const resueltos = await prisma.ticket.count({ where: { estado: "Resuelto" } });
    const porArea = await prisma.ticket.groupBy({
      by: ['tipo'], 
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    const ticketsBaproChat = await prisma.ticket.count({
      where: { correo: "baprochat@baprosa.com" } 
    });

    res.json({ 
      totalTickets,
      enProceso,
      resueltos,
      porArea, 
      ticketsBaproChat,
      kpiVariaciones: {
        total: "+12%",
        proceso: "5 hoy",
        resueltos: "95%",
        satisfaccion: "Promedio"
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}


async function obtenerHistorialFinalizados(req, res) {
  try {
    const finalizados = await prisma.ticket.findMany({
      where: { estado: "Resuelto" },
      orderBy: { id: "desc" }
    });
    res.json(finalizados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function exportarExcelFiltros(req, res) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { estado: "Resuelto" },
      orderBy: { id: "desc" }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  obtenerEstadisticasAdmin,
  obtenerHistorialFinalizados,
  exportarExcelFiltros
};