const { randomUUID } = require('node:crypto');
const entorno = require('../config/entorno');

// Una línea JSON por solicitud, que Render muestra en Logs. No se imprimen cuerpos,
// contraseñas ni tokens: solo método, ruta, código, duración y el id y rol del usuario.
// El id de solicitud también va en X-Request-Id para encontrar en el log lo que vio el usuario.
module.exports = function registro(req, res, next) {
  const inicio = process.hrtime.bigint();
  req.id = randomUUID();
  res.set('X-Request-Id', req.id);
  res.on('finish', () => {
    // Render consulta /api/salud cada pocos segundos: solo se registra cuando falla.
    if (req.originalUrl === '/api/salud' && res.statusCode === 200) return;
    const nivel = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    const linea = {
      fecha: new Date().toISOString(), nivel, id: req.id, ip: req.ip, metodo: req.method, ruta: req.originalUrl,
      estado: res.statusCode, ms: Math.round(Number(process.hrtime.bigint() - inicio) / 1e5) / 10,
    };
    if (req.usuario) Object.assign(linea, { usuario: req.usuario.id, rol: req.usuario.rol });
    // Solo mientras se ajusta TRUST_PROXY: qué direcciones agregó cada proxy. Se apaga quitando DEPURAR_IP.
    if (entorno.depurarIp) {
      linea.proxies = { xff: req.headers['x-forwarded-for'], trueClientIp: req.headers['true-client-ip'], cfConnectingIp: req.headers['cf-connecting-ip'], socket: req.socket?.remoteAddress };
    }
    console.log(JSON.stringify(linea));
  });
  next();
};
