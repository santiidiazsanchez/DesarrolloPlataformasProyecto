// Pruebas de integración con Jest contra la base exclusiva incidentes_test (npm run test:api).
const assert = require('node:assert/strict');
jest.setTimeout(30000);
// fetch crea los objetos fuera del contexto de Jest: se comparan por contenido con toEqual.
const igual = (recibido, esperado) => expect(recibido).toEqual(esperado);
if (new URL(process.env.DATABASE_URL).pathname !== '/incidentes_test') throw new Error('Solo se prueba en incidentes_test.');
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const app = require('../app');
const errores = require('../middleware/errores');
let servidor;
let base;
let url;
const tokens = {};
const cuentas = {
  admin: ['admin@incidentes.local', process.env.CLAVE_ADMIN],
  supervisor: ['supervisor@incidentes.local', process.env.CLAVE_SUPERVISOR],
  analista: ['analista@incidentes.local', process.env.CLAVE_ANALISTA],
};
const ejemplo = {
  titulo: 'Acceso sospechoso al laboratorio', tipo: 'Acceso no autorizado', fecha: '2026-09-10',
  prioridad: 'Alta', estado: 'Registrado', descripcion: 'Se detectaron varios intentos fallidos de acceso al equipo del laboratorio.',
  correo: 'prueba@example.com', evidencia: '',
};
const conToken = (token = tokens.admin, extra = {}) => ({ headers: { Authorization: `Bearer ${token}`, ...extra } });
function opciones(method, datos, token = tokens.admin) {
  return { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(datos) };
}
function iniciarSesion(correo, password) {
  return fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo, password }) });
}
const total = async () => (await (await fetch(url, conToken())).json()).total;

beforeAll(async () => {
  await prisma.incidente.deleteMany();
  await prisma.usuario.deleteMany();
  // Reiniciar el contador solo en la base exclusiva de pruebas.
  await prisma.$executeRaw`ALTER TABLE Incidente AUTO_INCREMENT = 1`;
  const sembrado = spawnSync(process.execPath, ['prisma/seed.cjs'], { env: process.env });
  assert.equal(sembrado.status, 0);
  servidor = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => servidor.once('listening', resolve));
  base = `http://127.0.0.1:${servidor.address().port}/api`;
  url = `${base}/incidentes`;
  for (const [rol, [correo, clave]] of Object.entries(cuentas)) {
    const respuesta = await iniciarSesion(correo, clave);
    assert.equal(respuesta.status, 200);
    tokens[rol] = (await respuesta.json()).token;
  }
});
afterAll(async () => { await new Promise(resolve => servidor.close(resolve)); await prisma.$disconnect(); });

// ---------- Autenticación y contraseñas ----------

test('inicio de sesión correcto entrega un JWT HS256 de 30 minutos sin datos sensibles', async () => {
  const respuesta = await iniciarSesion(...cuentas.analista);
  assert.equal(respuesta.status, 200);
  const datos = await respuesta.json();
  igual(Object.keys(datos).sort(), ['expiraEn', 'token', 'usuario']);
  igual(datos.usuario, { nombre: 'Analista de prueba', correo: 'analista@incidentes.local', rol: 'ANALISTA',
    permisos: { consultar: true, crear: true, actualizar: false, eliminar: false } });
  const { header, payload } = jwt.decode(datos.token, { complete: true });
  assert.equal(header.alg, 'HS256');
  igual(Object.keys(payload).sort(), ['aud', 'exp', 'iat', 'iss', 'rol', 'sub']);
  assert.equal(payload.exp - payload.iat, 30 * 60);
  assert.ok(!JSON.stringify(datos).includes('passwordHash'));
});

test('credenciales incorrectas reciben el mismo 401 sin indicar qué campo falló', async () => {
  const claveMala = await iniciarSesion('admin@incidentes.local', 'NoEsLaClave-2026');
  const correoInexistente = await iniciarSesion('nadie@incidentes.local', 'NoEsLaClave-2026');
  assert.equal(claveMala.status, 401);
  assert.equal(correoInexistente.status, 401);
  igual(await claveMala.json(), await correoInexistente.json());
});

test('el inicio de sesión valida el cuerpo y rechaza campos adicionales', async () => {
  const respuesta = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo: 'no-es-correo', rol: 'ADMIN' }) });
  assert.equal(respuesta.status, 400);
  const { campos } = await respuesta.json();
  igual(Object.keys(campos), ['correo', 'password', 'rol']);
});

test('las contraseñas se guardan solo como hash bcrypt con costo 12', async () => {
  for (const [correo, clave] of Object.values(cuentas)) {
    const { passwordHash } = await prisma.usuario.findUnique({ where: { correo } });
    assert.match(passwordHash, /^\$2[aby]\$12\$/);
    assert.ok(!passwordHash.includes(clave));
    assert.equal(await bcrypt.compare(clave, passwordHash), true);
  }
});

// ---------- Autorización ----------

test('sin token, todas las rutas protegidas responden 401 con WWW-Authenticate', async () => {
  const solicitudes = [['GET', url], ['GET', `${url}/INC-001`], ['POST', url], ['PUT', `${url}/INC-001`], ['DELETE', `${url}/INC-001`], ['GET', `${base}/auth/perfil`]];
  for (const [method, direccion] of solicitudes) {
    const cuerpo = ['POST', 'PUT'].includes(method) ? JSON.stringify(ejemplo) : undefined;
    const respuesta = await fetch(direccion, { method, headers: { 'Content-Type': 'application/json' }, body: cuerpo });
    assert.equal(respuesta.status, 401);
    assert.equal(respuesta.headers.get('www-authenticate'), 'Bearer');
    assert.equal((await respuesta.json()).error, 'Inicia sesión para continuar.');
  }
  assert.equal((await fetch(`${base}/salud`)).status, 200); // la ruta de salud es pública
  assert.equal(await total(), 3);
});

test('tokens manipulados, sin firma, vencidos o de otra clave reciben 401', async () => {
  const { id } = await prisma.usuario.findUnique({ where: { correo: 'admin@incidentes.local' } });
  const comun = { subject: String(id), issuer: 'incidentes-api', audience: 'incidentes-web' };
  const [cabecera, , firma] = tokens.analista.split('.');
  const escalado = Buffer.from(JSON.stringify({ ...jwt.decode(tokens.analista), rol: 'ADMIN' })).toString('base64url');
  const sinFirma = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url') + '.'
    + Buffer.from(JSON.stringify({ rol: 'ADMIN', sub: String(id), iss: 'incidentes-api', aud: 'incidentes-web' })).toString('base64url') + '.';
  const invalidos = [
    `${cabecera}.${escalado}.${firma}`,
    sinFirma,
    jwt.sign({ rol: 'ADMIN', exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET, comun),
    jwt.sign({ rol: 'ADMIN' }, 'otra-clave-que-no-es-la-del-servidor-2026', { ...comun, expiresIn: '5m' }),
  ];
  for (const token of invalidos) {
    const respuesta = await fetch(`${url}/INC-001`, conToken(token, {}));
    assert.equal(respuesta.status, 401);
    assert.equal((await respuesta.json()).error, 'La sesión no es válida o venció. Inicia sesión de nuevo.');
  }
  assert.equal((await fetch(url, { headers: { Authorization: `Basic ${tokens.admin}` } })).status, 401);
});

test('permisos por rol: el servidor responde 403 aunque la interfaz oculte el botón', async () => {
  const creado = await fetch(url, opciones('POST', { ...ejemplo, titulo: 'Creado por la analista' }, tokens.analista));
  assert.equal(creado.status, 201);
  const { id } = await creado.json();
  const prohibidas = [
    ['PUT', tokens.analista], ['DELETE', tokens.analista],
    ['POST', tokens.supervisor], ['DELETE', tokens.supervisor],
  ];
  for (const [method, token] of prohibidas) {
    const direccion = method === 'POST' ? url : `${url}/${id}`;
    const respuesta = await fetch(direccion, method === 'DELETE' ? { method, ...conToken(token) } : opciones(method, { ...ejemplo, titulo: 'Intento sin permiso' }, token));
    assert.equal(respuesta.status, 403);
    igual(await respuesta.json(), { error: 'Tu rol no tiene permiso para esta acción.' });
  }
  assert.equal((await (await fetch(`${url}/${id}`, conToken(tokens.analista))).json()).titulo, 'Creado por la analista');
  const revision = await fetch(`${url}/${id}`, opciones('PUT', { ...ejemplo, titulo: 'Creado por la analista', estado: 'En revisión' }, tokens.supervisor));
  assert.equal(revision.status, 200);
  assert.equal((await revision.json()).estado, 'En revisión');
  assert.equal((await fetch(`${url}/${id}`, { method: 'DELETE', ...conToken(tokens.admin) })).status, 204);
  assert.equal(await total(), 3);
});

test('el perfil devuelve el rol y los permisos que usa la interfaz', async () => {
  const supervisor = await (await fetch(`${base}/auth/perfil`, conToken(tokens.supervisor))).json();
  assert.equal(supervisor.rol, 'SUPERVISOR');
  igual(supervisor.permisos, { consultar: true, crear: false, actualizar: true, eliminar: false });
  const admin = await (await fetch(`${base}/auth/perfil`, conToken(tokens.admin))).json();
  igual(admin.permisos, { consultar: true, crear: true, actualizar: true, eliminar: true });
});

test('un cambio de rol o una cuenta desactivada se aplican aunque el token siga vigente', async () => {
  const clave = 'Temporal-Prueba-2026';
  await prisma.usuario.create({ data: { nombre: 'Cuenta temporal', correo: 'temporal@incidentes.local', rol: 'ADMIN', passwordHash: await bcrypt.hash(clave, 12) } });
  const { token } = await (await iniciarSesion('temporal@incidentes.local', clave)).json();
  await prisma.usuario.update({ where: { correo: 'temporal@incidentes.local' }, data: { rol: 'ANALISTA' } });
  assert.equal((await fetch(`${url}/INC-003`, { method: 'DELETE', ...conToken(token) })).status, 403);
  await prisma.usuario.update({ where: { correo: 'temporal@incidentes.local' }, data: { activo: false } });
  assert.equal((await fetch(url, conToken(token))).status, 401);
  assert.equal((await iniciarSesion('temporal@incidentes.local', clave)).status, 401);
  await prisma.usuario.delete({ where: { correo: 'temporal@incidentes.local' } });
  assert.equal(await total(), 3);
});

// ---------- CORS y encabezados ----------

test('CORS permite el origen del cliente y rechaza otros orígenes con 403', async () => {
  const permitido = await fetch(`${base}/salud`, { headers: { Origin: 'http://127.0.0.1:5173' } });
  assert.equal(permitido.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173');
  assert.match(permitido.headers.get('vary'), /Origin/);
  const preflight = await fetch(`${url}/INC-001`, { method: 'OPTIONS', headers: { Origin: 'http://127.0.0.1:5173', 'Access-Control-Request-Method': 'DELETE', 'Access-Control-Request-Headers': 'authorization,content-type' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-methods'), 'GET,POST,PUT,DELETE');
  assert.equal(preflight.headers.get('access-control-allow-headers'), 'Content-Type,Authorization');
  for (const method of ['GET', 'OPTIONS']) {
    const externo = await fetch(url, { method, headers: { Origin: 'http://sitio-externo.example', 'Access-Control-Request-Method': 'DELETE' } });
    assert.equal(externo.status, 403);
    assert.equal(externo.headers.get('access-control-allow-origin'), null);
  }
});

test('Helmet agrega encabezados de seguridad, oculta X-Powered-By y evita la caché', async () => {
  const respuesta = await fetch(url, conToken());
  assert.equal(respuesta.headers.get('cache-control'), 'no-store');
  assert.equal(respuesta.headers.get('x-powered-by'), null);
  assert.equal(respuesta.headers.get('x-content-type-options'), 'nosniff');
  assert.match(respuesta.headers.get('strict-transport-security'), /max-age=/);
  assert.match(respuesta.headers.get('content-security-policy'), /default-src 'self'/);
});

// ---------- Validación y limpieza ----------

test('limpia etiquetas HTML y espacios, y conserva caracteres como & y >', async () => {
  const respuesta = await fetch(url, opciones('POST', { ...ejemplo, titulo: '  <b>Fallo en R&D</b> <script>alert(1)</script>   del   portal ',
    descripcion: 'El portal de R&D tardó > 5 s en responder <img src=x onerror=alert(1)> durante la revisión.', correo: ' redes@example.com ' }));
  assert.equal(respuesta.status, 201);
  const creado = await respuesta.json();
  assert.equal(creado.titulo, 'Fallo en R&D del portal');
  assert.equal(creado.descripcion, 'El portal de R&D tardó > 5 s en responder durante la revisión.');
  assert.equal(creado.correo, 'redes@example.com');
  assert.equal((await fetch(`${url}/${creado.id}`, { method: 'DELETE', ...conToken() })).status, 204);
});

test('rechaza scripts sin texto, etiquetas codificadas, evidencias peligrosas y campos desconocidos', async () => {
  const casos = [
    [{ ...ejemplo, titulo: '<script>alert(1)</script>' }, 'titulo', 'Usa entre 5 y 100 caracteres.'],
    [{ ...ejemplo, titulo: '&lt;script&gt;alert(1)&lt;/script&gt;' }, 'titulo', 'No incluyas etiquetas HTML.'],
    [{ ...ejemplo, evidencia: 'virus.exe' }, 'evidencia', 'Usa un archivo PNG, JPG o PDF, sin rutas.'],
    [{ ...ejemplo, evidencia: '../../etc/captura.png' }, 'evidencia', 'Usa un archivo PNG, JPG o PDF, sin rutas.'],
    [{ ...ejemplo, rol: 'ADMIN' }, 'rol', 'Campo no permitido.'],
    [{ ...ejemplo, id: 'INC-900' }, 'id', 'Campo no permitido.'],
  ];
  for (const [datos, campo, mensaje] of casos) {
    const respuesta = await fetch(url, opciones('POST', datos));
    assert.equal(respuesta.status, 400);
    const cuerpo = await respuesta.json();
    assert.equal(cuerpo.error, 'Revisa los datos enviados.');
    assert.equal(cuerpo.campos[campo], mensaje);
  }
  const proto = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.admin}` }, body: JSON.stringify({ ...ejemplo, titulo: 'Intento de contaminar el prototipo' }).replace('{', '{"__proto__":{"rol":"ADMIN"},') });
  assert.equal(proto.status, 400);
  assert.equal(Object.hasOwn((await proto.json()).campos, '__proto__'), true);
  assert.equal({}.rol, undefined);
  assert.equal(await total(), 3);
});

// ---------- CRUD y contrato de errores (Unidad 5, ahora con token) ----------

test('CRUD completo y cambios disponibles en una nueva consulta', async () => {
  const inicial = await fetch(url, conToken());
  assert.equal(inicial.status, 200);
  assert.match(inicial.headers.get('content-type'), /application\/json/);
  assert.equal((await inicial.json()).total, 3);
  const creacion = await fetch(url, opciones('POST', ejemplo));
  assert.equal(creacion.status, 201);
  const creado = await creacion.json();
  assert.match(creado.id, /^INC-\d{3}$/);
  assert.equal(creacion.headers.get('location'), `/api/incidentes/${creado.id}`);
  assert.equal(await total(), 4);
  igual(await (await fetch(`${url}/${creado.id}`, conToken())).json(), creado);
  const edicion = await fetch(`${url}/${creado.id}`, opciones('PUT', { ...ejemplo, estado: 'Resuelto' }));
  assert.equal(edicion.status, 200);
  assert.equal((await edicion.json()).estado, 'Resuelto');
  assert.equal((await (await fetch(`${url}/${creado.id}`, conToken())).json()).estado, 'Resuelto');
  const borrado = await fetch(`${url}/${creado.id}`, { method: 'DELETE', ...conToken() });
  assert.equal(borrado.status, 204);
  assert.equal(await borrado.text(), '');
  assert.equal((await fetch(`${url}/${creado.id}`, conToken())).status, 404);
  assert.equal(await total(), 3);
});

test('rechaza datos inválidos con un mensaje por campo sin modificar el modelo', async () => {
  const vacio = await fetch(url, opciones('POST', {}));
  assert.equal(vacio.status, 400);
  igual(Object.keys((await vacio.json()).campos), ['titulo', 'tipo', 'fecha', 'prioridad', 'estado', 'descripcion', 'correo']);
  for (const [datos, campo] of [[{ ...ejemplo, prioridad: 'Urgente' }, 'prioridad'], [{ ...ejemplo, fecha: '2026-02-30' }, 'fecha'], [{ ...ejemplo, fecha: '2999-01-01' }, 'fecha'], [{ ...ejemplo, correo: 'incorrecto' }, 'correo'], [{ ...ejemplo, titulo: 42 }, 'titulo'], [{ ...ejemplo, descripcion: 'x'.repeat(1001) }, 'descripcion']]) {
    const respuesta = await fetch(url, opciones('POST', datos));
    assert.equal(respuesta.status, 400);
    assert.ok((await respuesta.json()).campos[campo]);
  }
  const actualizacion = await fetch(`${url}/INC-001`, opciones('PUT', { estado: 'Resuelto' }));
  assert.equal(actualizacion.status, 400); // PUT exige el registro completo.
  assert.equal(await total(), 3);
});

test('JSON mal formado y rutas o identificadores inexistentes', async () => {
  const malformado = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.admin}` }, body: '{' });
  assert.equal(malformado.status, 400);
  assert.equal((await malformado.json()).error, 'El cuerpo debe contener JSON válido.');
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const respuesta = await fetch(`${url}/INC-999`, method === 'PUT' ? opciones(method, ejemplo) : { method, ...conToken() });
    assert.equal(respuesta.status, 404);
  }
  assert.equal((await fetch(url.replace('/incidentes', '/desconocida'))).status, 404);
});

test('el error interno devuelve 500 sin exponer detalles', () => {
  let codigo;
  let cuerpo;
  const res = { status(valor) { codigo = valor; return this; }, json(valor) { cuerpo = valor; } };
  errores(new Error('Fallo simulado para comprobar el manejador'), {}, res, () => {});
  assert.equal(codigo, 500);
  igual(cuerpo, { error: 'No se pudo completar la solicitud.' });
});

test('codificaciones no admitidas devuelven 415 sin modificar los incidentes', async () => {
  for (const headers of [
    { 'Content-Type': 'application/json; charset=iso-8859-1' },
    { 'Content-Type': 'application/json', 'Content-Encoding': 'desconocida' },
  ]) {
    const respuesta = await fetch(url, { method: 'POST', headers: { ...headers, Authorization: `Bearer ${tokens.admin}` }, body: JSON.stringify(ejemplo) });
    assert.equal(respuesta.status, 415);
    assert.equal((await respuesta.json()).error, 'El formato o la codificación de la solicitud no es compatible.');
  }
  assert.equal(await total(), 3);
});

test('rutas mal codificadas y gzip inválido devuelven 400', async () => {
  const ruta = await fetch(`${url}/%ZZ`, conToken());
  assert.equal(ruta.status, 400);
  assert.equal((await ruta.json()).error, 'La solicitud no es válida.');
  const comprimido = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip', Authorization: `Bearer ${tokens.admin}` }, body: 'no es gzip' });
  assert.equal(comprimido.status, 400);
  assert.equal((await comprimido.json()).error, 'La solicitud no es válida.');
});

test('el correo no acepta espacios, tabuladores ni saltos de línea', async () => {
  for (const separador of [' ', '\t', '\r', '\n']) {
    const respuesta = await fetch(url, opciones('POST', { ...ejemplo, correo: `demo${separador}@example.com` }));
    assert.equal(respuesta.status, 400);
    assert.equal((await respuesta.json()).campos.correo, 'El correo de contacto no es válido.');
  }
  assert.equal(await total(), 3);
});

test('filtros SQL combinados y paginación', async () => {
  const datos = await (await fetch(url + '?prioridad=Alta&estado=En%20revisi%C3%B3n', conToken(tokens.analista))).json();
  assert.equal(datos.total, 1);
  assert.equal(datos.incidentes[0].id, 'INC-001');
  const pagina = await (await fetch(url + '?limite=1&pagina=2', conToken())).json();
  assert.equal(pagina.total, 3); assert.equal(pagina.paginas, 3);
  assert.equal(pagina.incidentes[0].id, 'INC-002');
  const vacio = await (await fetch(url + '?prioridad=Baja&estado=Registrado', conToken())).json();
  assert.equal(vacio.total, 0);
  for (const consulta of ['?prioridad=Urgente', '?estado=inventado', '?pagina=0', '?limite=100', '?prioridad=Alta&prioridad=Baja']) {
    assert.equal((await fetch(url + consulta, conToken())).status, 400);
  }
});

test('la lista omite las fechas de auditoría y el detalle las conserva', async () => {
  const lista = await (await fetch(url, conToken())).json();
  expect(Object.keys(lista.incidentes[0]).sort()).toEqual(['correo', 'descripcion', 'estado', 'evidencia', 'fecha', 'id', 'prioridad', 'tipo', 'titulo']);
  const detalle = await (await fetch(`${url}/${lista.incidentes[0].id}`, conToken())).json();
  expect(detalle).toHaveProperty('createdAt');
  expect(detalle).toHaveProperty('updatedAt');
});

test('las respuestas de más de 1 KB se envían con gzip y las pequeñas no', async () => {
  const largos = [];
  for (const n of [1, 2, 3]) {
    largos.push(await prisma.incidente.create({ data: { titulo: `Registro largo ${n}`, tipo: 'Malware', fecha: new Date('2026-09-10T00:00:00Z'),
      prioridad: 'Baja', estado: 'Registrado', descripcion: 'Descripción extensa del incidente. '.repeat(25), correo: 'prueba@example.com' } }));
  }
  try {
    const grande = await fetch(`${url}?limite=50`, conToken());
    assert.ok((await grande.text()).length > 1024);
    assert.equal(grande.headers.get('content-encoding'), 'gzip');
  } finally {
    await prisma.incidente.deleteMany({ where: { id: { in: largos.map((l) => l.id) } } });
  }
  const pequena = await fetch(`${base}/salud`);
  assert.equal(pequena.headers.get('content-encoding'), null);
  assert.equal(await total(), 3);
});

test('título duplicado recibe 409 con el campo titulo y los ids inválidos reciben 400', async () => {
  const respuesta = await fetch(url, opciones('POST', { ...ejemplo, titulo: 'Correo que suplanta a soporte técnico' }));
  assert.equal(respuesta.status, 409);
  igual(await respuesta.json(), { error: 'Ya existe un incidente con ese título.', campos: { titulo: 'Ya existe un incidente con ese título.' } });
  for (const id of ['abc', 'INC-0', 'INC-1', 'INC-1.5', 'INC-99999999999']) {
    assert.equal((await fetch(`${url}/${id}`, conToken())).status, 400);
  }
});

test('la base impide nulos y valores fuera del enum', async () => {
  await assert.rejects(prisma.$executeRaw`UPDATE Incidente SET titulo = NULL WHERE id = 1`);
  await assert.rejects(prisma.$executeRaw`UPDATE Incidente SET prioridad = 'Urgente' WHERE id = 1`);
  await assert.rejects(prisma.$executeRaw`UPDATE Usuario SET rol = 'ROOT' WHERE correo = 'admin@incidentes.local'`);
  assert.equal((await prisma.incidente.findUnique({ where: { id: 1 } })).prioridad, 'Alta');
});

async function abrirProceso() {
  const proceso = spawn(process.execPath, ['backend/server.js'], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const direccion = await new Promise((resolve, reject) => {
    const limite = setTimeout(() => { proceso.kill(); reject(new Error('La API no inició.')); }, 15000);
    proceso.stdout.on('data', data => {
      const texto = data.toString();
      const inicio = texto.indexOf('http://');
      if (inicio >= 0) { clearTimeout(limite); resolve(texto.slice(inicio).trim()); }
    });
    proceso.once('exit', () => { clearTimeout(limite); reject(new Error('La API terminó antes de iniciar.')); });
  });
  return { proceso, direccion };
}
async function cerrarProceso(proceso) {
  const cierre = once(proceso, 'exit'); proceso.kill(); await cierre;
}

test('persiste al reiniciar Node y el JWT sigue siendo válido con la misma clave', async () => {
  let instancia = await abrirProceso();
  let id;
  try {
    const creado = await fetch(instancia.direccion, opciones('POST', { ...ejemplo, titulo: 'Registro que sobrevive al reinicio' }));
    assert.equal(creado.status, 201); id = (await creado.json()).id;
    await cerrarProceso(instancia.proceso);
    instancia = await abrirProceso();
    const leido = await fetch(instancia.direccion + '/' + id, conToken());
    assert.equal(leido.status, 200);
    assert.equal((await leido.json()).titulo, 'Registro que sobrevive al reinicio');
    await fetch(instancia.direccion + '/' + id, { method: 'DELETE', ...conToken() });
  } finally { if (instancia.proceso.exitCode === null) await cerrarProceso(instancia.proceso); }
});

test('rechaza cuerpos demasiado grandes con 413', async () => {
  const respuesta = await fetch(url, opciones('POST', { ...ejemplo, descripcion: 'x'.repeat(110000) }));
  assert.equal(respuesta.status, 413);
});

// ---------- Límites de solicitudes y caída de la base ----------

test('cinco intentos fallidos bloquean el inicio de sesión con 429', async () => {
  let respuesta;
  for (let intento = 0; intento < 6; intento++) {
    respuesta = await iniciarSesion('admin@incidentes.local', 'Adivinando-la-clave');
    if (respuesta.status === 429) break;
    assert.equal(respuesta.status, 401);
  }
  assert.equal(respuesta.status, 429);
  igual(await respuesta.json(), { error: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.' });
  // Durante el bloqueo tampoco se acepta la contraseña correcta.
  assert.equal((await iniciarSesion(...cuentas.admin)).status, 429);
});

test('MySQL detenido devuelve 503 sin secretos ni consultas', async () => {
  const apagado = spawnSync('docker', ['compose', 'stop', 'mysql-test'], { stdio: 'ignore' });
  assert.equal(apagado.status, 0);
  const respuesta = await fetch(url, conToken());
  assert.equal(respuesta.status, 503);
  igual(await respuesta.json(), { error: 'La base de datos no está disponible. Intenta de nuevo.' });
});

test('al superar el límite por minuto la API responde 429', async () => {
  let respuesta;
  for (let intento = 0; intento <= Number(process.env.LIMITE_POR_MINUTO); intento++) {
    respuesta = await fetch(`${base}/salud`);
    if (respuesta.status === 429) break;
  }
  assert.equal(respuesta.status, 429);
  assert.match(respuesta.headers.get('ratelimit-policy'), /q=400; w=60/);
  assert.equal((await respuesta.json()).error, 'Demasiadas solicitudes. Espera un minuto e intenta de nuevo.');
});
