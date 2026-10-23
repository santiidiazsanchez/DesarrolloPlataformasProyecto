require('dotenv').config({ quiet: true });
const { spawnSync } = require('node:child_process');
const url = process.env.DATABASE_URL_PRUEBAS;
if (!url || new URL(url).pathname !== '/incidentes_test' || new URL(url).port !== '3308') {
  console.error('Configura DATABASE_URL_PRUEBAS para incidentes_test en el puerto 3308.');
  process.exit(1);
}
// Las pruebas envían cientos de solicitudes seguidas: usan un límite propio por minuto.
const entorno = { ...process.env, DATABASE_URL: url, LIMITE_POR_MINUTO: '400' };
function ejecutar(programa, argumentos) {
  const resultado = spawnSync(programa, argumentos, { stdio: 'inherit', env: entorno });
  if (resultado.error || resultado.status !== 0) throw new Error('No se completó la prueba.');
}
try {
  ejecutar('docker', ['compose', '--profile', 'pruebas', 'up', '-d', '--wait', 'mysql-test']);
  ejecutar(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
  // --silent: oculta el registro de cada solicitud (cientos de líneas); el resultado de cada prueba sí se muestra.
  ejecutar(process.execPath, ['--experimental-vm-modules', '--disable-warning=ExperimentalWarning', 'node_modules/jest/bin/jest.js', '--selectProjects', 'api', '--runInBand', '--silent', ...process.argv.slice(2)]);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { spawnSync('docker', ['compose', 'stop', 'mysql-test'], { stdio: 'ignore' }); }
