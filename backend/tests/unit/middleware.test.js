const { z } = require('zod');
const errores = require('../../middleware/errores');
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
