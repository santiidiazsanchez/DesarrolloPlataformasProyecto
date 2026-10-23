const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const entorno = require('./config/entorno');
const prisma = require('./config/prisma');
const app = require('./app');

// HTTPS local opcional (npm run certificado). En producción el cifrado lo hace el proxy.
function crearServidor() {
  const { certificado, clave } = entorno.https;
  if (!certificado || !clave) return { servidor: http.createServer(app), protocolo: 'http' };
  const opciones = { cert: fs.readFileSync(certificado), key: fs.readFileSync(clave), minVersion: 'TLSv1.2' };
  return { servidor: https.createServer(opciones, app), protocolo: 'https' };
}

async function iniciar() {
  await prisma.$connect();
  // Comprobar también que se aplicaron las migraciones.
  await prisma.incidente.count();
  await prisma.usuario.count();
  const { servidor, protocolo } = crearServidor();
  servidor.once('error', (error) => {
    console.error(error.code === 'EADDRINUSE' ? `El puerto ${entorno.puerto} está ocupado.` : 'No se pudo iniciar la API.');
    prisma.$disconnect(); process.exitCode = 1;
  });
  servidor.listen(entorno.puerto, entorno.host, () => {
    console.log(`API de incidentes (${entorno.nombre}, versión ${entorno.version}): ${protocolo}://${entorno.host}:${servidor.address().port}/api/incidentes`);
  });
  async function cerrar() {
    servidor.close(async () => { await prisma.$disconnect(); });
  }
  process.once('SIGINT', cerrar);
  process.once('SIGTERM', cerrar);
}
iniciar().catch(async () => {
  console.error('No se pudo conectar con la base. Revisa DATABASE_URL, Docker y npm run db:migrar.');
  await prisma.$disconnect(); process.exitCode = 1;
});
