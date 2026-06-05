const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

//CARGAR .env
require("dotenv").config();
console.log("API KEY:", process.env.OPENAI_API_KEY);

//IA
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY 
});

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

//CONEXIÓN A POSTGRESQL
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

    //RESPUESTA IA
const aiResponse = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `Eres BaproChat. Responde así:
📌 Problema:
✅ Paso 1
✅ Paso 2
✅ Paso 3
❓ ¿Se solucionó?`
    },
    {
      role: "user",
      content: mensaje
    }
  ]
});

const respuestaIA = aiResponse.choices[0].message.content;


    //  SI NO SE RESOLVIÓ → CREAR TICKET
    if (crearTicket) {

      const result = await pool.query(
        "INSERT INTO tickets (nombre, correo, estado) VALUES ($1, $2, $3) RETURNING *",
        [
          mensaje,
          usuario?.correo || "sin correo",
          "Pendiente"
        ]
      );

      return res.json({
        message: "✅ Ticket generado. Un asesor te ayudará.",
        ticket: result.rows[0]
      });
    }

    // ✅ RESPUESTA NORMAL
    res.json({
      message: respuestaIA,
      necesitaConfirmacion: true
    });

  } catch (error) {
    console.error("ERROR IA:", error);
    res.status(500).json({
      message: "❌ Error con la IA"
    });
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
app.use(express.static(path.join(__dirname, "../tickets-frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../tickets-frontend/dist/index.html"));
});

/* ========= START ========= */
app.listen(PORT, () => {

  console.log(` Servidor activo en http://localhost:${PORT}`);
});
