// El controlador solo traduce HTTP: lee la solicitud, llama al servicio y elige el código de respuesta.
// Las reglas están en services/incidentes.js. Express 5 envía los rechazos async al manejador de errores.
const servicio = require('../services/incidentes');

async function listar(req, res) {
  res.json(await servicio.listar(req.query));
}
async function consultar(req, res) {
  res.json(await servicio.consultar(req.params.id));
}
// req.body ya fue validado y limpiado por validarCuerpo: solo trae los campos del formulario.
async function crear(req, res) {
  const incidente = await servicio.crear(req.body);
  res.location(`/api/incidentes/${incidente.id}`).status(201).json(incidente);
}
async function actualizar(req, res) {
  res.json(await servicio.actualizar(req.params.id, req.body));
}
async function eliminar(req, res) {
  await servicio.eliminar(req.params.id);
  res.status(204).end();
}

module.exports = { listar, consultar, crear, actualizar, eliminar };
