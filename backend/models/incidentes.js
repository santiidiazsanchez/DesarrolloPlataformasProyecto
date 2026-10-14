const prisma = require('../config/prisma');

// La API conserva los códigos INC-001 y las etiquetas usadas por React.
function presentar(incidente) {
  if (!incidente) return null;
  return { ...incidente, id: 'INC-' + String(incidente.id).padStart(3, '0'),
    fecha: incidente.fecha.toISOString().slice(0, 10),
    estado: incidente.estado === 'En_revision' ? 'En revisión' : incidente.estado };
}
function preparar(datos) {
  return { ...datos, fecha: new Date(datos.fecha + 'T00:00:00Z'),
    estado: datos.estado === 'En revisión' ? 'En_revision' : datos.estado };
}
async function listar({ prioridad, estado, pagina, limite }) {
  const where = {};
  if (prioridad) where.prioridad = prioridad;
  if (estado) where.estado = estado === 'En revisión' ? 'En_revision' : estado;
  const [total, incidentes] = await prisma.$transaction([
    prisma.incidente.count({ where }),
    prisma.incidente.findMany({ where, orderBy: { id: 'asc' }, skip: (pagina - 1) * limite, take: limite }),
  ]);
  return { total, pagina, paginas: Math.max(1, Math.ceil(total / limite)), incidentes: incidentes.map(presentar) };
}
async function buscar(id) { return presentar(await prisma.incidente.findUnique({ where: { id } })); }
async function crear(datos) { return presentar(await prisma.incidente.create({ data: preparar(datos) })); }
async function actualizar(id, datos) { return presentar(await prisma.incidente.update({ where: { id }, data: preparar(datos) })); }
async function eliminar(id) { await prisma.incidente.delete({ where: { id } }); }

module.exports = { listar, buscar, crear, actualizar, eliminar };
