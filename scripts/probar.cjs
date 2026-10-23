require('dotenv').config({ quiet: true });
const { spawnSync } = require('node:child_process');
const url = process.env.DATABASE_URL_PRUEBAS;
if (!url || new URL(url).pathname !== '/incidentes_test' || new URL(url).port !== '5434') {
  console.error('Configura DATABASE_URL_PRUEBAS para incidentes_test en el puerto 5434.');
  process.exit(1);
}
// En GitHub Actions la base de pruebas ya es un contenedor de servicio del workflow: no se usa Docker Compose.
const enActions = process.env.GITHUB_ACTIONS === 'true';
// Las pruebas envían cientos de solicitudes seguidas: usan un límite propio por minuto.
const entorno = { ...process.env, DATABASE_URL: url, LIMITE_POR_MINUTO: '400' };
function ejecutar(programa, argumentos) {
  const resultado = spawnSync(programa, argumentos, { stdio: 'inherit', env: entorno });
  if (resultado.error || resultado.status !== 0) throw new Error('No se completó la prueba.');
}
try {
  if (!enActions) ejecutar('docker', ['compose', '--profile', 'pruebas', 'up', '-d', '--wait', 'postgres-test']);
  ejecutar(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
  // --silent: oculta el registro de cada solicitud (cientos de líneas); el resultado de cada prueba sí se muestra.
  ejecutar(process.execPath, ['--experimental-vm-modules', '--disable-warning=ExperimentalWarning', 'node_modules/jest/bin/jest.js', '--selectProjects', 'api', '--runInBand', '--silent', ...process.argv.slice(2)]);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { if (!enActions) spawnSync('docker', ['compose', 'stop', 'postgres-test'], { stdio: 'ignore' }); }
