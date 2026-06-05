import { useState } from "react";
import chatIcon from "../assets/chat.png";
import "./chatbot.css";

function Chatbot() {

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [estado, setEstado] = useState("WELCOME");
  const [ultimoMensaje, setUltimoMensaje] = useState("");
  const [input, setInput] = useState(""); //FALTABA

  const user = JSON.parse(localStorage.getItem("user"));

  const add = (tipo, content) => {
    setMessages(prev => [...prev, { tipo, content }]);
  };

  const iniciarChat = () => {
    setMessages([]);

    add("bot", "👋 Hola, soy BaproChat");
    add("bot", "Estoy aquí para ayudarte");

    menu();
  };

  const menu = () => {
    setEstado("MENU");

    add("bot", "Selecciona una opción:");

    add("menu", [
      "🖨️ Impresora",
      "💻 Laptop lenta",
      "🌐 Internet",
      "📧 Correo",
      "💬 Otro problema"
    ]);
  };

 
  const enviarMensaje = async (msg, crearTicket = false) => {

    setUltimoMensaje(msg);

    add("user", msg);

    try {
      const response = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensaje: msg,
          usuario: user,
          crearTicket
        })
      });

      const data = await response.json();

console.log("RESPUESTA BACKEND:", data);  

      if (data && data.message) {
  add("bot", data.message);
} else {
  add("bot", " No hubo respuesta del servidor");
}

      if (data.necesitaConfirmacion) {
        setEstado("CONFIRMAR");
        add("menu", ["✅ Sí", "❌ No"]);
      }

    } catch (error) {
      console.error(error);
      add("bot", "❌ Error de conexión");
    }
  };

  const procesar = (msg) => {

   // Cambia esto en procesar():
if (estado === "CONFIRMAR") {
  if (msg.includes("sí") || msg.includes("si")) {
    add("bot", " ¡Me alegra haberte ayudado! ¿Hay algo más en lo que pueda asistirte?");
    menu();
    return;
  }
  if (msg.includes("no")) {
    enviarMensaje(ultimoMensaje, true);  // crea el ticket con el problema original
    setEstado("MENU");
    return;
  }
}

    if (msg.includes("otro")) {
      enviarMensaje("Problema general");
      return;
    }

    enviarMensaje(msg);
  };

  
  const enviarTexto = () => {
    if (!input.trim()) return;

    procesar(input.toLowerCase());
    setInput("");
  };

  return (
    <>
      {/* BOTON */}
      <img
        src={chatIcon}
        className="chat-icon"
        onClick={() => setOpen(!open)}
      />

      {open && (
        <div className="chat-box">

          <div className="chat-header">
            BaproChat
            <span onClick={() => setOpen(false)}>✖</span>
          </div>

         
          {estado === "WELCOME" && (
            <div className="welcome-box">
              <h2>Hola 👋</h2>
              <p>¿Necesitas ayuda?</p>

              <button
                className="start-btn"
                onClick={() => {
                  setEstado("MENU");
                  iniciarChat();
                }}
              >
                Iniciar conversación
              </button>
            </div>
          )}

          {/* ✅ CHAT */}
          {estado !== "WELCOME" && (
            <>
              <div className="chat-body">

                {messages.map((m, i) => (
                  <div key={i}>

                    {m.tipo === "bot" && (
                      <div className="msg bot">{m.content}</div>
                    )}

                    {m.tipo === "user" && (
                      <div className="msg user">{m.content}</div>
                    )}

                    {m.tipo === "menu" && (
                      <div className="menu">
                        {m.content.map((op, j) => (
                          <button
                            key={j}
                            className="menu-btn"
                            onClick={() => procesar(op.toLowerCase())}
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                ))}

              </div>

              {/* INPUT (AQUÍ VA) */}
              <div className="chat-input">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu problema..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") enviarTexto();
                  }}
                />

                <button onClick={enviarTexto}>Enviar</button>
              </div>
            </>
          )}

        </div>
      )}
    </>
  );
}

export default Chatbot;
