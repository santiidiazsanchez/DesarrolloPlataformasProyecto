// Matriz de casos de seguridad e integración (Unidad 6).
// Levanta la API en un puerto temporal con la base de desarrollo, ejecuta cada caso
// y guarda la solicitud, el resultado esperado y el obtenido en evidencias/Unidad 6.
// Usa una instancia propia: el bloqueo por fuerza bruta no afecta a la API de npm run dev.
const fs = require('node:fs');
const path = require('node:path');
const app = require('../backend/app');
const prisma = require('../backend/config/prisma');

const carpeta = path.join(__dirname, '..', 'evidencias', 'Unidad 6');
const registro = [];
let base;

async function pedir(metodo, ruta, { token, cuerpo, headers = {} } = {}) {
  const encabezados = { ...headers };
  if (token) encabezados.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  const respuesta = await fetch(base + ruta, { method: metodo, headers: encabezados, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  const texto = await respuesta.text();
  let datos = texto;
  try { datos = JSON.parse(texto); } catch { /* 204 sin cuerpo */ }
  return { estado: respuesta.status, datos, headers: Object.fromEntries(respuesta.headers) };
}
const recortar = (token) => token.slice(0, 24) + '…';

async function caso(id, nombre, rol, solicitud, esperado, ejecutar) {
  const { estado, datos, detalle } = await ejecutar();
  const correcto = estado === esperado;
  registro.push({ id, caso: nombre, rol, solicitud, esperado, obtenido: estado, resultado: correcto ? 'Correcto' : 'Falló', respuesta: datos, detalle });
  console.log(`${correcto ? '✔' : '✖'} ${id} ${nombre}: esperado ${esperado}, obtenido ${estado}`);
}

async function ejecutarCasos() {
  const tokens = {};
  for (const rol of ['admin', 'supervisor', 'analista']) {
    const { datos } = await pedir('POST', '/auth/login', { cuerpo: { correo: `${rol}@incidentes.local`, password: process.env[`CLAVE_${rol.toUpperCase()}`] } });
    tokens[rol] = datos.token;
  }
  const valido = {
    titulo: '<b>Acceso remoto</b> no reconocido <script>alert(1)</script>', tipo: 'Acceso no autorizado', fecha: '2026-10-08',
    prioridad: 'Alta', estado: 'Registrado', descripcion: 'La VPN registró un acceso desde un país no habitual a la cuenta de R&D; la sesión duró > 10 min.',
    correo: 'redes@example.com', evidencia: 'registro-vpn.png',
  };
  let creado;

  await caso('C01', 'Inicio de sesión correcto', 'Analista', 'POST /api/auth/login', 200, async () => {
    const r = await pedir('POST', '/auth/login', { cuerpo: { correo: 'analista@incidentes.local', password: process.env.CLAVE_ANALISTA } });
    return { estado: r.estado, datos: { ...r.datos, token: recortar(r.datos.token) } };
  });
  await caso('C02', 'Contraseña incorrecta', 'Sin sesión', 'POST /api/auth/login', 401, () =>
    pedir('POST', '/auth/login', { cuerpo: { correo: 'analista@incidentes.local', password: 'NoEsLaClave-2026' } }));
  await caso('C03', 'Acceso sin token', 'Sin sesión', 'GET /api/incidentes', 401, async () => {
    const r = await pedir('GET', '/incidentes');
    return { ...r, detalle: { 'WWW-Authenticate': r.headers['www-authenticate'] } };
  });
  await caso('C04', 'Token manipulado (rol cambiado a ADMIN)', 'Analista', 'DELETE /api/incidentes/INC-001', 401, () => {
    const [cabecera, carga, firma] = tokens.analista.split('.');
    const datos = JSON.parse(Buffer.from(carga, 'base64url').toString());
    const alterada = Buffer.from(JSON.stringify({ ...datos, rol: 'ADMIN' })).toString('base64url');
    return pedir('DELETE', '/incidentes/INC-001', { token: `${cabecera}.${alterada}.${firma}` });
  });
  await caso('C05', 'Crear con etiquetas HTML (se limpian)', 'Analista', 'POST /api/incidentes', 201, async () => {
    const r = await pedir('POST', '/incidentes', { token: tokens.analista, cuerpo: valido });
    creado = r.datos;
    return { ...r, detalle: { tituloEnviado: valido.titulo, tituloGuardado: r.datos.titulo } };
  });
  await caso('C06', 'Consultar el incidente creado', 'Supervisor', `GET /api/incidentes/${creado.id}`, 200, () =>
    pedir('GET', `/incidentes/${creado.id}`, { token: tokens.supervisor }));
  await caso('C07', 'Permiso insuficiente: eliminar', 'Analista', `DELETE /api/incidentes/${creado.id}`, 403, () =>
    pedir('DELETE', `/incidentes/${creado.id}`, { token: tokens.analista }));
  await caso('C08', 'Permiso insuficiente: crear', 'Supervisor', 'POST /api/incidentes', 403, () =>
    pedir('POST', '/incidentes', { token: tokens.supervisor, cuerpo: { ...valido, titulo: 'Intento del supervisor' } }));
  await caso('C09', 'Actualizar el estado', 'Supervisor', `PUT /api/incidentes/${creado.id}`, 200, () =>
    pedir('PUT', `/incidentes/${creado.id}`, { token: tokens.supervisor, cuerpo: { ...valido, estado: 'En revisión' } }));
  await caso('C10', 'Datos inválidos y campo interno "rol"', 'Admin', 'POST /api/incidentes', 400, () =>
    pedir('POST', '/incidentes', { token: tokens.admin, cuerpo: { ...valido, titulo: 'abc', correo: 'mesa@intranet', fecha: '2999-01-01', evidencia: 'virus.exe', rol: 'ADMIN' } }));
  await caso('C11', 'Título solo con `<script>`', 'Admin', 'POST /api/incidentes', 400, () =>
    pedir('POST', '/incidentes', { token: tokens.admin, cuerpo: { ...valido, titulo: '<script>alert(1)</script>' } }));
  await caso('C12', 'Eliminar con rol autorizado', 'Admin', `DELETE /api/incidentes/${creado.id}`, 204, () =>
    pedir('DELETE', `/incidentes/${creado.id}`, { token: tokens.admin }));
  await caso('C13', 'Consultar el incidente eliminado', 'Admin', `GET /api/incidentes/${creado.id}`, 404, () =>
    pedir('GET', `/incidentes/${creado.id}`, { token: tokens.admin }));
  await caso('C14', 'CORS: preflight del cliente permitido', 'Navegador', 'OPTIONS /api/incidentes', 204, async () => {
    const r = await pedir('OPTIONS', '/incidentes', { headers: { Origin: 'http://127.0.0.1:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } });
    return { ...r, detalle: Object.fromEntries(Object.entries(r.headers).filter(([nombre]) => nombre.startsWith('access-control'))) };
  });
  await caso('C15', 'CORS: origen no permitido', 'Navegador', 'GET /api/incidentes', 403, async () => {
    const r = await pedir('GET', '/incidentes', { token: tokens.admin, headers: { Origin: 'http://sitio-externo.example' } });
    return { ...r, detalle: { 'Access-Control-Allow-Origin': r.headers['access-control-allow-origin'] ?? '(ausente)' } };
  });
  await caso('C16', 'Fuerza bruta: sexto intento fallido', 'Sin sesión', 'POST /api/auth/login x6', 429, async () => {
    let r;
    for (let intento = 0; intento < 6; intento++) r = await pedir('POST', '/auth/login', { cuerpo: { correo: 'admin@incidentes.local', password: `Intento-${intento}-incorrecto` } });
    return r;
  });
}

const servidor = app.listen(0, '127.0.0.1', async () => {
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  try {
    await ejecutarCasos();
    fs.mkdirSync(carpeta, { recursive: true });
    fs.writeFileSync(path.join(carpeta, 'casos-de-prueba.json'), JSON.stringify({ fecha: new Date().toISOString(), casos: registro }, null, 2) + '\n');
    const filas = registro.map((c) => `| ${c.id} | ${c.caso} | ${c.rol} | \`${c.solicitud}\` | ${c.esperado} | ${c.obtenido} | ${c.resultado} |`);
    fs.writeFileSync(path.join(carpeta, 'casos-de-prueba.md'), ['# Casos de prueba — Unidad 6', '', `Ejecutados con \`npm run casos\`. Fecha: ${new Date().toLocaleString('es-EC')}`, '',
      '| Id | Caso | Rol | Solicitud | Esperado | Obtenido | Resultado |', '| --- | --- | --- | --- | --- | --- | --- |', ...filas, ''].join('\n'));
    const fallidos = registro.filter((c) => c.resultado !== 'Correcto').length;
    console.log(`\n${registro.length - fallidos} de ${registro.length} casos correctos. Evidencia en evidencias/Unidad 6/casos-de-prueba.md`);
    if (fallidos) process.exitCode = 1;
  } catch {
    console.error('No se pudieron ejecutar los casos. Revisa PostgreSQL, las migraciones y npm run db:ejemplos.');
    process.exitCode = 1;
  } finally {
    servidor.close();
    await prisma.$disconnect();
  }
});
