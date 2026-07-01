require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const { verificarToken, permitirRoles } = require("./middleware/auth");

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

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const reportRoutes = require("../backend/routes/reportRoutes");
const taskRoutes = require("../backend/routes/task.routes");
const ticketRoutes = require("../backend/routes/tickets.routes");
const usuariosRoutes = require("../backend/routes/usuarios.routes");
const areasRoutes = require("../backend/routes/areas.routes");
const notificacionesRoutes = require("../backend/routes/notificaciones.routes");
const subTareasRoutes = require("../backend/routes/subTareas.routes");
const { setIo: setIoSubTarea } = require("../backend/controllers/subTareaController");
app.use("/api/reportes", reportRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/areas-it", areasRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/subtareas", subTareasRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API funcionando desde src/" });
});

app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ ok: false, message: "Usuario y contraseña son requeridos" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: usuario.trim().toLowerCase() },
          { username: usuario.trim().toLowerCase() },
        ],
      },
      include: { area: true },
    });

    if (!user) {
      return res.json({ ok: false, message: "Usuario no encontrado" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ ok: false, message: "Contraseña incorrecta" });
    }

    const areaNombre = user.area?.nombre || user.areaEmpresa || null;

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        area: areaNombre,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _omitido, ...userSinPassword } = user;

    res.json({
      ok: true,
      token,
      user: { ...userSinPassword, areaNombre },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ ok: false, message: "Error en el servidor" });
  }
});

const server = http.createServer(app);

// === SOCKET.IO ===
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// Inyectar io al controller de sub-tareas para notificaciones en tiempo real
setIoSubTarea(io);

io.on("connection", (socket) => {
  console.log(`Socket conectado: ${socket.id}`);

  // Sala de área (chat grupal)
  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} se unió a la sala: ${roomName}`);
  });

  socket.on("leave_room", (roomName) => {
    socket.leave(roomName);
    console.log(`Socket ${socket.id} salió de la sala: ${roomName}`);
  });

  // Sala personal por usuario — para notificaciones dirigidas
  socket.on("join_personal_room", (usuarioId) => {
    const sala = `usuario_${usuarioId}`;
    socket.join(sala);
    console.log(`Socket ${socket.id} se unió a sala personal: ${sala}`);
  });

  socket.on("send_message", (messageData) => {
    if (!messageData?.room) return;
    io.to(messageData.room).emit("receive_message", messageData);
  });

  socket.on("disconnect", () => {
    console.log(`Socket desconectado: ${socket.id}`);
  });
});
// === FIN SOCKET.IO ===

server.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log(" Conectado a PostgreSQL (Prisma).");
    console.log(` Servidor activo en http://localhost:${PORT}`);
  } catch (error) {
    console.error(" No se pudo conectar a la base de datos:", error);
  }
});