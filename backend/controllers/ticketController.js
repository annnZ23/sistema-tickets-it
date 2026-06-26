const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { enviarCorreoSoporte } = require('../../src/services/mail.service');

exports.crearTicket = async (req, res) => {
  try {
    const {
      nombre,
      correo,
      tipo,
      prioridad,
      descripcion,
      area,
      origen,
      categoriaId,
      subcategoriaId,
      usuarioId,
      adminIds,
    } = req.body;

    if (!nombre || !correo || !tipo || !prioridad) {
      return res.status(400).json({ error: "nombre, correo, tipo y prioridad son requeridos" });
    }

    if (!Array.isArray(adminIds) || adminIds.length === 0) {
      return res.status(400).json({ error: "Debes asignar al menos un admin de IT (adminIds)" });
    }

    let fechaLimite = null;
    const slaConfig = await prisma.sLA.findUnique({ where: { prioridad } });
    if (slaConfig) {
      fechaLimite = new Date(Date.now() + slaConfig.horasRespuesta * 60 * 60 * 1000);
    }

    const nuevoTicket = await prisma.ticket.create({
      data: {
        nombre,
        correo,
        tipo,
        prioridad,
        descripcion,
        area,
        origen: origen || "WEB",
        categoriaId: categoriaId || null,
        subcategoriaId: subcategoriaId || null,
        usuarioId: usuarioId || null,
        fechaLimite,
        asignados: {
          create: adminIds.map((adminId) => ({ adminId })),
        },
      },
      include: {
        asignados: { include: { admin: true } },
        categoria: true,
        subcategoria: true,
      },
    });

    await prisma.movimiento.create({
      data: {
        accion: "CREAR_TICKET",
        entidad: "Ticket",
        entidadId: nuevoTicket.id,
        detalle: `Ticket #${nuevoTicket.id} creado por ${nombre}, asignado a ${nuevoTicket.asignados.length} admin(s)`,
        usuarioId: usuarioId || null,
      },
    });

    const resultadosCorreo = await Promise.allSettled(
      nuevoTicket.asignados.map((asignacion) =>
        enviarCorreoSoporte(
          asignacion.admin.email,
          `Nuevo ticket asignado: #${nuevoTicket.id} - ${tipo}`,
          `Hola ${asignacion.admin.name},\n\n` +
            `Se te ha asignado un nuevo incidente para dar seguimiento:\n\n` +
            `Ticket: #${nuevoTicket.id}\n` +
            `Solicitante: ${nombre} (${correo})\n` +
            `Área: ${area || "No especificada"}\n` +
            `Tipo: ${tipo}\n` +
            `Prioridad: ${prioridad}\n` +
            `Descripción: ${descripcion || "Sin descripción"}\n\n` +
            `Por favor ingresa al sistema para atenderlo.`
        )
      )
    );

    const correosFallidos = resultadosCorreo.filter((r) => r.status === "rejected");

    res.status(201).json({
      ticket: nuevoTicket,
      correosEnviados: resultadosCorreo.length - correosFallidos.length,
      correosFallidos: correosFallidos.length,
    });
  } catch (error) {
    console.error("Error al crear ticket:", error);
    res.status(500).json({ error: "No se pudo crear el ticket" });
  }
};

exports.obtenerTickets = async (req, res) => {
  try {
    const { id: usuarioId, role } = req.usuario;

    const where =
      role === "SUPERADMIN"
        ? {}
        : { asignados: { some: { adminId: usuarioId } } };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        mensajes: true,
        asignados: { include: { admin: { select: { id: true, name: true, email: true } } } },
        usuario: { select: { id: true, name: true, areaEmpresa: true } },
        categoria: true,
        subcategoria: true,
        encuesta: true,
      },
      orderBy: { creadoAt: "desc" },
    });

    res.json(tickets);
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    res.status(500).json({ error: "Error al obtener tickets" });
  }
};

// El asesor declara su propio tiempo estimado al tomar el ticket.
// No reemplaza el SLA general, es un compromiso adicional más corto (o igual).
exports.declararTiempoEstimado = async (req, res) => {
  try {
    const { id } = req.params;
    const { horasEstimadas } = req.body;

    if (!horasEstimadas || horasEstimadas <= 0) {
      return res.status(400).json({ error: "horasEstimadas debe ser un número mayor a 0" });
    }

    const fechaLimiteAsesor = new Date(Date.now() + horasEstimadas * 60 * 60 * 1000);

    const ticketActualizado = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        horasEstimadasAsesor: horasEstimadas,
        fechaLimiteAsesor,
        vistoAt: new Date(),
        estado: "En Proceso",
      },
    });

    await prisma.movimiento.create({
      data: {
        accion: "DECLARAR_TIEMPO_ESTIMADO",
        entidad: "Ticket",
        entidadId: ticketActualizado.id,
        detalle: `Ticket #${ticketActualizado.id}: asesor estimó ${horasEstimadas}h para resolverlo`,
        usuarioId: req.usuario?.id || null,
      },
    });

    res.json(ticketActualizado);
  } catch (error) {
    console.error("Error al declarar tiempo estimado:", error);
    res.status(500).json({ error: "No se pudo declarar el tiempo estimado" });
  }
};

// Actualizar estado del ticket. Al marcarlo "Resuelto", se crea la
// encuesta de satisfacción y se notifica al empleado por correo.
exports.actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const data = { estado };
    if (estado === "Resuelto") {
      data.resueltoAt = new Date();
    }

    const ticketActualizado = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data,
    });

    await prisma.movimiento.create({
      data: {
        accion: estado === "Resuelto" ? "RESOLVER_TICKET" : "ACTUALIZAR_TICKET",
        entidad: "Ticket",
        entidadId: ticketActualizado.id,
        detalle: `Ticket #${ticketActualizado.id} cambió a estado: ${estado}`,
        usuarioId: req.usuario?.id || null,
      },
    });

    if (estado === "Resuelto") {
      // Crea la encuesta (si no existía ya) y envía el correo al empleado.
      const encuestaExistente = await prisma.encuestaSatisfaccion.findUnique({
        where: { ticketId: ticketActualizado.id },
      });

      if (!encuestaExistente) {
        await prisma.encuestaSatisfaccion.create({
          data: { ticketId: ticketActualizado.id },
        });

        const linkEncuesta = `http://localhost:5173/encuesta/${ticketActualizado.id}`;

        try {
          await enviarCorreoSoporte(
            ticketActualizado.correo,
            `Tu ticket #${ticketActualizado.id} fue resuelto`,
            `Hola ${ticketActualizado.nombre},\n\n` +
              `Tu incidente "${ticketActualizado.tipo}" ya fue resuelto.\n\n` +
              `Nos ayudarías mucho calificando el servicio que recibiste:\n` +
              `${linkEncuesta}\n\n` +
              `Gracias por tu paciencia.`
          );
        } catch (err) {
          console.error("No se pudo enviar el correo de encuesta:", err.message);
        }
      }
    }

    res.json(ticketActualizado);
  } catch (error) {
    console.error("Error al actualizar ticket:", error);
    res.status(500).json({ error: "Error al actualizar ticket" });
  }
};

// El empleado responde la encuesta (sin necesidad de login, viene del correo).
exports.responderEncuesta = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { calificacion, comentario } = req.body;

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: "calificacion debe ser un número entre 1 y 5" });
    }

    const encuesta = await prisma.encuestaSatisfaccion.findUnique({
      where: { ticketId: parseInt(ticketId) },
    });

    if (!encuesta) {
      return res.status(404).json({ error: "No existe una encuesta para este ticket" });
    }

    if (encuesta.estado === "Respondida") {
      return res.status(400).json({ error: "Esta encuesta ya fue respondida anteriormente" });
    }

    if (encuesta.estado === "SinRespuesta") {
      return res.status(400).json({ error: "El plazo para responder esta encuesta ya venció" });
    }

    const encuestaActualizada = await prisma.encuestaSatisfaccion.update({
      where: { ticketId: parseInt(ticketId) },
      data: {
        calificacion,
        comentario: comentario || null,
        estado: "Respondida",
        respondidaAt: new Date(),
      },
    });

    res.json(encuestaActualizada);
  } catch (error) {
    console.error("Error al responder la encuesta:", error);
    res.status(500).json({ error: "No se pudo registrar la encuesta" });
  }
};