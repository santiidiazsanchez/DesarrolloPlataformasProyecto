// Verificación de la plataforma desplegada (Unidad 8): prueba de humo y casos con datos correctos e incorrectos
// contra las URL públicas. Lee API_URL, WEB_URL y las contraseñas de demostración de .env.produccion (npm run produccion).
// Sin contraseñas solo ejecuta los casos públicos: así corre en GitHub Actions después de cada despliegue.
// --esperar <commit>: antes de probar, espera hasta 10 minutos a que /api/salud informe ese commit.
const fs = require('node:fs');
const path = require('node:path');

const API = (process.env.API_URL || '').replace(/\/$/, '');
const WEB = (process.env.WEB_URL || '').replace(/\/$/, '');
if (!API.startsWith('https://') || !WEB.startsWith('https://')) {
  console.error('Define API_URL (https://…/api) y WEB_URL (https://…) en .env.produccion o en el entorno.');
  process.exit(1);
}
const conCuentas = ['ADMIN', 'SUPERVISOR', 'ANALISTA'].every((rol) => process.env[`CLAVE_${rol}`]);
const posicion = process.argv.indexOf('--esperar');
const commitEsperado = posicion > 0 ? (process.argv[posicion + 1] || '').slice(0, 7) : '';
const registro = [];
let version = 'desconocida';

async function pedir(metodo, ruta, { token, cuerpo, headers = {}, base = API, redirect = 'follow' } = {}) {
  const encabezados = { ...headers };
  if (token) encabezados.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  const inicio = Date.now();
  const respuesta = await fetch(base + ruta, { method: metodo, headers: encabezados, redirect,
    body: cuerpo === undefined ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo) });
  const texto = await respuesta.text();
  let datos = texto;
  try { datos = JSON.parse(texto); } catch { /* HTML del cliente o 204 sin cuerpo */ }
  return { estado: respuesta.status, datos, headers: respuesta.headers, ms: Date.now() - inicio };
}

async function caso(id, nombre, solicitud, esperado, ejecutar) {
  let resultado;
  try { resultado = await ejecutar(); } catch (error) { resultado = { estado: 0, detalle: error.message }; }
  const { estado, ok = true, detalle = '' } = resultado;
  const esperados = [].concat(esperado);
  const correcto = ok && esperados.includes(estado);
  registro.push({ id, caso: nombre, solicitud, esperado: esperados.join(' o '), obtenido: estado, correcto, detalle });
  console.log(`${correcto ? '✔' : '✖'} ${id} ${nombre}: esperado ${esperados.join('/')}, obtenido ${estado}${detalle ? ` (${detalle})` : ''}`);
  return resultado;
}

// El plan gratuito de Render tarda en despertar y en terminar un despliegue: se consulta cada 15 segundos.
async function esperarVersion() {
  const limite = Date.now() + 10 * 60 * 1000;
  for (;;) {
    try {
      const { datos } = await pedir('GET', '/salud');
      if (datos.version === commitEsperado) return console.log(`La API ya ejecuta el commit ${commitEsperado}.`);
      console.log(`En línea: ${datos.version || 'sin respuesta'}. Esperando ${commitEsperado}…`);
    } catch { console.log('La API todavía no responde…'); }
    if (Date.now() > limite) throw new Error(`Después de 10 minutos la API no ejecuta el commit ${commitEsperado}.`);
    await new Promise((listo) => setTimeout(listo, 15000));
  }
}

async function casosPublicos() {
  await caso('P01', 'Health check con la base conectada', 'GET /api/salud', 200, async () => {
    const r = await pedir('GET', '/salud');
    version = r.datos.version;
    return { estado: r.estado, ok: r.datos.baseDeDatos === 'conectada', detalle: `versión ${r.datos.version}, ${r.ms} ms` };
  });
  await caso('P02', 'HTTP redirige a HTTPS', 'GET http://…/api/salud', [301, 302, 307, 308], async () => {
    const r = await pedir('GET', '/salud', { base: API.replace('https://', 'http://'), redirect: 'manual' });
    return { estado: r.estado, ok: (r.headers.get('location') || '').startsWith('https://') };
  });
  await caso('P03', 'HSTS y encabezados de Helmet', 'GET /api/salud', 200, async () => {
    const r = await pedir('GET', '/salud');
    const hsts = r.headers.get('strict-transport-security') || '';
    const ok = /max-age=\d+/.test(hsts) && r.headers.get('x-content-type-options') === 'nosniff' && !r.headers.get('x-powered-by');
    return { estado: r.estado, ok, detalle: hsts };
  });
  await caso('P04', 'El cliente React carga por HTTPS con CSP', 'GET / (sitio)', 200, async () => {
    const r = await pedir('GET', '/', { base: WEB });
    // Encabezados del panel Headers de Render: el cliente solo llama a su API y no se muestra dentro de un iframe.
    const csp = r.headers.get('content-security-policy') || '';
    const ok = (r.headers.get('content-type') || '').includes('text/html') && csp.includes(`connect-src 'self' ${new URL(API).origin}`)
      && csp.includes("frame-ancestors 'none'") && r.headers.get('x-frame-options') === 'DENY';
    return { estado: r.estado, ok, detalle: ok ? '' : 'faltan CSP o X-Frame-Options' };
  });
  await caso('P05', 'CORS acepta el dominio del cliente', 'OPTIONS /api/incidentes', 204, async () => {
    const r = await pedir('OPTIONS', '/incidentes', { headers: { Origin: WEB, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization' } });
    return { estado: r.estado, ok: r.headers.get('access-control-allow-origin') === WEB };
  });
  await caso('P06', 'CORS rechaza otro dominio', 'GET /api/incidentes con Origin externo', 403, async () => {
    const r = await pedir('GET', '/incidentes', { headers: { Origin: 'https://sitio-externo.example' } });
    return { estado: r.estado, ok: !r.headers.get('access-control-allow-origin') };
  });
  await caso('P07', 'Acceso sin token', 'GET /api/incidentes', 401, async () => {
    const r = await pedir('GET', '/incidentes');
    return { estado: r.estado, ok: r.headers.get('www-authenticate') === 'Bearer' };
  });
  await caso('P08', 'Token sin firma (alg none) con rol ADMIN', 'DELETE /api/incidentes/INC-001', 401, () => {
    const parte = (objeto) => Buffer.from(JSON.stringify(objeto)).toString('base64url');
    return pedir('DELETE', '/incidentes/INC-001', { token: `${parte({ alg: 'none', typ: 'JWT' })}.${parte({ sub: '1', rol: 'ADMIN' })}.` });
  });
  await caso('P09', 'Contraseña incorrecta', 'POST /api/auth/login', 401, () =>
    pedir('POST', '/auth/login', { cuerpo: { correo: 'analista@incidentes.local', password: 'NoEsLaClave-2026' } }));
  await caso('P10', 'JSON mal formado', 'POST /api/auth/login', 400, () => pedir('POST', '/auth/login', { cuerpo: '{"correo":' }));
  await caso('P11', 'Ruta inexistente', 'GET /api/no-existe', 404, () => pedir('GET', '/no-existe'));
}

async function casosConCuentas() {
  const tokens = {};
  for (const rol of ['admin', 'supervisor', 'analista']) {
    const r = await pedir('POST', '/auth/login', { cuerpo: { correo: `${rol}@incidentes.local`, password: process.env[`CLAVE_${rol.toUpperCase()}`] } });
    tokens[rol] = r.datos.token;
  }
  await caso('P12', 'Inicio de sesión de las tres cuentas', 'POST /api/auth/login', 200, async () => ({ estado: Object.values(tokens).every(Boolean) ? 200 : 401 }));
  await caso('P13', 'El analista lista los incidentes', 'GET /api/incidentes', 200, async () => {
    const r = await pedir('GET', '/incidentes', { token: tokens.analista });
    return { estado: r.estado, detalle: `${r.datos.total} registros` };
  });
  const momento = new Date().toISOString();
  // Fecha de ayer: la API rechaza fechas futuras según su propia zona horaria (UTC en Render).
  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const incidente = {
    titulo: `Verificación en producción ${momento.slice(0, 19).replace('T', ' ')}`, tipo: 'Acceso no autorizado', fecha: ayer,
    prioridad: 'Media', estado: 'Registrado', descripcion: 'Registro de demostración creado por npm run produccion para comprobar el CRUD desplegado.',
    correo: 'evaluacion@example.com', evidencia: '',
  };
  let codigo;
  try {
    await caso('P14', 'El analista registra un incidente', 'POST /api/incidentes', 201, async () => {
      const r = await pedir('POST', '/incidentes', { token: tokens.analista, cuerpo: incidente });
      codigo = r.datos.id;
      return { estado: r.estado, ok: (r.headers.get('location') || '').endsWith(`/${codigo}`), detalle: codigo };
    });
    await caso('P15', 'Datos inválidos: fecha futura, correo y HTML', 'POST /api/incidentes', 400, async () => {
      const r = await pedir('POST', '/incidentes', { token: tokens.analista,
        cuerpo: { ...incidente, titulo: '<script>alert(1)</script>', fecha: '2999-01-01', correo: 'no-es-correo' } });
      return { estado: r.estado, ok: Boolean(r.datos.campos), detalle: Object.keys(r.datos.campos || {}).join(', ') };
    });
    await caso('P16', 'Título repetido', 'POST /api/incidentes', 409, () => pedir('POST', '/incidentes', { token: tokens.analista, cuerpo: incidente }));
    await caso('P17', 'Rol insuficiente: el analista intenta eliminar', `DELETE /api/incidentes/${codigo}`, 403, () =>
      pedir('DELETE', `/incidentes/${codigo}`, { token: tokens.analista }));
    await caso('P18', 'El supervisor cambia el estado', `PUT /api/incidentes/${codigo}`, 200, async () => {
      const r = await pedir('PUT', `/incidentes/${codigo}`, { token: tokens.supervisor, cuerpo: { ...incidente, estado: 'En revisión' } });
      return { estado: r.estado, ok: r.datos.estado === 'En revisión' };
    });
    await caso('P19', 'El cambio persiste en una nueva consulta', `GET /api/incidentes/${codigo}`, 200, async () => {
      const r = await pedir('GET', `/incidentes/${codigo}`, { token: tokens.analista });
      return { estado: r.estado, ok: r.datos.estado === 'En revisión' };
    });
    await caso('P20', 'El administrador elimina el incidente', `DELETE /api/incidentes/${codigo}`, 204, () =>
      pedir('DELETE', `/incidentes/${codigo}`, { token: tokens.admin }));
    await caso('P21', 'El incidente eliminado ya no existe', `GET /api/incidentes/${codigo}`, 404, () =>
      pedir('GET', `/incidentes/${codigo}`, { token: tokens.analista }));
  } finally {
    // Si un caso falló a la mitad, no se deja el registro de demostración en producción.
    if (codigo && !registro.some((r) => r.id === 'P20' && r.correcto)) await pedir('DELETE', `/incidentes/${codigo}`, { token: tokens.admin });
  }
}

function guardar() {
  const correctos = registro.filter((r) => r.correcto).length;
  const lineas = [
    '# Verificación en producción', '',
    `- Fecha: ${new Date().toISOString()}`, `- API: ${API}`, `- Cliente: ${WEB}`, `- Versión en línea: ${version}`,
    `- Resultado: ${correctos} de ${registro.length} casos correctos`, '',
    '| Caso | Solicitud | Esperado | Obtenido |', '|---|---|---|---|',
    ...registro.map((r) => `| ${r.correcto ? '✔' : '✖'} ${r.id} ${r.caso} | ${r.solicitud} | ${r.esperado} | ${r.obtenido} |`), '',
  ];
  // En GitHub Actions la tabla queda en el resumen de la ejecución; en la computadora, en evidencias.
  if (process.env.GITHUB_STEP_SUMMARY) return fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lineas.join('\n'));
  const carpeta = path.join(__dirname, '..', 'evidencias', 'Unidad 8');
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(path.join(carpeta, 'pruebas-produccion.md'), lineas.join('\n'));
  fs.writeFileSync(path.join(carpeta, 'pruebas-produccion.json'), JSON.stringify({ api: API, web: WEB, version, casos: registro }, null, 2) + '\n');
  console.log('Resultados guardados en evidencias/Unidad 8/pruebas-produccion.md');
}

(async () => {
  if (commitEsperado) await esperarVersion();
  await casosPublicos();
  if (conCuentas) await casosConCuentas();
  else console.log('Sin CLAVE_ADMIN, CLAVE_SUPERVISOR y CLAVE_ANALISTA: se omiten los casos con sesión.');
  guardar();
  const fallidos = registro.filter((r) => !r.correcto).length;
  console.log(fallidos ? `${fallidos} caso(s) fallaron.` : `Los ${registro.length} casos son correctos.`);
  if (fallidos) process.exitCode = 1;
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
