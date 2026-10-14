// Certificado autofirmado para probar HTTPS en 127.0.0.1. Solo sirve en desarrollo:
// en producción el certificado lo emite una autoridad (por ejemplo Let's Encrypt) en el proxy.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const carpeta = path.join(__dirname, '..', 'certificados');
// Git para Windows incluye OpenSSL aunque no esté en el PATH.
const candidatos = ['openssl', 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe', 'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe'];
const openssl = candidatos.find((programa) => spawnSync(programa, ['version']).status === 0);
if (!openssl) {
  console.error('No se encontró OpenSSL. Instala Git para Windows u OpenSSL y vuelve a intentar.');
  process.exit(1);
}
fs.mkdirSync(carpeta, { recursive: true });
const resultado = spawnSync(openssl, [
  'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-sha256', '-days', '30',
  '-keyout', path.join(carpeta, 'clave.pem'), '-out', path.join(carpeta, 'certificado.pem'),
  '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1,DNS:localhost',
], { stdio: ['ignore', 'ignore', 'pipe'] });
if (resultado.status !== 0) {
  console.error('OpenSSL no pudo crear el certificado.');
  process.exit(1);
}
console.log('Certificado creado en certificados/ (válido 30 días). No lo incluyas en la entrega.');
console.log('Agrega a .env: HTTPS_CERT=certificados/certificado.pem y HTTPS_KEY=certificados/clave.pem');
