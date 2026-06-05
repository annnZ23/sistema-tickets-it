const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");


require("dotenv").config();
console.log("API KEY:", process.env.OPENAI_API_KEY);

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY  
});

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mi_primera_bd",
  password: "1234",
  port: 5432,
});

/* ========= LOGIN ========= */
app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = $1 AND password = $2",
      [usuario, password]
    );

    if (result.rows.length > 0) {
      return res.json({ ok: true, user: result.rows[0] });
    }

    res.json({ ok: false });

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});


app.post("/api/chat", async (req, res) => {
  const { mensaje, usuario, crearTicket } = req.body;

  try {
    // Si ya confirmaron que quieren ticket
    if (crearTicket) {
      const result = await pool.query(
        "INSERT INTO tickets (nombre, correo, estado) VALUES ($1, $2, $3) RETURNING *",
        [mensaje, usuario?.correo || "sin correo", "Pendiente"]
      );
      return res.json({
        message: "✅ Ticket creado. Puedes darle seguimiento desde el sistema.",
        ticket: result.rows[0],
        necesitaConfirmacion: false
      });
    }

    // Llamada a OpenAI con prompt mejorado
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // ← nombre correcto
      messages: [
        {
         role: "system",
content: `
Eres BaproChat, un asistente de soporte técnico de nivel 1.

El usuario seleccionará un problema como impresora, internet, correo, laptop lenta u otro.

Tu respuesta SIEMPRE debe tener este formato EXACTO:

📌 Problema:
(describe brevemente el problema detectado)

✅ Paso 1:
(explica qué debe hacer el usuario)

✅ Paso 2:
(explica qué debe hacer el usuario)

✅ Paso 3:
(explica qué debe hacer el usuario)

✅ Paso 4:
(opcional si aplica)

✅ Paso 5:
(opcional si aplica)

❓ ¿Lograste resolver el problema?

Reglas:
- Usa lenguaje claro y sencillo
- Máximo 5 pasos
- No escribas párrafos largos
- Mantén formato con emojis SIEMPRE
`
        },
        {
          role: "user",
          content: `El usuario tiene un problema con: ${mensaje}. Dame una solución paso a paso.`
        }
      ],
    });

    const respuestaIA = aiResponse.choices[0].message.content;

    res.json({
      message: respuestaIA,
      necesitaConfirmacion: true  // mostrar "¿Se resolvió? Sí / No"
    });

  } catch (error) {
    console.error("ERROR IA:", error.message);
    res.status(500).json({ message: "❌ Error al conectar con la IA. Intenta de nuevo." });
  }

});

/* ========= TICKETS ========= */
app.post("/api/tickets", async (req, res) => {
  const { nombre, correo } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO tickets (nombre, correo, estado) VALUES ($1, $2, $3) RETURNING *",
      [nombre, correo, "Pendiente"]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear ticket" });
  }
});

app.get("/api/tickets", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tickets");
    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener tickets" });
  }
});

/* ========= FRONTEND ========= */
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "login.html"));
});

/* ========= START ========= */
app.listen(PORT, () => {
  console.log(`✅ Servidor activo en http://localhost:${PORT}`);
});