const jwt = require('jsonwebtoken');
const { permisosDe } = require('../../config/permisos');
const { crearToken, verificarToken } = require('../../utils/token');
const { permitir } = require('../../middleware/autenticacion');

// Respuesta de Express simulada: guarda el código y el cuerpo enviados.
function respuestaFalsa() {
  return { statusCode: 200, body: undefined, status(codigo) { this.statusCode = codigo; return this; }, json(cuerpo) { this.body = cuerpo; return this; } };
}

describe('permisos por rol (menor privilegio)', () => {
  test.each([
    ['ANALISTA', { consultar: true, crear: true, actualizar: false, eliminar: false }],
    ['SUPERVISOR', { consultar: true, crear: false, actualizar: true, eliminar: false }],
    ['ADMIN', { consultar: true, crear: true, actualizar: true, eliminar: true }],
    ['DESCONOCIDO', { consultar: false, crear: false, actualizar: false, eliminar: false }],
  ])('%s', (rol, esperado) => {
    expect(permisosDe(rol)).toEqual(esperado);
  });

  test('permitir deja pasar un rol autorizado', () => {
    const siguiente = jest.fn();
    permitir(['ADMIN'])({ usuario: { rol: 'ADMIN' } }, respuestaFalsa(), siguiente);
    expect(siguiente).toHaveBeenCalledTimes(1);
  });
  test('permitir responde 403 sin llamar al controlador', () => {
    const siguiente = jest.fn();
    const res = respuestaFalsa();
    permitir(['ADMIN'])({ usuario: { rol: 'ANALISTA' } }, res, siguiente);
    expect(siguiente).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});

describe('token JWT', () => {
  test('lleva solo id y rol, y dura 30 minutos', () => {
    const datos = verificarToken(crearToken({ id: 7, rol: 'SUPERVISOR' }));
    expect(datos.sub).toBe('7');
    expect(datos.rol).toBe('SUPERVISOR');
    expect(datos.exp - datos.iat).toBe(30 * 60);
  });
  test('rechaza un token sin firma (alg none)', () => {
    const sinFirma = jwt.sign({ rol: 'ADMIN' }, null, { algorithm: 'none', subject: '1', issuer: 'incidentes-api', audience: 'incidentes-web' });
    expect(() => verificarToken(sinFirma)).toThrow();
  });
  test('rechaza un token vencido', () => {
    const vencido = jwt.sign({ rol: 'ADMIN', exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET,
      { subject: '1', issuer: 'incidentes-api', audience: 'incidentes-web' });
    expect(() => verificarToken(vencido)).toThrow('jwt expired');
  });
});

