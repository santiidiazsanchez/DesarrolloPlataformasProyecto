const { verificarToken } = require('../utils/token');
const usuarios = require('../models/usuarios');

function noAutorizado(res, error) {
  // RFC 6750: el 401 indica que se espera un token Bearer.
  return res.set('WWW-Authenticate', 'Bearer').status(401).json({ error });
}

async function autenticar(req, res, next) {
  const [tipo, token] = (req.get('authorization') || '').split(' ');
  if (tipo !== 'Bearer' || !token) return noAutorizado(res, 'Inicia sesión para continuar.');
  let datos;
  try {
    datos = verificarToken(token);
  } catch {
    return noAutorizado(res, 'La sesión no es válida o venció. Inicia sesión de nuevo.');
  }
  // La firma no basta: se confirma que la cuenta sigue activa y se usa el rol actual de la base,
  // no el que quedó escrito en el token. Así un cambio de rol o una baja se aplican de inmediato.
  const usuario = await usuarios.buscarPorId(Number(datos.sub));
  if (!usuario || !usuario.activo) return noAutorizado(res, 'La sesión no es válida o venció. Inicia sesión de nuevo.');
  req.usuario = { id: usuario.id, rol: usuario.rol };
  next();
}

function permitir(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) return res.status(403).json({ error: 'Tu rol no tiene permiso para esta acción.' });
    next();
  };
}

module.exports = { autenticar, permitir };
