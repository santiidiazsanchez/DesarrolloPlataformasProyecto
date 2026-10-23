const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

// La API no inicia si falta un secreto: así no se usa una clave de ejemplo por descuido.
function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en .env. Ejecuta npm run configurar.`);
  return valor;
}

requerida('DATABASE_URL');
const jwtSecret = requerida('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');

module.exports = {
  puerto: Number(process.env.PORT || 3001),
  // En la computadora solo se escucha en 127.0.0.1; en Render HOST=0.0.0.0 para recibir el tráfico de su proxy.
  host: process.env.HOST || '127.0.0.1',
  nombre: process.env.NODE_ENV || 'development',
  // Render define RENDER_GIT_COMMIT: /api/salud muestra qué commit está en línea.
  version: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7),
  jwtSecret,
  jwtDuracion: process.env.JWT_EXPIRES_IN || '30m',
  // Lista separada por comas, por ejemplo: http://127.0.0.1:5173,http://127.0.0.1:4173
  // Se quita la / final: el navegador envía el Origin sin ella y la comparación es exacta.
  origenesPermitidos: requerida('CLIENT_ORIGIN').split(',').map((origen) => origen.trim().replace(/\/+$/, '')).filter(Boolean),
  limitePorMinuto: Number(process.env.LIMITE_POR_MINUTO || 100),
  // Número de proxies de confianza; 0 en la computadora. En Render son 3 (Cloudflare, su balanceador
  // y el proxy local de la instancia), según la cadena X-Forwarded-For que se vio con DEPURAR_IP=1.
  confiarEnProxy: Number(process.env.TRUST_PROXY || 0),
  // Diagnóstico: DEPURAR_IP=1 agrega al log la cadena X-Forwarded-For. Se usa solo para revisar TRUST_PROXY.
  depurarIp: process.env.DEPURAR_IP === '1',
  https: {
    certificado: process.env.HTTPS_CERT && path.resolve(__dirname, '../..', process.env.HTTPS_CERT),
    clave: process.env.HTTPS_KEY && path.resolve(__dirname, '../..', process.env.HTTPS_KEY),
  },
};
