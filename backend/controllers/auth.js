const bcrypt = require('bcryptjs');
const usuarios = require('../models/usuarios');
const { crearToken } = require('../utils/token');
const { permisosDe } = require('../config/permisos');
const entorno = require('../config/entorno');

// Hash de una contraseña que nadie usa: si el correo no existe, bcrypt trabaja igual
// y el tiempo de respuesta no revela qué correos están registrados.
const hashFicticio = '$2b$12$NLiXKcBGg2QpGHrL0AUkzO3BfMJoM9ZjI0pPKe3H1dE2rzBd6LTk2';

function presentar(usuario) {
  return { nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, permisos: permisosDe(usuario.rol) };
}

async function login(req, res) {
  const { correo, password } = req.body;
  const usuario = await usuarios.buscarPorCorreo(correo);
  const coincide = await bcrypt.compare(password, usuario?.passwordHash || hashFicticio);
  // Mismo mensaje para correo inexistente, contraseña incorrecta o cuenta desactivada.
  if (!usuario || !coincide || !usuario.activo) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  res.json({ token: crearToken(usuario), expiraEn: entorno.jwtDuracion, usuario: presentar(usuario) });
}

async function perfil(req, res) {
  const usuario = await usuarios.buscarPorId(req.usuario.id);
  res.json(presentar(usuario));
}

module.exports = { login, perfil, presentar };
