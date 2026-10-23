const { z } = require('zod');
const errores = require('../../middleware/errores');
const registro = require('../../middleware/registro');
const { validarCuerpo } = require('../../middleware/validar');

function respuestaFalsa() {
  return { statusCode: 200, body: undefined, status(codigo) { this.statusCode = codigo; return this; }, json(cuerpo) { this.body = cuerpo; return this; } };
}
function manejar(error) {
  const res = respuestaFalsa();
  errores(error, {}, res, () => {});
  return res;
}

describe('manejador de errores', () => {
  // Defecto 1: el 409 solo traía un mensaje general y la interfaz no podía marcar el campo.
  test('un título repetido (P2002) responde 409 e indica el campo titulo', () => {
    const res = manejar({ code: 'P2002', meta: { modelName: 'Incidente', target: 'Incidente_titulo_key' } });
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      error: 'Ya existe un incidente con ese título.',
      campos: { titulo: 'Ya existe un incidente con ese título.' },
    });
  });
  test.each([
    [{ code: 'P2025' }, 404],
    [{ code: 'P1001' }, 503],
    [{ type: 'entity.parse.failed' }, 400],
    [{ type: 'entity.too.large' }, 413],
    [{ status: 415 }, 415],
    [{ tipo: 'cors' }, 403],
  ])('%o responde %i', (error, codigo) => {
    expect(manejar(error).statusCode).toBe(codigo);
  });
  test('un error inesperado responde 500 sin detalles internos', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = manejar(new Error('SELECT * FROM Usuario WHERE clave = 123'));
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('SELECT');
  });
  test('el 500 devuelve el id de solicitud y el log solo guarda el tipo del error', () => {
    const espia = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = respuestaFalsa();
    errores(new Error('SELECT * FROM Usuario WHERE clave = 123'), { id: 'id-de-prueba' }, res, () => {});
    expect(res.body).toEqual({ error: 'No se pudo completar la solicitud.', id: 'id-de-prueba' });
    const linea = espia.mock.calls.at(-1)[0];
    expect(JSON.parse(linea)).toMatchObject({ nivel: 'ERROR', id: 'id-de-prueba', evento: 'error_interno', tipo: 'Error' });
    expect(linea).not.toContain('SELECT');
  });
});

describe('registro de solicitudes', () => {
  function solicitar(ruta, estado, usuario) {
    const eventos = {};
    const req = { method: 'GET', originalUrl: ruta, ip: '203.0.113.7', usuario, headers: { authorization: 'Bearer token-secreto' } };
    const res = { statusCode: estado, headers: {}, set(nombre, valor) { this.headers[nombre] = valor; }, on(evento, funcion) { eventos[evento] = funcion; } };
    registro(req, res, () => {});
    eventos.finish();
    return { req, res };
  }
  test('escribe una línea JSON con nivel, duración e id de solicitud, sin el token', () => {
    const espia = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { req, res } = solicitar('/api/incidentes/INC-009', 404, { id: 3, rol: 'ANALISTA' });
    const linea = espia.mock.calls.at(-1)[0];
    expect(JSON.parse(linea)).toMatchObject({ nivel: 'WARN', id: req.id, metodo: 'GET', ruta: '/api/incidentes/INC-009', estado: 404, usuario: 3, rol: 'ANALISTA' });
    expect(typeof JSON.parse(linea).ms).toBe('number');
    expect(res.headers['X-Request-Id']).toBe(req.id);
    expect(linea).not.toContain('token-secreto');
    espia.mockRestore();
  });
  test('omite los health checks correctos de Render y registra los fallidos como ERROR', () => {
    const espia = jest.spyOn(console, 'log').mockImplementation(() => {});
    solicitar('/api/salud', 200);
    expect(espia).not.toHaveBeenCalled();
    solicitar('/api/salud', 503);
    expect(JSON.parse(espia.mock.calls[0][0]).nivel).toBe('ERROR');
    espia.mockRestore();
  });
});

describe('validarCuerpo', () => {
  const esquema = z.strictObject({ nombre: z.string().min(3, 'Muy corto.'), edad: z.number({ error: 'Número.' }) });
  test('400 con un mensaje por campo, en el orden del esquema', () => {
    const res = respuestaFalsa();
    validarCuerpo(esquema)({ body: { edad: 'x', nombre: 'a', extra: 1 } }, res, jest.fn());
    expect(res.statusCode).toBe(400);
    expect(Object.keys(res.body.campos)).toEqual(['nombre', 'edad', 'extra']);
  });
  test('una clave __proto__ queda como propiedad propia y no contamina objetos', () => {
    const res = respuestaFalsa();
    validarCuerpo(esquema)({ body: JSON.parse('{"__proto__":{"rol":"ADMIN"},"nombre":"Ana","edad":3}') }, res, jest.fn());
    expect(Object.hasOwn(res.body.campos, '__proto__')).toBe(true);
    expect({}.rol).toBeUndefined();
  });
  test('si los datos son válidos reemplaza req.body por los datos limpios y continúa', () => {
    const req = { body: { nombre: 'Ana', edad: 30 } };
    const siguiente = jest.fn();
    validarCuerpo(esquema)(req, respuestaFalsa(), siguiente);
    expect(siguiente).toHaveBeenCalled();
    expect(req.body).toEqual({ nombre: 'Ana', edad: 30 });
  });
});
