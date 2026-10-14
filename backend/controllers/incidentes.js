const modelo = require('../models/incidentes');
const { prioridades, estados } = require('../validaciones/incidentes');

function identificador(codigo) {
  if (!codigo.startsWith('INC-')) return null;
  const numero = Number(codigo.slice(4));
  return Number.isSafeInteger(numero) && numero > 0 && numero <= 2147483647
    && codigo === 'INC-' + String(numero).padStart(3, '0') ? numero : null;
}

async function listar(req, res) {
  const { prioridad, estado } = req.query;
  if (prioridad !== undefined && !prioridades.includes(prioridad)) return res.status(400).json({ error: 'Filtro de prioridad inválido.' });
  if (estado !== undefined && !estados.includes(estado)) return res.status(400).json({ error: 'Filtro de estado inválido.' });
  const pagina = Number(req.query.pagina ?? 1);
  const limite = Number(req.query.limite ?? 10);
  if (!Number.isInteger(pagina) || pagina < 1 || pagina > 100000 || !Number.isInteger(limite) || limite < 1 || limite > 50) {
    return res.status(400).json({ error: 'Usa una página positiva y un límite entre 1 y 50.' });
  }
  res.json(await modelo.listar({ prioridad, estado, pagina, limite }));
}
async function consultar(req, res) {
  const id = identificador(req.params.id);
  if (!id) return res.status(400).json({ error: 'Identificador inválido. Usa un código como INC-001.' });
  const incidente = await modelo.buscar(id);
  if (!incidente) return res.status(404).json({ error: 'Incidente no encontrado.' });
  res.json(incidente);
}
// req.body ya fue validado y limpiado por validarCuerpo: solo trae los campos del formulario.
async function crear(req, res) {
  const incidente = await modelo.crear(req.body);
  res.location(`/api/incidentes/${incidente.id}`).status(201).json(incidente);
}
async function actualizar(req, res) {
  const id = identificador(req.params.id);
  if (!id) return res.status(400).json({ error: 'Identificador inválido. Usa un código como INC-001.' });
  res.json(await modelo.actualizar(id, req.body));
}
async function eliminar(req, res) {
  const id = identificador(req.params.id);
  if (!id) return res.status(400).json({ error: 'Identificador inválido. Usa un código como INC-001.' });
  await modelo.eliminar(id);
  res.status(204).end();
}
// Express 5 envía automáticamente los rechazos de funciones async al middleware.
module.exports = { listar, consultar, crear, actualizar, eliminar };
