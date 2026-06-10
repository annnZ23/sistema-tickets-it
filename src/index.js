require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

const prisma = require("./lib/prisma");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


app.use(cors());
app.use(express.json());


app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));


function obtenerPrioridad(tipo) {
  switch (tipo) {
    case "Incidente": return "Alta";
    case "Problema": return "Media";
    case "Solicitud de mantenimiento": return "Media";
    case "Solicitud de información": return "Baja";
    default: return "Baja";
  }
}

app.get("/", (req, res) => {
  res.json({ message: "API funcionando" });
});

app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: { email: usuario },
    });

    if (!user) return res.json({ ok: false });

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) return res.json({ ok: false });

    res.json({ ok: true, user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

app.post("/api/tickets", async (req, res) => {
  const { nombre, correo, tipo, descripcion, prioridad } = req.body;

  try {
    const ticket = await prisma.ticket.create({
      data: {
        nombre,
        correo,
        tipo,
        descripcion: descripcion || "",
        prioridad: prioridad || obtenerPrioridad(tipo),
        estado: "Creado"
      },
    });

    res.json(ticket);

  } catch (error) {
    console.error("ERROR REAL:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tickets", async (req, res) => {
  const tickets = await prisma.ticket.findMany({
    orderBy: { id: "desc" },
  });

  res.json(tickets);
});



app.post("/api/messages", async (req, res) => {
  const { texto, ticketId, enviadoPor } = req.body;

  const msg = await prisma.mensaje.create({    // "mensaje" en minúscula
    data: {
      contenido: texto,
      ticketId: Number(ticketId),
      enviadoPor: enviadoPor || "usuario",     // campo requerido en schema
    },
  });

  res.json(msg);
});


// ✅ DESPUÉS
app.get("/api/messages/:id", async (req, res) => {
  const mensajes = await prisma.mensaje.findMany({   // "mensaje" correcto
    where: { ticketId: Number(req.params.id) },
    orderBy: { id: "asc" }
  });

  res.json(mensajes);
});
app.get("/crear-user", async (req, res) => {
  const existing = await prisma.user.findFirst({
    where: { email: "user@gmail.com" }
  });

  if (existing) return res.json(existing);

  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await prisma.user.create({
    data: {
      name: "Usuario",
      email: "user@gmail.com",
      password: hashedPassword,
      role: "USER",
    },
  });

  res.json(user);
});

app.get("/crear-admin", async (req, res) => {

  
  await prisma.user.deleteMany({
    where: { email: "admin@gmail.com" }
  });

  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await prisma.user.create({
    data: {
      name: "Admin IT",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  res.json(user);
});

app.post("/api/chat", async (req, res) => {
  try {
    const mensaje = (req.body.mensaje || "").toLowerCase();

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const result = await model.generateContent(`
Eres un asistente de soporte IT.
Usuario: ${mensaje}
`);

    const response = await result.response;
    res.json({
      message: response.text(),
    });

  } catch (error) {
  console.error("ERROR REAL PRISMA:", error);
  res.status(500).json({ error: error.message });
}
});

app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("DB conectada");
    console.log(`Servidor en http://localhost:${PORT}`);
  } catch (error) {
    console.error("Error DB:", error);
  }
});
