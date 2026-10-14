// Reglas del negocio de incidentes. No conoce Express ni Prisma: recibe datos y usa el modelo.
const modelo = require('../models/incidentes');
const { desdeCodigo } = require('../utils/codigos');
const { ErrorHttp } = require('../utils/error-http');
const { prioridades, estados } = require('../validaciones/incidentes');

const LIMITE_MAXIMO = 50;

function idDesde(codigo) {
  const id = desdeCodigo(codigo);
  if (!id) throw new ErrorHttp(400, 'Identificador inválido. Usa un código como INC-001.');
  return id;
}

/**
 * Lista incidentes con filtros opcionales y paginación.
 * @param {{prioridad?: string, estado?: string, pagina?: string|number, limite?: string|number}} consulta Parámetros de la URL.
 * @returns {Promise<{total: number, pagina: number, paginas: number, incidentes: object[]}>}
 * @throws {ErrorHttp} 400 si un filtro o la paginación no son válidos.
 */
async function listar({ prioridad, estado, pagina = 1, limite = 10 } = {}) {
  if (prioridad !== undefined && !prioridades.includes(prioridad)) throw new ErrorHttp(400, 'Filtro de prioridad inválido.');
  if (estado !== undefined && !estados.includes(estado)) throw new ErrorHttp(400, 'Filtro de estado inválido.');
  const numeroPagina = Number(pagina);
  const numeroLimite = Number(limite);
  if (!Number.isInteger(numeroPagina) || numeroPagina < 1 || numeroPagina > 100000
    || !Number.isInteger(numeroLimite) || numeroLimite < 1 || numeroLimite > LIMITE_MAXIMO) {
    throw new ErrorHttp(400, `Usa una página positiva y un límite entre 1 y ${LIMITE_MAXIMO}.`);
  }
  return modelo.listar({ prioridad, estado, pagina: numeroPagina, limite: numeroLimite });
}

/**
 * @param {string} codigo Código del incidente, por ejemplo INC-001.
 * @throws {ErrorHttp} 400 si el código no es válido; 404 si no existe.
 */
async function consultar(codigo) {
  const incidente = await modelo.buscar(idDesde(codigo));
  if (!incidente) throw new ErrorHttp(404, 'Incidente no encontrado.');
  return incidente;
}

/** @param {object} datos Incidente ya validado y limpio por el esquema de zod. */
async function crear(datos) {
  return modelo.crear(datos);
}

/**
 * Reemplaza los campos editables (PUT del registro completo).
 * @throws {ErrorHttp} 400 si el código no es válido. Si no existe, Prisma lanza P2025 (404).
 */
async function actualizar(codigo, datos) {
  return modelo.actualizar(idDesde(codigo), datos);
}

/** @throws {ErrorHttp} 400 si el código no es válido. Si no existe, Prisma lanza P2025 (404). */
async function eliminar(codigo) {
  return modelo.eliminar(idDesde(codigo));
}

module.exports = { listar, consultar, crear, actualizar, eliminar };
