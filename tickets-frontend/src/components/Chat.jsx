function Chat() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "750px",  
        margin: "0 auto"     
      }}
    >
      {/* header */}
      <div
        style={{
          background: "#ff9900",
          color: "white",
          padding: "15px",
          borderRadius: "6px",
          textAlign: "right"
        }}
      >
        <div>Soporte Técnico</div>
        <div style={{ fontSize: "12px" }}>En línea</div>
      </div>

      {/* mensaje */}
      <div
        style={{
          background: "#f1f1f1",
          padding: "10px",
          marginTop: "12px",
          borderRadius: "8px",
          width: "fit-content"
        }}
      >
        Hola 👋 soy soporte técnico ¿en qué puedo ayudarte?
      </div>

      {/* input */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "12px"
        }}
      >
        <input
          type="text"
          placeholder="Escribe tu mensaje..."
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />

        <button
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            cursor: "pointer"
          }}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export default Chat;