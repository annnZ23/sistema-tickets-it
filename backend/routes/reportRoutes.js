const express = require("express");
const router = express.Router();
const { obtenerEstadisticasAdmin, exportarExcelFiltros } = require("../controllers/reportController");

router.get("/estadisticas", obtenerEstadisticasAdmin);
router.get("/exportar", exportarExcelFiltros);
module.exports = router;