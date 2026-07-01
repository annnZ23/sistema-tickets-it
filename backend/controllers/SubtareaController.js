const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { enviarCorreoSoporte } = require("../../src/services/mail.service");

let _io = null;
exports.setIo = (io) => { _io = io; };

// GET /api/subtareas?areaId=X
exports.obtenerSubTareas = async (req, res) => {
  try {
    const { areaId } = req.query;
    const where = areaId ? { areaId: Number(areaId) } : {};
    const subTareas = await prisma.subTarea.findMany({
      where,
      include: {
        asignador: { select: { id: true, name: true, email: true } },
        receptor:  { select: { id: true, name: true, email: true } },
        area:      { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(subTareas);
  } catch (error) {
    console.error("Error al obtener sub-tareas:", error);
    res.status(500).json({ message: "Error al obtener sub-tareas" });
  }
};

// POST /api/subtareas — crear sub-tarea + correo + socket
exports.crearSubTarea = async (req, res) => {
  try {
    const { titulo, descripcion, receptorId, areaId, fechaLimite } = req.body;
    const asignadorId = req.usuario.id;

    if (!titulo || !receptorId) {
      return res.status(400).json({ message: "titulo y receptorId son requeridos" });
    }

    const data = {
      titulo,
      descripcion: descripcion || null,
      asignadorId,
      receptorId:  Number(receptorId),
      areaId:      areaId ? Number(areaId) : null,
      fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
    };

    if (req.file) {
      data.archivoUrl    = `/uploads/${req.file.filename}`;
      data.archivoNombre = req.file.originalname;
      data.archivoTipo   = req.file.mimetype;
    }

    const subTarea = await prisma.subTarea.create({
      data,
      include: {
        asignador: { select: { id: true, name: true, email: true } },
        receptor:  { select: { id: true, name: true, email: true } },
        area:      { select: { id: true, nombre: true } },
      },
    });

    await prisma.movimiento.create({
      data: {
        accion:    "crear_subtarea",
        entidad:   "SubTarea",
        entidadId: subTarea.id,
        detalle:   `Sub-tarea "${titulo}" asignada a ${subTarea.receptor.name}`,
        usuarioId: asignadorId,
      },
    });

    // 1. Correo al receptor
    const fechaTexto = fechaLimite
      ? new Date(fechaLimite).toLocaleString("es-HN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "Sin fecha limite";

    try {
      await enviarCorreoSoporte(
        subTarea.receptor.email,
        `Nueva sub-tarea asignada: "${titulo}"`,
        `Hola ${subTarea.receptor.name},\n\n` +
        `${subTarea.asignador.name} te ha asignado una nueva sub-tarea:\n\n` +
        `Titulo: ${titulo}\n` +
        `Descripcion: ${descripcion || "Sin descripcion"}\n` +
        `Area: ${subTarea.area?.nombre || "General"}\n` +
        `Fecha limite: ${fechaTexto}\n` +
        `${subTarea.archivoUrl ? `Adjunto: ${subTarea.archivoNombre}\n` : ""}` +
        `\nInicia sesion en la plataforma para ver los detalles.\n\nBaprosa IT`
      );
    } catch (mailErr) {
      console.error("Error correo sub-tarea:", mailErr.message);
    }

    // 2. Socket al receptor
    if (_io) {
      _io.to(`usuario_${subTarea.receptorId}`).emit("nueva_subtarea", {
        tipo:        "subtarea",
        titulo:      `Nueva sub-tarea de ${subTarea.asignador.name}`,
        detalle:     titulo,
        subTareaId:  subTarea.id,
        asignador:   subTarea.asignador.name,
        fechaLimite: fechaLimite || null,
      });
    }

    res.status(201).json(subTarea);
  } catch (error) {
    console.error("Error al crear sub-tarea:", error);
    res.status(500).json({ message: "Error al crear sub-tarea" });
  }
};

// PUT /api/subtareas/:id — actualizar estado + correo al completar
exports.actualizarSubTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const data = { estado };
    if (estado === "Completada") data.completadaAt = new Date();

    const subTarea = await prisma.subTarea.update({
      where: { id: Number(id) },
      data,
      include: {
        asignador: { select: { id: true, name: true, email: true } },
        receptor:  { select: { id: true, name: true, email: true } },
      },
    });

    // Cuando se completa: correo + socket al asignador
    if (estado === "Completada") {
      try {
        await enviarCorreoSoporte(
          subTarea.asignador.email,
          `Sub-tarea completada: "${subTarea.titulo}"`,
          `Hola ${subTarea.asignador.name},\n\n` +
          `${subTarea.receptor.name} ha completado la sub-tarea que le asignaste:\n\n` +
          `Titulo: ${subTarea.titulo}\n` +
          `Completada el: ${new Date().toLocaleString("es-HN")}\n\n` +
          `Inicia sesion en la plataforma para ver los detalles.\n\nBaprosa IT`
        );
      } catch (mailErr) {
        console.error("Error correo completado:", mailErr.message);
      }

      if (_io) {
        _io.to(`usuario_${subTarea.asignadorId}`).emit("subtarea_completada", {
          tipo:       "subtarea_completada",
          titulo:     `Sub-tarea completada por ${subTarea.receptor.name}`,
          detalle:    subTarea.titulo,
          subTareaId: subTarea.id,
          icono:      "✅",
        });
      }
    }

    res.json(subTarea);
  } catch (error) {
    console.error("Error al actualizar sub-tarea:", error);
    if (error.code === "P2025") return res.status(404).json({ message: "Sub-tarea no encontrada" });
    res.status(500).json({ message: "Error al actualizar sub-tarea" });
  }
};

// POST /api/subtareas/:id/respuesta — receptor devuelve archivo al asignador
exports.responderSubTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Se requiere un archivo para la respuesta" });
    }

    const subTarea = await prisma.subTarea.findUnique({
      where: { id: Number(id) },
      include: {
        asignador: { select: { id: true, name: true, email: true } },
        receptor:  { select: { id: true, name: true, email: true } },
      },
    });

    if (!subTarea) return res.status(404).json({ message: "Sub-tarea no encontrada" });

    // Correo al asignador con el archivo adjunto como referencia
    try {
      await enviarCorreoSoporte(
        subTarea.asignador.email,
        `Respuesta a sub-tarea: "${subTarea.titulo}"`,
        `Hola ${subTarea.asignador.name},\n\n` +
        `${subTarea.receptor.name} ha respondido a la sub-tarea "${subTarea.titulo}".\n\n` +
        `${comentario ? `Comentario: ${comentario}\n\n` : ""}` +
        `Archivo adjunto: ${req.file.originalname}\n` +
        `Puedes descargarlo desde la plataforma en la seccion de Sub-tareas.\n\n` +
        `URL del archivo: http://localhost:3000/uploads/${req.file.filename}\n\n` +
        `Baprosa IT`
      );
    } catch (mailErr) {
      console.error("Error correo respuesta:", mailErr.message);
    }

    // Socket al asignador
    if (_io) {
      _io.to(`usuario_${subTarea.asignadorId}`).emit("nueva_subtarea", {
        tipo:      "respuesta",
        titulo:    `${subTarea.receptor.name} respondio la sub-tarea`,
        detalle:   `"${subTarea.titulo}" — adjunto: ${req.file.originalname}`,
        icono:     "📎",
        color:     "#3b82f6",
      });
    }

    res.json({
      message: "Respuesta enviada correctamente",
      archivoUrl:    `/uploads/${req.file.filename}`,
      archivoNombre: req.file.originalname,
    });
  } catch (error) {
    console.error("Error al responder sub-tarea:", error);
    res.status(500).json({ message: "Error al responder sub-tarea" });
  }
};

// DELETE /api/subtareas/:id
exports.eliminarSubTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: usuarioId, role } = req.usuario;
    const subTarea = await prisma.subTarea.findUnique({ where: { id: Number(id) } });
    if (!subTarea) return res.status(404).json({ message: "Sub-tarea no encontrada" });
    if (subTarea.asignadorId !== usuarioId && role !== "SUPERADMIN") {
      return res.status(403).json({ message: "Solo el asignador o SUPERADMIN puede eliminar" });
    }
    await prisma.subTarea.delete({ where: { id: Number(id) } });
    res.json({ message: "Sub-tarea eliminada" });
  } catch (error) {
    console.error("Error al eliminar sub-tarea:", error);
    res.status(500).json({ message: "Error al eliminar sub-tarea" });
  }
};