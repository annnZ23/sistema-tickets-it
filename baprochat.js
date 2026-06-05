document.addEventListener("DOMContentLoaded", () => {

  const chatIcon = document.getElementById("chatIcon");
  const chatBox = document.getElementById("baprochat");
  const closeChat = document.getElementById("closeChat");
  const minChat = document.getElementById("minChat");

  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");

  const modal = document.getElementById("ticketModal");
  const sendTicket = document.getElementById("sendTicket");
  const cancelTicket = document.getElementById("cancelTicket");

  let estadoActual = "INICIO";
  let iniciado = false;

  // ===== ABRIR =====
  chatIcon.onclick = () => {
    chatBox.classList.add("open");
    chatIcon.classList.add("hidden");
    chatBox.style.height = "480px";

    if (!iniciado) {
      iniciado = true;
      saludo();
    }
  };

  // ===== MINIMIZAR =====
  minChat.onclick = () => {
    chatBox.style.height = "60px";
  };

  // ===== CERRAR CON CONFIRMACIÓN (PROFESIONAL) =====
  closeChat.onclick = () => {
    estadoActual = "CONFIRMAR_CIERRE";

    bot("🔒 ¿Deseas cerrar la conversación?");
    opciones(["✅ Sí, cerrar", "❌ Cancelar"]);
  };

  // ===== ENVIAR MENSAJE =====
  sendBtn.onclick = () => {
    const msg = input.value.trim();
    if (!msg) return;

    input.value = "";
    user(msg);

    flujo(msg.toLowerCase());
  };

  function flujo(msg) {

    // ✅ CIERRE
    if (estadoActual === "CONFIRMAR_CIERRE") {
      if (msg.includes("sí") || msg.includes("si")) {
        cerrar();
      } else {
        bot("✅ Seguimos 😊");
        estadoActual = "MENU";
      }
      return;
    }

    // ✅ SOLUCIÓN
    if (estadoActual === "CONFIRMAR_SOLUCION") {
      if (msg.includes("sí") || msg.includes("si")) {
        bot("✅ Excelente, problema resuelto.");
        bot("Estoy aquí si necesitas algo más 😊");
        estadoActual = "MENU";
      } else {
        abrirModal();
      }
      return;
    }

    // ✅ IMPRESORA
    if (msg.includes("impresora")) {
      bot("🖨️ Revisemos tu impresora:");
      bot("✔️ Encendida");
      bot("✔️ Conectada");
      bot("✔️ Reiniciar");

      video("https://www.youtube.com/embed/_0FIRrZw2AU");

      preguntar();
      return;
    }

    // ✅ CORREO
    if (msg.includes("correo")) {
      bot("📧 Revisemos tu correo:");
      bot("✔️ Spam");
      bot("✔️ Internet");
      bot("✔️ Espacio");

      preguntar();
      return;
    }

    // ✅ IA
    usarIA(msg);
  }

  async function usarIA(msg) {
    bot("🤖 Analizando...");

    const res = await fetch("http://localhost:30001/api/chat", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({mensaje: msg})
    });

    const data = await res.json();

    bot(data.message);

    abrirModal();
  }

  function preguntar() {
    estadoActual = "CONFIRMAR_SOLUCION";
    bot("¿Se solucionó?");
    opciones(["✅ Sí, quedó resuelto", "❌ No, sigue el problema"]);
  }

  function abrirModal() {
    estadoActual = "ESCALAR";
    modal.classList.remove("hidden");
  }

  sendTicket.onclick = async () => {
    const nombre = document.getElementById("ticketNombre").value;
    const correo = document.getElementById("ticketCorreo").value;

    await fetch("http://localhost:30001/api/ticket", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ nombre, correo })
    });

    modal.classList.add("hidden");

    bot("✅ Ticket enviado. Un asesor te contactará.");
  };

  cancelTicket.onclick = () => {
    modal.classList.add("hidden");
    bot("❌ Cancelado.");
  };

  function saludo() {
    estadoActual = "MENU";

    bot("👋 Hola, soy BaproChat.");
    bot("¿En qué puedo ayudarte?");

    opciones([
      "🖨️ Impresora",
      "📧 Correo",
      "💬 Otro problema"
    ]);
  }

  function cerrar() {
    chatBox.classList.remove("open");
    chatIcon.classList.remove("hidden");
    chatMessages.innerHTML = "";
    iniciado = false;
    estadoActual = "INICIO";
  }

  function bot(txt) {
    const d = document.createElement("div");
    d.className="msg bot";
    d.innerText = txt;
    chatMessages.appendChild(d);
    scroll();
  }

  function user(txt) {
    const d = document.createElement("div");
    d.className="msg user";
    d.innerText = txt;
    chatMessages.appendChild(d);
    scroll();
  }

  function opciones(arr) {
    const c = document.createElement("div");
    c.className="menu-list";

    arr.forEach(t => {
      const b = document.createElement("div");
      b.className="menu-item";
      b.innerText=t;
      b.onclick=()=>{user(t); flujo(t.toLowerCase())};
      c.appendChild(b);
    });

    chatMessages.appendChild(c);
  }

  function video(url) {
    const i=document.createElement("iframe");
    i.src=url;
    i.width="100%";
    i.height="180";
    i.style.borderRadius="10px";
    chatMessages.appendChild(i);
    scroll();
  }

  function scroll() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

});
