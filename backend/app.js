const express = require("express");
const cors = require("cors");
const path = require("path");
const { PrismaClient } = require("@prisma/client"); 
require("dotenv").config();

const prisma = new PrismaClient(); 
const app = express();
const PORT = 3000;
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

/* ========= LOGIN ========= */
app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body;
  try {
    // Ajustado a prisma.user (singular según tu schema)
    const user = await prisma.user.findFirst({
      where: { username: usuario, password: password }
    });

    if (user) return res.json({ ok: true, user });
    res.json({ ok: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

/* ========= CHAT E IA ========= */
app.post("/api/chat", async (req, res) => {
  const { mensaje, usuario, crearTicket } = req.body;
  try {
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres BaproChat." },
        { role: "user", content: mensaje }
      ]
    });

    const respuestaIA = aiResponse.choices[0].message.content;

    if (crearTicket) {
      // Ajustado a prisma.ticket
      const ticket = await prisma.ticket.create({
        data: {
          nombre: mensaje,
          correo: usuario?.correo || "sin correo",
          estado: "Pendiente",
          tipo: "consulta", // Añadido campo requerido por tu schema
          prioridad: "baja" // Añadido campo requerido por tu schema
        }
      });
      return res.json({ message: "✅ Ticket generado.", ticket });
    }

    res.json({ message: respuestaIA, necesitaConfirmacion: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error con la IA" });
  }
});

/* ========= TICKETS ========= */
app.post("/api/tickets", async (req, res) => {
  const { nombre, correo } = req.body;
  try {
    const ticket = await prisma.ticket.create({
      data: { 
        nombre: nombre, 
        correo: correo, 
        estado: "Pendiente",
        tipo: "general",
        prioridad: "normal"
      }
    });
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear ticket" });
  }
});

app.get("/api/tickets", async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany();
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener tickets" });
  }
});

app.use(express.static(path.join(__dirname, "../tickets-frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../tickets-frontend/dist/index.html"));
});

app.listen(PORT, () => console.log(`🚀 Servidor activo en http://localhost:${PORT}`));