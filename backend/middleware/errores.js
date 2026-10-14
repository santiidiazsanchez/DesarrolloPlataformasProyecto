module.exports = function errores(error, req, res, next) {
  if (error.tipo === 'cors') return res.status(403).json({ error: 'Origen no permitido.' });
  if (error.code === 'P2002') return res.status(409).json({ error: 'Ya existe un incidente con ese título.' });
  if (error.code === 'P2025') return res.status(404).json({ error: 'Incidente no encontrado.' });
  if (['P1000', 'P1001', 'P1002', 'P1008', 'P1017', 'P2024'].includes(error.code)) {
    return res.status(503).json({ error: 'La base de datos no está disponible. Intenta de nuevo.' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo debe contener JSON válido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La solicitud es demasiado grande.' });
  }
  if (error.status === 415) {
    return res.status(415).json({ error: 'El formato o la codificación de la solicitud no es compatible.' });
  }
  if (error.status === 400) {
    return res.status(400).json({ error: 'La solicitud no es válida.' });
  }
  // No imprimir consultas, datos personales ni cadenas de conexión.
  console.error('Error interno al procesar la solicitud.');
  res.status(500).json({ error: 'No se pudo completar la solicitud.' });
};
