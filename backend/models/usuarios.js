const prisma = require('../config/prisma');

// passwordHash solo sale del modelo para comparar en el inicio de sesión.
const publico = { id: true, nombre: true, correo: true, rol: true, activo: true };

async function buscarPorCorreo(correo) {
  return prisma.usuario.findUnique({ where: { correo } });
}
async function buscarPorId(id) {
  return prisma.usuario.findUnique({ where: { id }, select: publico });
}

module.exports = { buscarPorCorreo, buscarPorId };
