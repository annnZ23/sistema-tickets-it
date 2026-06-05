export async function aiResponse(userMessage) {
  const msg = userMessage.toLowerCase();

  // ===== REGLAS RÁPIDAS (L1) =====

  if (msg.includes("correo") || msg.includes("mail")) {
    return {
      message: "📧 Parece un problema de correo. ¿Ya revisaste la carpeta de spam y confirmaste que tienes conexión a internet?",
      suggestEscalation: false
    };
  }

  if (msg.includes("impresora")) {
    return {
      message: "🖨️ Verifica que la impresora esté encendida y conectada. Te mostraré un video corto para ayudarte.",
      video: "https://www.youtube.com/embed/5F8V9Zq5d9Q",
      suggestEscalation: false
    };
  }

  // ===== SI NO SE RECONOCE → OPENAI =====

  try {
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mensaje: userMessage })
    });

    const data = await res.json();

    return {
      message: data.message,
      suggestEscalation: data.message.toLowerCase().includes("soporte")
    };

  } catch (error) {
    return {
      message: "No pude conectarme con el motor de inteligencia. Intenta de nuevo.",
      suggestEscalation: true
    };
  }
}
