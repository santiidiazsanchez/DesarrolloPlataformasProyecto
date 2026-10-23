// Mediciones comparables para la Unidad 7. Uso:
//   node scripts/medir.cjs consulta antes|despues
//   node scripts/medir.cjs red antes|despues
//   node scripts/medir.cjs imagen antes|despues
// Consulta y red usan la base de pruebas (puerto 5434) con 50 000 incidentes; no tocan la base de desarrollo.
require('dotenv').config({ quiet: true });
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawnSync } = require('node:child_process');

const [tipo, etiqueta = 'antes'] = process.argv.slice(2);
const url = process.env.DATABASE_URL_PRUEBAS;
if (!['consulta', 'red', 'imagen'].includes(tipo) || !url || new URL(url).pathname !== '/incidentes_test') {
  console.error('Uso: node scripts/medir.cjs consulta|red|imagen antes|despues (requiere DATABASE_URL_PRUEBAS).');
  process.exit(1);
}
process.env.DATABASE_URL = url;
process.env.LIMITE_POR_MINUTO = '5000';
const TOTAL = 50000;
const REPETICIONES = 30;
const salida = path.join(__dirname, '..', 'evidencias', 'Unidad 7');

function ejecutar(programa, argumentos) {
  const resultado = spawnSync(programa, argumentos, { stdio: 'ignore', env: process.env });
  if (resultado.status !== 0) throw new Error(`Falló: ${programa} ${argumentos.join(' ')}`);
}
const mediana = (valores) => [...valores].sort((a, b) => a - b)[Math.floor(valores.length / 2)];
const p95 = (valores) => [...valores].sort((a, b) => a - b)[Math.floor(valores.length * 0.95)];
const redondear = (n) => Math.round(n * 100) / 100;

// Datos repetibles: el mismo generador produce siempre los mismos 50 000 registros.
function generador(semilla) {
  let estado = semilla;
  return () => { estado = (estado * 1103515245 + 12345) % 2147483648; return estado / 2147483648; };
}
async function sembrar(prisma) {
  // Solo quedan los registros generados: así cada medición usa exactamente los mismos datos.
  await prisma.incidente.deleteMany({ where: { NOT: { titulo: { startsWith: 'Incidente de prueba' } } } });
  if (await prisma.incidente.count() === TOTAL) return;
  await prisma.incidente.deleteMany();
  const azar = generador(7);
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
  const tipos = ['Phishing', 'Malware', 'Acceso no autorizado', 'Fallo de disponibilidad', 'Vulnerabilidad'];
  const prioridades = ['Alta', 'Media', 'Media', 'Baja', 'Baja'];
  const estados = ['Registrado', 'En_revision', 'Resuelto', 'Resuelto'];
  const frases = ['Se detectó actividad inusual en el equipo del laboratorio.', 'El usuario reportó un mensaje que solicitaba sus credenciales.',
    'El servicio dejó de responder durante varios minutos.', 'El antivirus bloqueó un archivo descargado desde un sitio externo.',
    'Se revisaron los registros del servidor y se aisló la estación afectada.', 'El equipo de redes confirmó la restauración del servicio.'];
  for (let inicio = 0; inicio < TOTAL; inicio += 2000) {
    const lote = [];
    for (let i = inicio; i < Math.min(inicio + 2000, TOTAL); i++) {
      const descripcion = Array.from({ length: 3 + Math.floor(azar() * 4) }, () => elegir(frases)).join(' ');
      lote.push({ titulo: `Incidente de prueba ${String(i + 1).padStart(5, '0')}`, tipo: elegir(tipos), fecha: new Date(Date.UTC(2026, Math.floor(azar() * 9), 1 + Math.floor(azar() * 28))),
        prioridad: elegir(prioridades), estado: elegir(estados), descripcion, correo: `usuario${i % 300}@example.com`, evidencia: azar() < 0.3 ? 'captura.png' : '' });
    }
    await prisma.incidente.createMany({ data: lote });
  }
}

async function medirConsulta(prisma) {
  const modelo = require('../backend/models/incidentes');
  const escenarios = [
    ['Lista inicial, página 1', { pagina: 1, limite: 10 }],
    ['Filtro Alta + Resuelto, página 1', { prioridad: 'Alta', estado: 'Resuelto', pagina: 1, limite: 10 }],
    ['Filtro Alta + Resuelto, página 200', { prioridad: 'Alta', estado: 'Resuelto', pagina: 200, limite: 10 }],
  ];
  const resultados = [];
  for (const [nombre, filtros] of escenarios) {
    for (let i = 0; i < 3; i++) await modelo.listar(filtros); // calentamiento
    const tiempos = [];
    for (let i = 0; i < REPETICIONES; i++) {
      const inicio = process.hrtime.bigint();
      await modelo.listar(filtros);
      tiempos.push(Number(process.hrtime.bigint() - inicio) / 1e6);
    }
    resultados.push({ escenario: nombre, medianaMs: redondear(mediana(tiempos)), p95Ms: redondear(p95(tiempos)) });
  }
  // Estadísticas al día después de la carga masiva, para que el plan estime bien las filas.
  await prisma.$executeRawUnsafe('ANALYZE "Incidente"');
  // PostgreSQL devuelve el plan como filas de texto en la columna "QUERY PLAN"; la línea con "Scan" dice cómo se leyó la tabla.
  const plan = async (consulta) => {
    const analisis = (await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE ${consulta}`)).map((fila) => fila['QUERY PLAN']);
    const lectura = analisis.find((linea) => linea.includes('Scan')) || analisis[0];
    return { tipo: lectura.replace('->', '').trim().split(' on ')[0].split(' using ')[0], indice: (lectura.match(/using "?(\w+)"?/) || [])[1] || 'ninguno',
      filasEstimadas: Number((lectura.match(/rows=(\d+)/) || [])[1]), analisis };
  };
  const planes = {
    conteo: await plan(`SELECT COUNT(*) FROM "Incidente" WHERE prioridad = 'Alta' AND estado = 'Resuelto'`),
    pagina: await plan(`SELECT * FROM "Incidente" WHERE prioridad = 'Alta' AND estado = 'Resuelto' ORDER BY id LIMIT 10 OFFSET 1990`),
  };
  const indices = (await prisma.$queryRawUnsafe(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'Incidente' ORDER BY indexname`))
    .map((i) => `${i.indexname}${i.indexdef.slice(i.indexdef.lastIndexOf('('))}`);
  return { resultados, planes, indices };
}

function pedir(puerto, ruta, token, codificacion = 'gzip, deflate, br') {
  return new Promise((resolve, reject) => {
    const inicio = process.hrtime.bigint();
    const solicitud = http.get({ host: '127.0.0.1', port: puerto, path: ruta,
      headers: { Authorization: `Bearer ${token}`, 'Accept-Encoding': codificacion } }, (respuesta) => {
      let bytes = 0;
      respuesta.on('data', (trozo) => { bytes += trozo.length; });
      respuesta.on('end', () => resolve({ estado: respuesta.statusCode, bytes, codificacion: respuesta.headers['content-encoding'] || 'ninguna',
        ms: Number(process.hrtime.bigint() - inicio) / 1e6 }));
    });
    solicitud.on('error', reject);
  });
}
async function medirRed(prisma) {
  // Cuenta de prueba en la base de mediciones (sin agregar incidentes de ejemplo).
  const passwordHash = await require('bcryptjs').hash(process.env.CLAVE_ANALISTA, 12);
  await prisma.usuario.upsert({ where: { correo: 'analista@incidentes.local' }, update: { passwordHash, rol: 'ANALISTA', activo: true },
    create: { nombre: 'Analista de prueba', correo: 'analista@incidentes.local', rol: 'ANALISTA', passwordHash } });
  const app = require('../backend/app');
  const servidor = app.listen(0, '127.0.0.1');
  await new Promise((r) => servidor.once('listening', r));
  const puerto = servidor.address().port;
  const login = await fetch(`http://127.0.0.1:${puerto}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'analista@incidentes.local', password: process.env.CLAVE_ANALISTA }) });
  const { token } = await login.json();
  const resultados = [];
  for (const ruta of ['/api/incidentes?pagina=1&limite=10', '/api/incidentes?pagina=1&limite=50']) {
    for (let i = 0; i < 3; i++) await pedir(puerto, ruta, token);
    const muestras = [];
    for (let i = 0; i < REPETICIONES; i++) muestras.push(await pedir(puerto, ruta, token));
    const sinCompresion = await pedir(puerto, ruta, token, 'identity');
    resultados.push({ solicitud: `GET ${ruta}`, estado: muestras[0].estado, bytesJson: sinCompresion.bytes, bytesTransferidos: muestras[0].bytes,
      codificacion: muestras[0].codificacion, medianaMs: redondear(mediana(muestras.map((m) => m.ms))) });
  }
  servidor.close();
  return { resultados };
}

// Imagen de ayuda: peso, formato y dimensiones de cada archivo que puede descargar el navegador.
async function medirImagen() {
  const sharp = require('sharp');
  const carpeta = path.join(__dirname, '..', 'frontend', 'public', 'recursos');
  const resultados = [];
  for (const nombre of fs.readdirSync(carpeta).filter((n) => n.startsWith('guia-phishing'))) {
    const { format, width, height } = await sharp(path.join(carpeta, nombre)).metadata();
    resultados.push({ archivo: nombre, formato: format, dimensiones: `${width}x${height}`, kilobytes: redondear(fs.statSync(path.join(carpeta, nombre)).size / 1024) });
  }
  return { resultados };
}

(async () => {
  if (tipo === 'imagen') {
    const datos = await medirImagen();
    const informe = { tipo, etiqueta, fecha: new Date().toISOString(), ...datos };
    fs.writeFileSync(path.join(salida, `medicion-imagen-${etiqueta}.json`), JSON.stringify(informe, null, 2) + '\n');
    console.log(`Medición de imagen (${etiqueta}):`);
    console.table(datos.resultados);
    return;
  }
  ejecutar('docker', ['compose', '--profile', 'pruebas', 'up', '-d', '--wait', 'postgres-test']);
  ejecutar(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy']);
  const prisma = require('../backend/config/prisma');
  try {
    await sembrar(prisma);
    const datos = tipo === 'consulta' ? await medirConsulta(prisma) : await medirRed(prisma);
    const informe = { tipo, etiqueta, fecha: new Date().toISOString(), registros: await prisma.incidente.count(), repeticiones: REPETICIONES, ...datos };
    fs.mkdirSync(salida, { recursive: true });
    fs.writeFileSync(path.join(salida, `medicion-${tipo}-${etiqueta}.json`), JSON.stringify(informe, null, 2) + '\n');
    console.log(`Medición de ${tipo} (${etiqueta}) con ${informe.registros} incidentes y ${REPETICIONES} repeticiones:`);
    console.table(datos.resultados);
    if (datos.planes) {
      console.log('Índices:', datos.indices.join(', '));
      for (const [nombre, plan] of Object.entries(datos.planes)) {
        console.log(`\nEXPLAIN ANALYZE (${nombre}): tipo=${plan.tipo}, índice=${plan.indice}`);
        console.log(plan.analisis.join('\n'));
      }
    }
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
