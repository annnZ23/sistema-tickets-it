const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const omitirPassword = (user) => {
  const { password, ...resto } = user;
  return resto;
};

exports.obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.user.findMany({
      include: { area: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(usuarios.map(omitirPassword));
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

exports.obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { area: true },
    });
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(omitirPassword(usuario));
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error al obtener usuario" });
  }
};

exports.crearUsuario = async (req, res) => {
  try {
    const { username, name, email, password, role, areaId, areaEmpresa } = req.body;

    if (!username || !name || !email || !password || !role) {
      return res.status(400).json({
        message: "username, name, email, password y role son requeridos",
      });
    }

    if (!["SUPERADMIN", "ADMIN", "USER"].includes(role)) {
      return res.status(400).json({ message: "role inválido" });
    }

    if ((role === "SUPERADMIN" || role === "ADMIN") && !areaId) {
      return res.status(400).json({
        message: "areaId es requerido para SUPERADMIN/ADMIN",
      });
    }
    if (role === "USER" && !areaEmpresa) {
      return res.status(400).json({
        message: "areaEmpresa es requerido para USER",
      });
    }

    const existeUsername = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
    if (existeUsername) {
      return res.status(409).json({ message: "Ese username ya está en uso" });
    }
    const existeEmail = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existeEmail) {
      return res.status(409).json({ message: "Ese correo ya está en uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        name,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        areaId: role === "USER" ? null : Number(areaId),
        areaEmpresa: role === "USER" ? areaEmpresa : null,
      },
      include: { area: true },
    });

    await prisma.movimiento.create({
      data: {
        accion: "crear_usuario",
        entidad: "User",
        entidadId: nuevoUsuario.id,
        detalle: `Usuario ${nuevoUsuario.username} (${nuevoUsuario.role}) creado`,
        usuarioId: req.user?.id || null,
      },
    });

    res.status(201).json({
      message: "Usuario creado correctamente",
      user: omitirPassword(nuevoUsuario),
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ message: "Error al crear usuario" });
  }
};

exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, areaId, areaEmpresa, activo, password } = req.body;

    const datosActualizar = {};
    if (name !== undefined) datosActualizar.name = name;
    if (email !== undefined) datosActualizar.email = email.trim().toLowerCase();
    if (role !== undefined) datosActualizar.role = role;
    if (areaId !== undefined) datosActualizar.areaId = areaId ? Number(areaId) : null;
    if (areaEmpresa !== undefined) datosActualizar.areaEmpresa = areaEmpresa;
    if (activo !== undefined) datosActualizar.activo = activo;
    if (password) {
      datosActualizar.password = await bcrypt.hash(password, 10);
    }

    const usuarioActualizado = await prisma.user.update({
      where: { id: Number(id) },
      data: datosActualizar,
      include: { area: true },
    });

    await prisma.movimiento.create({
      data: {
        accion: "actualizar_usuario",
        entidad: "User",
        entidadId: usuarioActualizado.id,
        detalle: `Usuario ${usuarioActualizado.username} actualizado`,
        usuarioId: req.user?.id || null,
      },
    });

    res.json({
      message: "Usuario actualizado correctamente",
      user: omitirPassword(usuarioActualizado),
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user?.id === Number(id)) {
      return res.status(400).json({ message: "No puedes eliminar tu propio usuario" });
    }

    const usuario = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    await prisma.user.delete({ where: { id: Number(id) } });

    await prisma.movimiento.create({
      data: {
        accion: "eliminar_usuario",
        entidad: "User",
        entidadId: Number(id),
        detalle: `Usuario ${usuario.username} eliminado`,
        usuarioId: req.user?.id || null,
      },
    });

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    if (error.code === "P2003") {
      return res.status(409).json({
        message: "No se puede eliminar: el usuario tiene tickets, tareas u otros registros asociados",
      });
    }
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};