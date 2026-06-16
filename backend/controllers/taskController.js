const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Obtener todas las tareas
async function getTasks(req, res) {
  try {
    const { email, role } = req.query;
    let tasks;

    if (role === "USER" && email) {
      tasks = await prisma.task.findMany({
        where: { correo: email },
        orderBy: { createdAt: "desc" }
      });
    } else {
      tasks = await prisma.task.findMany({
        orderBy: { createdAt: "desc" }
      });
    }

    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener las tareas" });
  }
}

// Crear una nueva tarea
async function createTask(req, res) {
  try {
    const { titulo, encargado, correo, area, prioridad, vence } = req.body;

    if (!titulo || !encargado || !correo || !area || !prioridad || !vence) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const newTask = await prisma.task.create({
      data: { titulo, encargado, correo, area, prioridad, vence }
    });

    return res.status(201).json(newTask);
  } catch (error) {
    return res.status(500).json({ error: "Error al registrar la tarea" });
  }
}

// Exportación explícita en formato de objeto asignado
module.exports = {
  getTasks,
  createTask
};