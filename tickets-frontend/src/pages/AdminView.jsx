import { useState } from "react";
import Login from "./pages/Login";
import TicketForm from "./components/TiketForm";

function App() {
  const [usuario, setUsuario] = useState(null);

  if (!usuario) {
    return <Login setUsuario={setUsuario} />;
  }

  return <TicketForm />;
}

export default App;