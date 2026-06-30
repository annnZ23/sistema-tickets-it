const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
exports.obtenerNotificaciones = async (req, res) => {
  try {
    const { id: usuarioId, role } = req.usuario;
    const filtroAsignado =
      role === "SUPERADMIN"
        ? {}
        : { asignados: { some: { adminId: usuarioId } } };

    const ahora = new Date();
    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const encuestasRespondidas = await prisma.encuestaSatisfaccion.findMany({
      where: {
        estado: "Respondida",
        respondidaAt: { gte: hace7Dias },
        ticket: filtroAsignado,
      },
      include: {
        ticket: { select: { id: true, nombre: true, tipo: true } },
      },
      orderBy: { respondidaAt: "desc" },
      take: 10,
    });

    const ticketsEnRiesgo = await prisma.ticket.findMany({
      where: {
        ...filtroAsignado,
        estado: { not: "Resuelto" },
        fechaLimite: { lt: ahora },
      },
      select: { id: true, nombre: true, tipo: true, prioridad: true, fechaLimite: true },
      orderBy: { fechaLimite: "asc" },
      take: 10,
    });

    const ticketsNuevos = await prisma.ticket.findMany({
      where: {
        ...filtroAsignado,
        creadoAt: { gte: hace24h },
      },
      select: { id: true, nombre: true, tipo: true, prioridad: true, creadoAt: true },
      orderBy: { creadoAt: "desc" },
      take: 10,
    });

    const totalPendientes = await prisma.ticket.count({
      where: {
        ...filtroAsignado,
        estado: { not: "Resuelto" },
      },
    });

    const notificaciones = [];

    ticketsEnRiesgo.forEach((t) => {
      notificaciones.push({
        tipo: "riesgo",
        titulo: `Ticket #TK-${t.id} en riesgo`,
        detalle: `${t.tipo} — ${t.prioridad} — venció ${new Date(t.fechaLimite).toLocaleString("es-HN")}`,
        ticketId: t.id,
        leido: false,
      });
    });

    encuestasRespondidas.forEach((e) => {
      notificaciones.push({
        tipo: "encuesta",
        titulo: `Encuesta respondida — Ticket #TK-${e.ticketId}`,
        detalle: `${e.ticket?.nombre || ""} respondió la encuesta de satisfacción${e.calificacion ? ` (${e.calificacion} ★)` : ""}`,
        ticketId: e.ticketId,
        leido: false,
      });
    });

    ticketsNuevos.forEach((t) => {
      notificaciones.push({
        tipo: "nuevo",
        titulo: `Nuevo ticket #TK-${t.id}`,
        detalle: `${t.tipo} — ${t.prioridad} — creado ${new Date(t.creadoAt).toLocaleString("es-HN")}`,
        ticketId: t.id,
        leido: false,
      });
    });

    res.json({
      notificaciones,
      totalPendientes,
      total: notificaciones.length,
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

exports.obtenerCorreosRecientes = async (req, res) => {
  try {
    const { id: usuarioId, role } = req.usuario;

    const filtroAsignado =
      role === "SUPERADMIN"
        ? {}
        : { asignados: { some: { adminId: usuarioId } } };

    const tickets = await prisma.ticket.findMany({
      where: filtroAsignado,
      select: {
        id: true,
        nombre: true,
        correo: true,
        tipo: true,
        prioridad: true,
        estado: true,
        creadoAt: true,
        area: true,
      },
      orderBy: { creadoAt: "desc" },
      take: 8,
    });

    res.json(tickets);
  } catch (error) {
    console.error("Error al obtener correos:", error);
    res.status(500).json({ message: "Error al obtener correos recientes" });
  }
};