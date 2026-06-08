import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/Login";
import RegisterTicket from "./pages/RegisterTicket";
import ChatTicket from "./pages/ChatTicket";

function App() {
  const [usuario, setUsuario] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        
        <Route
          path="/"
          element={<Login setUsuario={setUsuario} />}
        />

        <Route
          path="/crear"
          element={usuario ? <RegisterTicket /> : <Login setUsuario={setUsuario} />}
        />

       
        <Route
          path="/chat/:id"
          element={usuario ? <ChatTicket /> : <Login setUsuario={setUsuario} />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;