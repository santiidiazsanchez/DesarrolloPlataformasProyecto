const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

// La API no inicia si falta un secreto: así no se usa una clave de ejemplo por descuido.
function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en .env. Ejecuta npm run configurar.`);
  return valor;
}

const jwtSecret = requerida('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');

module.exports = {
  puerto: Number(process.env.PORT || 3001),
  jwtSecret,
  jwtDuracion: process.env.JWT_EXPIRES_IN || '30m',
  // Lista separada por comas, por ejemplo: http://127.0.0.1:5173,http://127.0.0.1:4173
  origenesPermitidos: requerida('CLIENT_ORIGIN').split(',').map((origen) => origen.trim()).filter(Boolean),
  limitePorMinuto: Number(process.env.LIMITE_POR_MINUTO || 100),
  // Solo se activa detrás de un proxy HTTPS real (Nginx, Caddy o el balanceador de la nube).
  confiarEnProxy: process.env.TRUST_PROXY === '1',
  https: {
    certificado: process.env.HTTPS_CERT && path.resolve(__dirname, '../..', process.env.HTTPS_CERT),
    clave: process.env.HTTPS_KEY && path.resolve(__dirname, '../..', process.env.HTTPS_KEY),
  },
};
