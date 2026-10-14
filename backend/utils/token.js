const jwt = require('jsonwebtoken');
const entorno = require('../config/entorno');

// El token solo lleva el id y el rol: su contenido se puede leer, así que no guarda datos sensibles.
const opciones = { issuer: 'incidentes-api', audience: 'incidentes-web' };

function crearToken(usuario) {
  return jwt.sign({ rol: usuario.rol }, entorno.jwtSecret, {
    ...opciones, subject: String(usuario.id), expiresIn: entorno.jwtDuracion, algorithm: 'HS256',
  });
}

function verificarToken(token) {
  // Se fija el algoritmo para rechazar tokens sin firma (alg "none") o firmados de otra forma.
  return jwt.verify(token, entorno.jwtSecret, { ...opciones, algorithms: ['HS256'] });
}

module.exports = { crearToken, verificarToken };
