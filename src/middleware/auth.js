const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// Exige un token JWT válido en el header Authorization: Bearer <token>.
// Si es válido, pone los datos del usuario en req.usuario para que
// el resto de la ruta pueda usarlos (id, username, role, area).
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, message: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: "Token inválido o expirado" });
  }
}

// Exige que el usuario (ya autenticado por verificarToken) tenga uno
// de los roles permitidos. Úsalo DESPUÉS de verificarToken en la cadena
// de middlewares: router.get("/", verificarToken, permitirRoles("SUPERADMIN"), ...)
function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.role)) {
      return res.status(403).json({ ok: false, message: "No tienes permiso para esta acción" });
    }
    next();
  };
}

module.exports = { verificarToken, permitirRoles };