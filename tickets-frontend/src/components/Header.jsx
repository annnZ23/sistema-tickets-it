function Header() {
  return (
    <div style={header}>

      {/* LOGO */}
      <div>
        <img src="/logo.png" style={logo} />
      </div>

      {/* USUARIO */}
      <div>Usuario Admin</div>
    </div>
  );
}



const header = {
  background: "#ff7a00",
  color: "white",
  padding: "10px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
};

const logo = {
  height: "40px"
};

export default Header;



