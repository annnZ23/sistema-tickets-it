const { PrismaClient } = require("@prisma/client");
const ExcelJS = require("exceljs");
const prisma = new PrismaClient();

async function obtenerEstadisticasAdmin(req, res) {
  try {
    const totalTickets = await prisma.ticket.count();
    const enProceso = await prisma.ticket.count({ where: { estado: "En Proceso" } });
    const resueltos = await prisma.ticket.count({ where: { estado: "Resuelto" } });

    const porCategoria = await prisma.ticket.groupBy({
      by: ["tipo"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const ticketsPorOrigen = await prisma.ticket.groupBy({
      by: ["origen"],
      _count: { id: true },
    });

    const encuestasRespondidas = await prisma.encuestaSatisfaccion.findMany({
      where: { estado: "Respondida" },
      select: { calificacion: true },
    });
    const promedioSatisfaccion =
      encuestasRespondidas.length > 0
        ? (
            encuestasRespondidas.reduce((acc, e) => acc + e.calificacion, 0) /
            encuestasRespondidas.length
          ).toFixed(1)
        : null;

    res.json({
      totalTickets,
      enProceso,
      resueltos,
      porCategoria,
      ticketsPorOrigen,
      promedioSatisfaccion,
      totalEncuestasRespondidas: encuestasRespondidas.length,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: error.message });
  }
}

async function obtenerHistorialFinalizados(req, res) {
  try {
    const finalizados = await prisma.ticket.findMany({
      where: { estado: "Resuelto" },
      include: {
        asignados: { include: { admin: { select: { name: true } } } },
        encuesta: true,
      },
      orderBy: { resueltoAt: "desc" },
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
      include: {
        asignados: { include: { admin: { select: { name: true } } } },
        encuesta: true,
      },
      orderBy: { resueltoAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema IT Baprosa";
    workbook.created = new Date();

    const hoja = workbook.addWorksheet("Tickets Resueltos");

    hoja.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Solicitante", key: "nombre", width: 24 },
      { header: "Correo", key: "correo", width: 28 },
      { header: "Tipo", key: "tipo", width: 16 },
      { header: "Prioridad", key: "prioridad", width: 12 },
      { header: "Área", key: "area", width: 16 },
      { header: "Origen", key: "origen", width: 12 },
      { header: "Asesor(es)", key: "asesores", width: 24 },
      { header: "Creado", key: "creadoAt", width: 20 },
      { header: "Resuelto", key: "resueltoAt", width: 20 },
      { header: "Calificación", key: "calificacion", width: 14 },
      { header: "Comentario", key: "comentario", width: 30 },
    ];

    hoja.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFF7F22" },
    };
    hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    tickets.forEach((t) => {
      hoja.addRow({
        id: t.id,
        nombre: t.nombre,
        correo: t.correo,
        tipo: t.tipo,
        prioridad: t.prioridad,
        area: t.area || "—",
        origen: t.origen,
        asesores: t.asignados.map((a) => a.admin?.name).filter(Boolean).join(", "),
        creadoAt: new Date(t.creadoAt).toLocaleString(),
        resueltoAt: t.resueltoAt ? new Date(t.resueltoAt).toLocaleString() : "—",
        calificacion: t.encuesta?.calificacion ?? "Sin respuesta",
        comentario: t.encuesta?.comentario || "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Reporte_Baprosa_Tickets_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error al exportar Excel:", error);
    res.status(500).json({ error: "No se pudo generar el archivo Excel" });
  }
}

module.exports = {
  obtenerEstadisticasAdmin,
  obtenerHistorialFinalizados,
  exportarExcelFiltros,
};