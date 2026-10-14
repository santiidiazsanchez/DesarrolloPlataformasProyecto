// autenticar se prueba sin MySQL: el modelo de usuarios se reemplaza.
jest.mock('../../models/usuarios');
const usuarios = require('../../models/usuarios');
const { autenticar } = require('../../middleware/autenticacion');
const { crearToken } = require('../../utils/token');

function respuestaFalsa() {
  return { statusCode: 200, headers: {}, body: undefined, set(nombre, valor) { this.headers[nombre] = valor; return this; },
    status(codigo) { this.statusCode = codigo; return this; }, json(cuerpo) { this.body = cuerpo; return this; } };
}
async function ejecutar(authorization) {
  const req = { get: (nombre) => (nombre.toLowerCase() === 'authorization' ? authorization : undefined) };
  const res = respuestaFalsa();
  const siguiente = jest.fn();
  await autenticar(req, res, siguiente);
  return { req, res, siguiente };
}

beforeEach(() => jest.clearAllMocks());

describe('autenticar', () => {
  test.each([undefined, 'Basic abc', 'Bearer'])('sin un token Bearer (%p) responde 401 con WWW-Authenticate', async (encabezado) => {
    const { res, siguiente } = await ejecutar(encabezado);
    expect(res.statusCode).toBe(401);
    expect(res.headers['WWW-Authenticate']).toBe('Bearer');
    expect(siguiente).not.toHaveBeenCalled();
  });
  test('un token mal firmado responde 401 sin consultar la base', async () => {
    const { res } = await ejecutar('Bearer token.que.no.sirve');
    expect(res.statusCode).toBe(401);
    expect(usuarios.buscarPorId).not.toHaveBeenCalled();
  });
  test('una cuenta desactivada responde 401 aunque el token sea válido', async () => {
    usuarios.buscarPorId.mockResolvedValue({ id: 3, rol: 'ANALISTA', activo: false });
    const { res } = await ejecutar(`Bearer ${crearToken({ id: 3, rol: 'ANALISTA' })}`);
    expect(res.statusCode).toBe(401);
  });
  test('usa el rol actual de la base, no el que quedó en el token', async () => {
    usuarios.buscarPorId.mockResolvedValue({ id: 1, rol: 'ANALISTA', activo: true });
    const { req, siguiente } = await ejecutar(`Bearer ${crearToken({ id: 1, rol: 'ADMIN' })}`);
    expect(usuarios.buscarPorId).toHaveBeenCalledWith(1);
    expect(req.usuario).toEqual({ id: 1, rol: 'ANALISTA' });
    expect(siguiente).toHaveBeenCalledTimes(1);
  });
});
