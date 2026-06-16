const express = require("express");
const router = express.Router();
const { 
  obtenerEstadisticasAdmin, 
  obtenerHistorialFinalizados, 
  exportarExcelFiltros 
} = require("../controllers/reportController");

router.get("/estadisticas", obtenerEstadisticasAdmin);
router.get("/historial", obtenerHistorialFinalizados);
router.get("/exportar", exportarExcelFiltros);

module.exports = router;