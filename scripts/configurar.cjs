const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

// Contraseña legible para las cuentas de prueba (16 caracteres aleatorios).
const clave = () => 'Inc-' + randomBytes(9).toString('base64url');

const raiz = path.join(__dirname, '..');
const archivo = path.join(raiz, '.env');
const actual = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : '';
const existentes = new Set(actual.split(/\r?\n/).map((linea) => linea.split('=')[0].trim()));
const mysql = randomBytes(24).toString('hex');
const variables = [
  ['COMPOSE_PROJECT_NAME', `incidentes-u6-${randomBytes(4).toString('hex')}`],
  ['MYSQL_ROOT_PASSWORD', randomBytes(24).toString('hex')],
  ['MYSQL_PASSWORD', mysql],
  ['DATABASE_URL', `"mysql://incidentes_app:${mysql}@127.0.0.1:3307/incidentes_db?connect_timeout=5"`],
  ['DATABASE_URL_PRUEBAS', `"mysql://incidentes_app:${mysql}@127.0.0.1:3308/incidentes_test?connect_timeout=5"`],
  ['PORT', '3001'],
  ['JWT_SECRET', randomBytes(48).toString('base64url')],
  ['JWT_EXPIRES_IN', '30m'],
  ['CLIENT_ORIGIN', 'http://127.0.0.1:5173,http://127.0.0.1:4173'],
  ['CLAVE_ADMIN', clave()],
  ['CLAVE_SUPERVISOR', clave()],
  ['CLAVE_ANALISTA', clave()],
];
// Si .env ya existe, solo se agregan las variables nuevas: no se cambian las contraseñas de MySQL.
const faltantes = actual && existentes.has('MYSQL_PASSWORD')
  ? variables.filter(([nombre]) => !existentes.has(nombre) && !['COMPOSE_PROJECT_NAME', 'MYSQL_ROOT_PASSWORD', 'MYSQL_PASSWORD', 'DATABASE_URL', 'DATABASE_URL_PRUEBAS'].includes(nombre))
  : variables;
if (faltantes.length) {
  const separador = actual && !actual.endsWith('\n') ? '\n' : '';
  fs.writeFileSync(archivo, actual + separador + faltantes.map(([nombre, valor]) => `${nombre}=${valor}`).join('\n') + '\n');
  console.log(actual
    ? `.env actualizado con: ${faltantes.map(([nombre]) => nombre).join(', ')}.`
    : '.env creado con contraseñas y secretos locales aleatorios.');
} else {
  console.log('.env ya tiene todas las variables; se conserva la configuración.');
}

// El cliente tiene su propio archivo: solo conoce la URL pública de la API, nunca los secretos.
const archivoCliente = path.join(raiz, 'frontend', '.env');
if (!fs.existsSync(archivoCliente)) {
  fs.writeFileSync(archivoCliente, 'VITE_API_URL=http://127.0.0.1:3001/api\n');
  console.log('frontend/.env creado con la URL de la API.');
}
console.log('No incluyas los archivos .env en la entrega.');
