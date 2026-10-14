// Modelo (acceso a datos): solo consultas Prisma y la forma en que la API presenta cada registro.
const prisma = require('../config/prisma');
const { aCodigo, estadoABase, estadoDesdeBase } = require('../utils/codigos');

function presentar(incidente) {
  if (!incidente) return null;
  return { ...incidente, id: aCodigo(incidente.id), fecha: incidente.fecha.toISOString().slice(0, 10), estado: estadoDesdeBase(incidente.estado) };
}
function preparar(datos) {
  return { ...datos, fecha: new Date(datos.fecha + 'T00:00:00Z'), estado: estadoABase(datos.estado) };
}
async function listar({ prioridad, estado, pagina, limite }) {
  const where = {};
  if (prioridad) where.prioridad = prioridad;
  if (estado) where.estado = estadoABase(estado);
  const [total, incidentes] = await prisma.$transaction([
    prisma.incidente.count({ where }),
    // La lista no usa las fechas de auditoría: se omiten para enviar menos datos. El detalle (buscar) las conserva.
    prisma.incidente.findMany({ where, omit: { createdAt: true, updatedAt: true }, orderBy: { id: 'asc' }, skip: (pagina - 1) * limite, take: limite }),
  ]);
  return { total, pagina, paginas: Math.max(1, Math.ceil(total / limite)), incidentes: incidentes.map(presentar) };
}
async function buscar(id) { return presentar(await prisma.incidente.findUnique({ where: { id } })); }
async function crear(datos) { return presentar(await prisma.incidente.create({ data: preparar(datos) })); }
async function actualizar(id, datos) { return presentar(await prisma.incidente.update({ where: { id }, data: preparar(datos) })); }
async function eliminar(id) { await prisma.incidente.delete({ where: { id } }); }

module.exports = { listar, buscar, crear, actualizar, eliminar, preparar };
