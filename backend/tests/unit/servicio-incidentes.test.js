// El servicio se prueba sin MySQL: el modelo se reemplaza por funciones simuladas.
jest.mock('../../models/incidentes');
const modelo = require('../../models/incidentes');
const servicio = require('../../services/incidentes');
const { aCodigo, desdeCodigo, estadoABase, estadoDesdeBase } = require('../../utils/codigos');

beforeEach(() => jest.clearAllMocks());

describe('códigos INC y estados', () => {
  test('aCodigo y desdeCodigo son inversos', () => {
    expect(aCodigo(4)).toBe('INC-004');
    expect(aCodigo(1234)).toBe('INC-1234');
    expect(desdeCodigo('INC-004')).toBe(4);
  });
  test.each(['abc', 'INC-0', 'INC-1', 'INC-1.5', 'INC-004 ', 'INC-99999999999', undefined])('rechaza el código %p', (codigo) => {
    expect(desdeCodigo(codigo)).toBeNull();
  });
  test('"En revisión" se guarda como En_revision y vuelve igual', () => {
    expect(estadoABase('En revisión')).toBe('En_revision');
    expect(estadoDesdeBase('En_revision')).toBe('En revisión');
    expect(estadoABase('Resuelto')).toBe('Resuelto');
  });
});

describe('servicio de incidentes', () => {
  test('lista con los valores por defecto: página 1 y 10 registros', async () => {
    modelo.listar.mockResolvedValue({ total: 0, pagina: 1, paginas: 1, incidentes: [] });
    await servicio.listar({});
    expect(modelo.listar).toHaveBeenCalledWith({ prioridad: undefined, estado: undefined, pagina: 1, limite: 10 });
  });
  test('convierte la paginación recibida como texto en números', async () => {
    modelo.listar.mockResolvedValue({});
    await servicio.listar({ prioridad: 'Alta', estado: 'En revisión', pagina: '3', limite: '20' });
    expect(modelo.listar).toHaveBeenCalledWith({ prioridad: 'Alta', estado: 'En revisión', pagina: 3, limite: 20 });
  });
  test.each([
    [{ prioridad: 'Urgente' }, 'Filtro de prioridad inválido.'],
    [{ estado: 'Cerrado' }, 'Filtro de estado inválido.'],
    [{ prioridad: ['Alta', 'Baja'] }, 'Filtro de prioridad inválido.'],
    [{ pagina: '0' }, 'Usa una página positiva y un límite entre 1 y 50.'],
    [{ limite: '100' }, 'Usa una página positiva y un límite entre 1 y 50.'],
  ])('rechaza la consulta %o sin llegar a la base', async (consulta, mensaje) => {
    await expect(servicio.listar(consulta)).rejects.toMatchObject({ status: 400, message: mensaje });
    expect(modelo.listar).not.toHaveBeenCalled();
  });
  test('consultar un código inexistente responde 404', async () => {
    modelo.buscar.mockResolvedValue(null);
    await expect(servicio.consultar('INC-099')).rejects.toMatchObject({ status: 404, message: 'Incidente no encontrado.' });
    expect(modelo.buscar).toHaveBeenCalledWith(99);
  });
  test('un código mal formado responde 400 en consultar, actualizar y eliminar', async () => {
    for (const operacion of [() => servicio.consultar('INC-1'), () => servicio.actualizar('abc', {}), () => servicio.eliminar('INC-0')]) {
      await expect(operacion()).rejects.toMatchObject({ status: 400 });
    }
    expect(modelo.buscar).not.toHaveBeenCalled();
    expect(modelo.actualizar).not.toHaveBeenCalled();
    expect(modelo.eliminar).not.toHaveBeenCalled();
  });
  test('actualizar y eliminar envían al modelo el id numérico', async () => {
    modelo.actualizar.mockResolvedValue({ id: 'INC-004' });
    await servicio.actualizar('INC-004', { estado: 'Resuelto' });
    await servicio.eliminar('INC-004');
    expect(modelo.actualizar).toHaveBeenCalledWith(4, { estado: 'Resuelto' });
    expect(modelo.eliminar).toHaveBeenCalledWith(4);
  });
});

describe('servicio de incidentes: casos exitosos', () => {
  test('consultar devuelve el incidente del modelo', async () => {
    modelo.buscar.mockResolvedValue({ id: 'INC-002', titulo: 'Alerta de malware en laboratorio' });
    await expect(servicio.consultar('INC-002')).resolves.toEqual({ id: 'INC-002', titulo: 'Alerta de malware en laboratorio' });
  });
  test('crear entrega al modelo los datos ya validados', async () => {
    modelo.crear.mockResolvedValue({ id: 'INC-005' });
    await servicio.crear({ titulo: 'Nuevo' });
    expect(modelo.crear).toHaveBeenCalledWith({ titulo: 'Nuevo' });
  });
});
