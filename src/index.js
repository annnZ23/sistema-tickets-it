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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads")); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// MIDDLEWARES - Configuración de CORS Global para HTTP
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
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

// 🔥 CORREGIDO: Apuntando correctamente hacia afuera de la carpeta src
const reportRoutes = require("../backend/routes/reportRoutes");
const taskRoutes = require("../backend/routes/task.routes");

app.use("/api/reportes", reportRoutes);
app.use("/api/tasks", taskRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API funcionando desde src/" });
});

// LOGIN CORREGIDO (Insensible a mayúsculas/minúsculas)
app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body;
  try {
    const correoFormateado = usuario.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: correoFormateado },
    });
    if (!user) return res.json({ ok: false, message: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.json({ ok: false, message: "Contraseña incorrecta" });

    res.json({ ok: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

// ROUTE: SEED DE USUARIOS CON CUENTAS OUTLOOK (¡CORREGIDO Y SEGURO!)
app.get("/api/seed-usuarios", async (req, res) => {
  try {
    const contraseniaComun = await bcrypt.hash("123456", 10);
    
    // Áreas operativas de la empresa
    const areas = [
      "logistica", "ventas", "gps", "mercadeo", "contabilidad", 
      "bodega", "bascula", "suministro", "silos", "taller", 
      "produccion", "guardia", "compras", "caja", "pagos", 
      "planin", "transporte", "creditos", "laboratorio"
    ];

    console.log("⏳ Generando usuarios corporativos de Outlook para Baprosa...");

    for (const area of areas) {
      const correoOutlook = `${area}@baprosa.com`;
      const nombreFormateado = area.charAt(0).toUpperCase() + area.slice(1);
      
      const existeUsuario = await prisma.user.findFirst({
        where: { email: correoOutlook }
      });

      if (!existeUsuario) {
        await prisma.user.create({
          data: {
            name: `Área ${nombreFormateado}`,
            email: correoOutlook,
            password: contraseniaComun,
            role: "USER",
          },
        });
      }
    }

    // Administradores Globales del Sistema (IT y Gerencia)
    const administradores = [
      { name: "Soporte IT Admin", email: "practicait@baprosa.com" },
      { name: "Gerencia General", email: "gerencia@baprosa.com" }
    ];

    for (const admin of administradores) {
      const existeAdmin = await prisma.user.findFirst({
        where: { email: admin.email }
      });

      if (!existeAdmin) {
        await prisma.user.create({
          data: {
            name: admin.name,
            email: admin.email,
            password: contraseniaComun,
            role: "ADMIN"
          }
        });
      }
    }

    console.log("✅ Cuentas de Outlook de Baprosa creadas correctamente.");
    res.json({ 
      ok: true, 
      message: "Estructura de Outlook corporativo generada con éxito.",
      ejemplos_acceso: {
        empleado_area: "logistica@baprosa.com",
        administrador_it: "practicait@baprosa.com",
        password_general: "123456"
      }
    });

  } catch (error) {
    console.error("❌ Error al poblar los usuarios:", error);
    res.status(500).json({ ok: false, error: error.message });
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
  try {
    const listaTickets = await prisma.ticket.findMany({
      orderBy: { id: "desc" }
    });

    const totalTickets = listaTickets.length;
    const enProceso = listaTickets.filter(t => t.estado === "En Proceso").length;
    const resueltos = listaTickets.filter(t => t.estado === "Resuelto" || t.estado === "Finalizado").length;

    const ticketsFormateados = listaTickets.map(t => ({
      id: t.id,
      asunto: t.descripcion ? (t.descripcion.split("[SOLUCIÓN")[0].substring(0, 40) || "Problema") : "Problema",
      tipo: t.tipo,
      prioridad: t.prioridad,
      estado: t.estado,
      descripcion: t.descripcion,
      usuario: t.nombre,        
      departamento: t.tipo,      
      correo: t.correo
    }));

    res.json({
      tickets: ticketsFormateados,
      stats: {
        totalTickets,
        enProceso,
        resueltos,
        satisfaccion: "4.6" 
      }
    });

  } catch (error) {
    console.error("❌ Error en GET /api/tickets:", error);
    res.status(500).json({ error: "Error al cargar la información de soporte" });
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

app.post("/api/chat", async (req, res) => {
  try {
    const mensajeOriginal = req.body.mensaje || "";
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({ 
        message: "⚠️ Configuración incompleta: No se encontró la GEMINI_API_KEY en el archivo .env" 
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Eres BaproChat, un asistente virtual experto en Soporte IT interno para la empresa Baprosa. 
            Ayuda al empleado a resolver problemas comunes de redes, impresoras, software corporativo (como SAP) y sistemas operativos de manera clara, educada y muy breve en un solo párrafo o viñetas concisas.
            Empleado pregunta: "${mensajeOriginal}"`
          }]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.json({ message: `⚠️ Error directo de Google AI Studio: ${data.error.message}` });
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const textIA = data.candidates[0].content.parts[0].text;
      return res.json({ message: textIA });
    } else {
      return res.json({ message: "⚠️ El servidor de Google no pudo estructurar una respuesta. Intenta con otra consulta." });
    }

  } catch (error) {
    console.error("❌ ERROR EN CHATBOT FETCH:", error);
    return res.json({ message: `⚠️ Hubo un problema al procesar tu consulta de soporte: ${error.message}` });
  }
});

app.get("/crear-user", async (req, res) => {
  const existing = await prisma.user.findFirst({ where: { email: "user@gmail.com" } });
  if (existing) return res.json(existing);

  const hashedPassword = await bcrypt.hash("123456", 10);
  const user = await prisma.user.create({
    data: { name: "Usuario", email: "user@gmail.com", password: hashedPassword, role: "USER" },
  });
  res.json(user);
});

app.get("/crear-admin", async (req, res) => {
  await prisma.user.deleteMany({ where: { email: "admin@gmail.com" } });
  const hashedPassword = await bcrypt.hash("123456", 10);
  const user = await prisma.user.create({
    data: { name: "Admin IT", email: "admin@gmail.com", password: hashedPassword, role: "ADMIN" },
  });
  res.json(user);
});

app.get("/crear-admin-soporte", async (req, res) => {
  const hashedPassword = await bcrypt.hash("soporte2024", 10);
  const user = await prisma.user.upsert({
    where: { email: "adminsoporte@baprosa.com" },
    update: {},
    create: { name: "Admin Soporte", email: "adminsoporte@baprosa.com", password: hashedPassword, role: "ADMIN_SOPORTE" },
  });
  res.json(user);
});

app.get("/crear-ana", async (req, res) => {
  await prisma.user.deleteMany({ where: { email: "a.zepeda@baprosa.com" } });
  const hashedPassword = await bcrypt.hash("123456", 10);
  const user = await prisma.user.create({
    data: { name: "Ana Zepeda", email: "a.zepeda@baprosa.com", password: hashedPassword, role: "USER" },
  });
  res.json({ message: "Usuario de pruebas 'Ana Zepeda' creado con éxito", user });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
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
