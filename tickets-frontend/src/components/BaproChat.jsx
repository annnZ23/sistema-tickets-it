import { useState } from "react";
import "./chat.css";

export default function BaproChat({ initialMessage }) {

  const [messages, setMessages] = useState([
    { text: initialMessage, sender: "user" },
    { text: "Hola, soy tu asesor. Estoy revisando tu ticket", sender: "bot" }
  ]);

  const [input, setInput] = useState("");

  const send = () => {
    if (!input) return;

    setMessages([...messages, { text: input, sender: "user" }]);
    setInput("");

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { text: "Te responderemos pronto ", sender: "bot" }
      ]);
    }, 800);
  };

  return (
    <div className="chat-container">

      <div className="chat-header">
        <div className="avatar"></div>
        <div>
          <div>Asesor IT</div>
          <div className="status online">En línea</div>
        </div>
      </div>

      <div className="chat-body">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`}>
            <div className="bubble">{m.text}</div>
          </div>
        ))}
      </div>

      <div className="chat-footer">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
        />

        <button onClick={send}>➤</button>
      </div>

    </div>
  );
}
