require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcrypt");
const path = require("path");
const multer = require("multer");
const app = express();
const PORT = process.env.PORT || 3000;

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

function obtenerPrioridad(tipo) {
  switch (tipo) {
    case "Incidente": return "Alta";
    case "Problema": return "Media";
    case "Solicitud de mantenimiento": return "Media";
    case "Solicitud de información": return "Baja";
    default: return "Baja";
  }
}



const reportRoutes = require("../backend/routes/reportRoutes");
const taskRoutes = require("../backend/routes/task.routes");

app.use("/api/reportes", reportRoutes);
app.use("/api/tasks", taskRoutes);


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

app.post("/api/tickets", upload.single("file"), async (req, res) => {
  const { nombre, correo, tipo, descripcion, prioridad } = req.body;

  try {
    let fileUrl = null;
    let fileType = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      const mime = req.file.mimetype;
      if (mime.startsWith("image/")) fileType = "image";
      else if (mime.startsWith("audio/")) fileType = "audio";
      else fileType = "document";
    }

    const ticket = await prisma.ticket.create({
      data: {
        nombre,
        correo,
        tipo,
        descripcion: descripcion || "",
        prioridad: prioridad || obtenerPrioridad(tipo),
        estado: "Creado",
      },
    });

    await prisma.mensaje.create({
      data: {
        contenido: descripcion,
        ticketId: ticket.id,
        enviadoPor: "usuario",
        fileUrl: fileUrl,
        fileType: fileType,
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

app.put("/api/tickets/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado, solucion } = req.body;

  try {
    const ticketActual = await prisma.ticket.findUnique({
      where: { id: Number(id) },
    });

    const updatedTicket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        estado,
        descripcion: solucion
          ? `${ticketActual.descripcion}\n\n[SOLUCIÓN TÉCNICA]: ${solucion}`
          : ticketActual.descripcion,
      },
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el flujo del ticket" });
  }
});

app.post("/api/messages", upload.single("file"), async (req, res) => {
  const { texto, ticketId, enviadoPor } = req.body;

  try {
    let fileUrl = null;
    let fileType = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      const mime = req.file.mimetype;

      if (mime.startsWith("image/")) fileType = "image";
      else if (mime.startsWith("audio/")) fileType = "audio";
      else fileType = "document";
    }

    const msg = await prisma.mensaje.create({
      data: {
        contenido: texto || "",
        ticketId: Number(ticketId),
        enviadoPor: enviadoPor || "usuario",
        fileUrl: fileUrl,
        fileType: fileType,
      },
    });

    res.json(msg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/messages/:id", async (req, res) => {
  const mensajes = await prisma.mensaje.findMany({
    where: { ticketId: Number(req.params.id) },
    orderBy: { id: "asc" },
  });

  res.json(mensajes);
});

app.get("/crear-user", async (req, res) => {
  const existing = await prisma.user.findFirst({
    where: { email: "user@gmail.com" },
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
    where: { email: "admin@gmail.com" },
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

app.get("/crear-admin-soporte", async (req, res) => {
  const hashedPassword = await bcrypt.hash("soporte2024", 10);
  const user = await prisma.user.upsert({
    where: { email: "adminsoporte@baprosa.com" },
    update: {},
    create: {
      name: "Admin Soporte",
      email: "adminsoporte@baprosa.com",
      password: hashedPassword,
      role: "ADMIN_SOPORTE",
    },
  });
  res.json(user);
});

app.get("/crear-ana", async (req, res) => {
  await prisma.user.deleteMany({
    where: { email: "a.zepeda@Baprosa.com" },
  });

  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await prisma.user.create({
    data: {
      name: "Ana Zepeda",
      email: "a.zepeda@Baprosa.com",
      password: hashedPassword,
      role: "USER",
    },
  });

  res.json({ message: "Usuario de pruebas 'Ana Zepeda' creado con éxito", user });
});

app.post("/api/chat", async (req, res) => {
  try {
    const mensaje = (req.body.mensaje || "").toLowerCase();

    if (
      mensaje.includes("crear ticket") ||
      mensaje.includes("reportar") ||
      mensaje.includes("falla") ||
      mensaje.includes("error")
    ) {
      const ticketAutomatico = await prisma.ticket.create({
        data: {
          nombre: "BaproChat IA",
          correo: "baprochat@baprosa.com",
          tipo: "Incidente",
          descripcion: `Ticket de contingencia autogenerado desde el Chatbot de asistencia. Detalle inicial: "${req.body.mensaje}"`,
          prioridad: "Alta",
          estado: "Creado",
        },
      });

      return res.json({
        message: `He detectado que experimentas un problema técnico complejo. Para garantizar tu soporte, he generado automáticamente el Ticket corporativo #${ticketAutomatico.id} en nuestro panel de IT Baprosa. ¡Nuestros ingenieros ya han sido notificados!`,
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const result = await model.generateContent(`
      Eres BaproChat, un asistente virtual experto en Soporte IT interno para la empresa Baprosa. 
      Ayuda al empleado a resolver problemas comunes de redes, software corporativo y sistemas operativos de manera clara, educada y profesional.
      Usuario pregunta: ${req.body.mensaje}
    `);

    const response = await result.response;
    res.json({
      message: response.text(),
    });
  } catch (error) {
    console.error("ERROR REAL PRISMA EN CHATBOT:", error);
    res.status(500).json({ error: error.message });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5176",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Usuario conectado: ${socket.id}`);

  socket.on("join_area", (areaName) => {
    socket.join(areaName);
    console.log(`👥 Usuario se unió al canal de área: ${areaName}`);
  });

  socket.on("send_message", (data) => {
    io.to(data.area).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log(`Usuario desconectado: ${socket.id}`);
  });
});



server.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(" Base de Datos SQLite Conectada Correctamente.");
    console.log(` Servidor de Baprosa activo en: http://localhost:${PORT}`);
  } catch (error) {
    console.error(" Error Crítico al conectar la Base de Datos:", error);
  }
});