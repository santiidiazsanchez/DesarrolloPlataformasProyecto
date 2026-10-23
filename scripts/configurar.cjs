const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');

// Contraseña legible para las cuentas de prueba (16 caracteres aleatorios).
const clave = () => 'Inc-' + randomBytes(9).toString('base64url');

const raiz = path.join(__dirname, '..');
const archivo = path.join(raiz, '.env');
let actual = fs.existsSync(archivo) ? fs.readFileSync(archivo, 'utf8') : '';
// Un .env de la Unidad 7 (MySQL) se migra: se quitan las variables de MySQL y se crean las de PostgreSQL.
// JWT_SECRET y las contraseñas de las cuentas de prueba se conservan.
if (/^DATABASE_URL=.*mysql:\/\//m.test(actual)) {
  actual = actual.split(/\r?\n/).filter((linea) => !/^(MYSQL_\w+|DATABASE_URL|DATABASE_URL_PRUEBAS|COMPOSE_PROJECT_NAME)=/.test(linea)).join('\n');
  console.log('.env tenía la configuración de MySQL: se reemplaza por la de PostgreSQL.');
}
const existentes = new Set(actual.split(/\r?\n/).map((linea) => linea.split('=')[0].trim()));
const postgres = randomBytes(24).toString('hex');
const base = ['COMPOSE_PROJECT_NAME', 'POSTGRES_PASSWORD', 'DATABASE_URL', 'DATABASE_URL_PRUEBAS'];
const variables = [
  ['COMPOSE_PROJECT_NAME', `incidentes-u8-${randomBytes(4).toString('hex')}`],
  ['POSTGRES_PASSWORD', postgres],
  ['DATABASE_URL', `"postgresql://incidentes_app:${postgres}@127.0.0.1:5433/incidentes_db?connect_timeout=5"`],
  ['DATABASE_URL_PRUEBAS', `"postgresql://incidentes_app:${postgres}@127.0.0.1:5434/incidentes_test?connect_timeout=5"`],
  ['PORT', '3001'],
  ['JWT_SECRET', randomBytes(48).toString('base64url')],
  ['JWT_EXPIRES_IN', '30m'],
  ['CLIENT_ORIGIN', 'http://127.0.0.1:5173,http://127.0.0.1:4173'],
  ['CLAVE_ADMIN', clave()],
  ['CLAVE_SUPERVISOR', clave()],
  ['CLAVE_ANALISTA', clave()],
];
// Si .env ya tiene la base configurada, solo se agregan las variables nuevas: no se cambian las contraseñas de PostgreSQL.
const faltantes = existentes.has('POSTGRES_PASSWORD')
  ? variables.filter(([nombre]) => !existentes.has(nombre) && !base.includes(nombre))
  : variables.filter(([nombre]) => !existentes.has(nombre));
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
