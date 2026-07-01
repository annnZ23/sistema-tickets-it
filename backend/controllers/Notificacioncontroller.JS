const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/notificaciones
// Devuelve alertas reales para el asesor logueado:
// 1. Encuestas respondidas en los últimos 7 días
// 2. Tickets pendientes (no resueltos) asignados al asesor
// 3. Tickets en riesgo (fechaLimite vencida y no resueltos)
// 4. Tickets nuevos creados en las últimas 24h
exports.obtenerNotificaciones = async (req, res) => {
  try {
    const { id: usuarioId, role } = req.usuario;

    // Filtro base: SUPERADMIN ve todo, ADMIN solo los suyos
    const filtroAsignado =
      role === "SUPERADMIN"
        ? {}
        : { asignados: { some: { adminId: usuarioId } } };

    const ahora = new Date();
    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hace24h = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    // 1. Encuestas respondidas recientemente
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

    // 2. Tickets en riesgo (fecha límite vencida, no resueltos)
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

    // 3. Tickets nuevos en las últimas 24h
    const ticketsNuevos = await prisma.ticket.findMany({
      where: {
        ...filtroAsignado,
        creadoAt: { gte: hace24h },
      },
      select: { id: true, nombre: true, tipo: true, prioridad: true, creadoAt: true },
      orderBy: { creadoAt: "desc" },
      take: 10,
    });

    // 4. Tickets pendientes sin resolver (resumen)
    const totalPendientes = await prisma.ticket.count({
      where: {
        ...filtroAsignado,
        estado: { not: "Resuelto" },
      },
    });

    // 5. Sub-tareas pendientes asignadas AL usuario (receptor)
    const subTareasPendientes = await prisma.subTarea.findMany({
      where: {
        receptorId: usuarioId,
        estado: { not: "Completada" },
      },
      include: {
        asignador: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // 6. Sub-tareas vencidas asignadas al usuario
    const subTareasVencidas = subTareasPendientes.filter(
      (st) => st.fechaLimite && new Date(st.fechaLimite) < ahora
    );

    // Construir lista de notificaciones unificada
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

    // Sub-tareas vencidas
    subTareasVencidas.forEach((st) => {
      notificaciones.push({
        tipo: "riesgo",
        titulo: `Sub-tarea vencida: "${st.titulo}"`,
        detalle: `Asignada por ${st.asignador.name} — venció ${new Date(st.fechaLimite).toLocaleString("es-HN")}`,
        leido: false,
      });
    });

    // Sub-tareas pendientes (no vencidas)
    subTareasPendientes
      .filter((st) => !st.fechaLimite || new Date(st.fechaLimite) >= ahora)
      .forEach((st) => {
        notificaciones.push({
          tipo: "subtarea",
          titulo: `Sub-tarea pendiente: "${st.titulo}"`,
          detalle: `Asignada por ${st.asignador.name} — Estado: ${st.estado === "EnProceso" ? "En Proceso" : "Pendiente"}`,
          leido: false,
        });
      });

    res.json({
      notificaciones,
      totalPendientes: totalPendientes + subTareasPendientes.length,
      total: notificaciones.length,
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

// GET /api/notificaciones/correos
// Muestra los últimos tickets creados con info del solicitante (para el icono de correo)
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