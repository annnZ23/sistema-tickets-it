const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
exports.obtenerAreas = async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      include: {
        usuarios: {
          select: { id: true, name: true, username: true, role: true },
        },
      },
      orderBy: { nombre: "asc" },
    });
    res.json(areas);
  } catch (error) {
    console.error("Error al obtener áreas:", error);
    res.status(500).json({ message: "Error al obtener áreas" });
  }
};
exports.obtenerAreaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await prisma.area.findUnique({
      where: { id: Number(id) },
      include: { usuarios: true },
    });
    if (!area) {
      return res.status(404).json({ message: "Área no encontrada" });
    }
    res.json(area);
  } catch (error) {
    console.error("Error al obtener área:", error);
    res.status(500).json({ message: "Error al obtener área" });
  }
};

exports.crearArea = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre del área es requerido" });
    }

    const existente = await prisma.area.findUnique({ where: { nombre: nombre.trim() } });
    if (existente) {
      return res.status(409).json({ message: "Ya existe un área con ese nombre" });
    }

    const nuevaArea = await prisma.area.create({
      data: { nombre: nombre.trim() },
    });

    await prisma.movimiento.create({
      data: {
        accion: "crear_area",
        entidad: "Area",
        entidadId: nuevaArea.id,
        detalle: `Área "${nuevaArea.nombre}" creada`,
        usuarioId: req.user?.id || null,
      },
    });

    res.status(201).json({
      message: "Área creada correctamente",
      area: nuevaArea,
    });
  } catch (error) {
    console.error("Error al crear área:", error);
    res.status(500).json({ message: "Error al crear área" });
  }
};

exports.actualizarArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: "El nombre del área es requerido" });
    }

    const areaActualizada = await prisma.area.update({
      where: { id: Number(id) },
      data: { nombre: nombre.trim() },
    });

    res.json({
      message: "Área actualizada correctamente",
      area: areaActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar área:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Área no encontrada" });
    }
    res.status(500).json({ message: "Error al actualizar área" });
  }
};

exports.eliminarArea = async (req, res) => {
  try {
    const { id } = req.params;

    const area = await prisma.area.findUnique({ where: { id: Number(id) } });
    if (!area) {
      return res.status(404).json({ message: "Área no encontrada" });
    }

    await prisma.area.delete({ where: { id: Number(id) } });

    await prisma.movimiento.create({
      data: {
        accion: "eliminar_area",
        entidad: "Area",
        entidadId: Number(id),
        detalle: `Área "${area.nombre}" eliminada`,
        usuarioId: req.user?.id || null,
      },
    });

    res.json({ message: "Área eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar área:", error);
    if (error.code === "P2003") {
      return res.status(409).json({
        message: "No se puede eliminar: el área tiene usuarios o tareas asociadas",
      });
    }
    res.status(500).json({ message: "Error al eliminar área" });
  }
};
