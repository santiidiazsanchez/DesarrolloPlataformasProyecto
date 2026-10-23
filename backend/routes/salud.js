const router = require('express').Router();
const prisma = require('../config/prisma');
const entorno = require('../config/entorno');

// Health check de Render: confirma que el proceso responde y que PostgreSQL contesta.
// No reemplaza las pruebas del CRUD ni del inicio de sesión (npm run produccion).
router.get('/', async (req, res) => {
  const datos = { version: entorno.version, entorno: entorno.nombre };
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ estado: 'ok', baseDeDatos: 'conectada', ...datos });
  } catch {
    res.status(503).json({ estado: 'error', baseDeDatos: 'sin conexión', ...datos });
  }
});

module.exports = router;
