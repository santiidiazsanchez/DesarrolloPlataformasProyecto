// Pruebas del servicio Fetch del cliente. Se reemplazan fetch, sessionStorage y la URL de la API.
jest.mock('./config.js', () => ({ API_URL: 'http://api.prueba/api' }));
import * as api from './api.js';

const almacen = new Map();
global.sessionStorage = {
  getItem: (clave) => (almacen.has(clave) ? almacen.get(clave) : null),
  setItem: (clave, valor) => { almacen.set(clave, String(valor)); },
  removeItem: (clave) => { almacen.delete(clave); },
};
global.fetch = jest.fn();

// Token con el formato JWT; el cliente solo lee la carga útil (la firma la revisa el servidor).
const tokenDe = (id) => ['e30', Buffer.from(JSON.stringify({ sub: String(id), rol: 'ANALISTA' })).toString('base64url'), 'firma'].join('.');
const respuesta = (status, cuerpo) => ({ status, ok: status >= 200 && status < 300, json: async () => cuerpo });
const datos = { titulo: 'Equipo con mensaje de rescate', tipo: 'Malware', fecha: '2026-10-13', prioridad: 'Alta',
  estado: 'Registrado', descripcion: 'El equipo de recepción pide un pago para recuperar archivos.', correo: 'recepcion@example.com', evidencia: '' };

beforeEach(() => {
  almacen.clear();
  fetch.mockReset();
});

describe('solicitudes autenticadas', () => {
  test('envía el token como Bearer y la URL configurada', async () => {
    sessionStorage.setItem('token', tokenDe(3));
    fetch.mockResolvedValue(respuesta(200, { total: 0, pagina: 1, paginas: 1, incidentes: [] }));
    await api.listarIncidentes({ prioridad: 'Alta' });
    const [url, opciones] = fetch.mock.calls[0];
    expect(url).toBe('http://api.prueba/api/incidentes?pagina=1&limite=10&prioridad=Alta');
    expect(opciones.headers.Authorization).toBe(`Bearer ${tokenDe(3)}`);
  });
  test('un 401 con sesión borra el token y avisa que la sesión venció', async () => {
    sessionStorage.setItem('token', tokenDe(3));
    fetch.mockResolvedValue(respuesta(401, { error: 'La sesión no es válida o venció. Inicia sesión de nuevo.' }));
    const aviso = jest.fn();
    api.cuandoExpireSesion(aviso);
    await expect(api.listarIncidentes()).rejects.toMatchObject({ estado: 401 });
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(aviso).toHaveBeenCalledWith('La sesión no es válida o venció. Inicia sesión de nuevo.');
  });
  test('un error de red se explica sin detalles técnicos', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.listarIncidentes()).rejects.toThrow('No se pudo conectar con la API. Revisa que esté encendida.');
  });
  test('los errores de validación conservan el mensaje de cada campo', async () => {
    sessionStorage.setItem('token', tokenDe(3));
    fetch.mockResolvedValue(respuesta(400, { error: 'Revisa los datos enviados.', campos: { correo: 'El correo de contacto no es válido.' } }));
    await expect(api.guardarIncidente(datos)).rejects.toMatchObject({ estado: 400, campos: { correo: 'El correo de contacto no es válido.' } });
  });
});

// Defecto 2: cuando el servidor quita un permiso (403), la interfaz no se enteraba y seguía mostrando la acción.
describe('permisos que cambian durante la sesión', () => {
  test('un 403 con sesión avisa para volver a leer los permisos', async () => {
    sessionStorage.setItem('token', tokenDe(1));
    fetch.mockResolvedValue(respuesta(403, { error: 'Tu rol no tiene permiso para esta acción.' }));
    const aviso = jest.fn();
    api.cuandoCambienPermisos(aviso);
    await expect(api.eliminarIncidente('INC-004')).rejects.toMatchObject({ estado: 403 });
    expect(aviso).toHaveBeenCalledTimes(1);
  });
});

// Defecto 3: si el token vencía mientras se llenaba el formulario, al volver a entrar se perdía lo escrito.
describe('borrador cuando la sesión vence al guardar', () => {
  test('conserva los datos y los devuelve a la misma cuenta después de iniciar sesión', async () => {
    sessionStorage.setItem('token', tokenDe(3));
    fetch.mockResolvedValue(respuesta(401, { error: 'La sesión no es válida o venció. Inicia sesión de nuevo.' }));
    await expect(api.guardarIncidente(datos)).rejects.toMatchObject({ estado: 401 });
    sessionStorage.setItem('token', tokenDe(3));
    expect(api.recuperarBorrador()).toEqual({ datos, id: null });
    expect(api.recuperarBorrador()).toBeNull(); // se entrega una sola vez
  });
  test('no entrega el borrador a otra cuenta', async () => {
    sessionStorage.setItem('token', tokenDe(3));
    fetch.mockResolvedValue(respuesta(401, { error: 'La sesión no es válida o venció.' }));
    await expect(api.guardarIncidente(datos, 'INC-004')).rejects.toMatchObject({ estado: 401 });
    sessionStorage.setItem('token', tokenDe(1));
    expect(api.recuperarBorrador()).toBeNull();
  });
});

describe('inicio de sesión', () => {
  test('guarda el token recibido y devuelve el usuario', async () => {
    fetch.mockResolvedValue(respuesta(200, { token: tokenDe(2), usuario: { nombre: 'Supervisor de prueba', rol: 'SUPERVISOR' } }));
    await expect(api.iniciarSesion('supervisor@incidentes.local', 'Clave-de-prueba')).resolves.toEqual({ nombre: 'Supervisor de prueba', rol: 'SUPERVISOR' });
    expect(api.haySesion()).toBe(true);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ correo: 'supervisor@incidentes.local', password: 'Clave-de-prueba' });
  });
  test('sin token no se recupera ningún borrador', () => {
    sessionStorage.setItem('borrador', JSON.stringify({ cuenta: '3', datos, id: null }));
    expect(api.recuperarBorrador()).toBeNull();
  });
});
