import { useState } from "react";
import Login from "./pages/Login";
import RegisterTicket from "./pages/RegisterTicket";

function App() {
  const [usuario, setUsuario] = useState(null);

  if (!usuario) {
    return <Login setUsuario={setUsuario} />;
  }

  return <RegisterTicket />;
}

export default App;

