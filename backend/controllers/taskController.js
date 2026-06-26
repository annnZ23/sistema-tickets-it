const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { enviarCorreoSoporte } = require("../../src/services/mail.service");

// Listar tareas. Si quien pregunta es ADMIN, solo ve las suyas.
// Si es SUPERADMIN, ve todas (para poder darle seguimiento al equipo).
async function getTasks(req, res) {
  try {
    const { id: usuarioId, role } = req.usuario;

    const where = role === "SUPERADMIN" ? {} : { encargadoId: usuarioId };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        area: true,
        encargado: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    return res.status(500).json({ error: "Error al obtener las tareas" });
  }
}

// Crear una tarea nueva. Solo el SUPERADMIN debería poder llamar esto
// (la ruta ya lo protege con permitirRoles).
async function createTask(req, res) {
  try {
    const { titulo, descripcion, encargadoId, areaId, prioridad, vence } = req.body;

    if (!titulo || !encargadoId || !areaId || !prioridad || !vence) {
      return res.status(400).json({ error: "titulo, encargadoId, areaId, prioridad y vence son obligatorios" });
    }

    const nuevaTask = await prisma.task.create({
      data: {
        titulo,
        descripcion,
        encargadoId,
        areaId,
        prioridad,
        vence: new Date(vence),
      },
      include: {
        encargado: true,
        area: true,
      },
    });

    await prisma.movimiento.create({
      data: {
        accion: "CREAR_TASK",
        entidad: "Task",
        entidadId: nuevaTask.id,
        detalle: `Task "${titulo}" asignada a ${nuevaTask.encargado?.name}`,
        usuarioId: req.usuario?.id || null,
      },
    });

    // Notifica al asesor por correo, igual que con los tickets.
    if (nuevaTask.encargado?.email) {
      try {
        await enviarCorreoSoporte(
          nuevaTask.encargado.email,
          `Nueva tarea asignada: ${titulo}`,
          `Hola ${nuevaTask.encargado.name},\n\n` +
            `Se te ha asignado una nueva tarea interna:\n\n` +
            `Tarea: ${titulo}\n` +
            `Área: ${nuevaTask.area?.nombre || "—"}\n` +
            `Prioridad: ${prioridad}\n` +
            `Vence: ${new Date(vence).toLocaleString()}\n` +
            `Descripción: ${descripcion || "Sin descripción"}\n\n` +
            `Puedes verla y darle seguimiento en el sistema, en "Asignación Tareas IT".`
        );
      } catch (err) {
        console.error("No se pudo enviar el correo de la tarea:", err.message);
      }
    }

    return res.status(201).json(nuevaTask);
  } catch (error) {
    console.error("Error al registrar la tarea:", error);
    return res.status(500).json({ error: "Error al registrar la tarea" });
  }
}

// El asesor actualiza el estado de su tarea (Pendiente -> En Proceso -> Completada).
// Al completarla, se registra cuándo terminó realmente, para comparar contra "vence".
async function actualizarEstadoTask(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const data = { estado };
    if (estado === "Completada") {
      data.completadaAt = new Date();
    }

    const taskActualizada = await prisma.task.update({
      where: { id: parseInt(id) },
      data,
    });

    await prisma.movimiento.create({
      data: {
        accion: "ACTUALIZAR_TASK",
        entidad: "Task",
        entidadId: taskActualizada.id,
        detalle: `Task #${taskActualizada.id} cambió a estado: ${estado}`,
        usuarioId: req.usuario?.id || null,
      },
    });

    return res.json(taskActualizada);
  } catch (error) {
    console.error("Error al actualizar la tarea:", error);
    return res.status(500).json({ error: "Error al actualizar la tarea" });
  }
}

module.exports = {
  getTasks,
  createTask,
  actualizarEstadoTask,
};