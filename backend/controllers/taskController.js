// backend/controllers/taskController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Obtener todas las tareas (Para el Administrador) u obtener filtradas si es Asesor
exports.getTasks = async (req, res) => {
  try {
    const { email, role } = req.query;

    let tasks;
    // Si es un asesor normal, solo traemos las tareas donde coincida su correo
    if (role === "USER" && email) {
      tasks = await prisma.task.findMany({
        where: { correo: email },
        orderBy: { createdAt: "desc" }
      });
    } else {
      // Si es ADMIN, trae absolutamente todo
      tasks = await prisma.task.findMany({
        orderBy: { createdAt: "desc" }
      });
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las tareas" });
  }
};

// Crear una nueva tarea (Exclusivo del Admin)
exports.createTask = async (req, res) => {
  try {
    const { titulo, encargado, correo, area, prioridad, vence } = req.body;

    if (!titulo || !encargado || !correo || !area || !prioridad || !vence) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const newTask = await prisma.task.create({
      data: { titulo, encargado, correo, area, prioridad, vence }
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar la tarea" });
  }
};