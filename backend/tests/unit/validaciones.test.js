const { esquemaIncidente, limpiarTexto } = require('../../validaciones/incidentes');
const { esquemaLogin } = require('../../validaciones/auth');

const valido = {
  titulo: 'Correo sospechoso en la mesa de ayuda', tipo: 'Phishing', fecha: '2026-09-15', prioridad: 'Alta',
  estado: 'Registrado', descripcion: 'Un usuario recibió un correo que pedía validar su contraseña.', correo: 'mesa@example.com',
};
// Devuelve solo los campos con error, como los recibe la interfaz.
const camposConError = (datos) => {
  const resultado = esquemaIncidente.safeParse(datos);
  return resultado.success ? [] : [...new Set(resultado.error.issues.map((i) => i.path[0] ?? i.keys?.[0]))];
};

describe('limpiarTexto', () => {
  test('retira etiquetas y el contenido de <script>, y une espacios repetidos', () => {
    expect(limpiarTexto('  <b>Fallo</b> <script>alert(1)</script>  en   el portal ')).toBe('Fallo en el portal');
  });
  test('conserva caracteres de texto como &, < y > (no deja entidades HTML)', () => {
    expect(limpiarTexto('R&D tardó > 5 s y a < b')).toBe('R&D tardó > 5 s y a < b');
  });
});

describe('esquemaIncidente: reglas del registro', () => {
  test('acepta un incidente completo y agrega evidencia vacía por defecto', () => {
    const resultado = esquemaIncidente.parse(valido);
    expect(resultado).toEqual({ ...valido, evidencia: '' });
  });
  test('limpia el título y el correo antes de validar', () => {
    const resultado = esquemaIncidente.parse({ ...valido, titulo: ' <i>Acceso</i> remoto  ', correo: '  mesa@example.com ' });
    expect(resultado.titulo).toBe('Acceso remoto');
    expect(resultado.correo).toBe('mesa@example.com');
  });
  test('un título formado solo por un script queda vacío y se rechaza', () => {
    expect(camposConError({ ...valido, titulo: '<script>alert(1)</script>' })).toEqual(['titulo']);
  });
  test('rechaza una etiqueta escrita como entidad HTML', () => {
    const { error } = esquemaIncidente.safeParse({ ...valido, titulo: '&lt;script&gt;alert(1)&lt;/script&gt;' });
    expect(error.issues[0].message).toBe('No incluyas etiquetas HTML.');
  });
  test.each([
    ['2026-02-30', 'La fecha no existe.'],
    ['2999-01-01', 'La fecha no puede ser futura.'],
  ])('rechaza la fecha %s', (fecha, mensaje) => {
    const { error } = esquemaIncidente.safeParse({ ...valido, fecha });
    expect(error.issues[0].message).toBe(mensaje);
  });
  test.each(['virus.exe', '../../etc/captura.png', 'carpeta\\captura.png', 'sin-extension'])('rechaza la evidencia "%s"', (evidencia) => {
    expect(camposConError({ ...valido, evidencia })).toEqual(['evidencia']);
  });
  test.each(['captura.PNG', 'foto.jpeg', 'informe.pdf', ''])('acepta la evidencia "%s"', (evidencia) => {
    expect(camposConError({ ...valido, evidencia })).toEqual([]);
  });
  test('rechaza campos internos como rol o id', () => {
    expect(camposConError({ ...valido, rol: 'ADMIN', id: 'INC-900' })).toEqual(['rol']);
  });
  test('valida tipo, prioridad y estado contra las listas permitidas', () => {
    expect(camposConError({ ...valido, tipo: 'Spam', prioridad: 'Urgente', estado: 'Cerrado' })).toEqual(['tipo', 'prioridad', 'estado']);
  });
  test('la descripción necesita entre 30 y 1000 caracteres', () => {
    expect(camposConError({ ...valido, descripcion: 'Muy corta' })).toEqual(['descripcion']);
    expect(camposConError({ ...valido, descripcion: 'x'.repeat(1001) })).toEqual(['descripcion']);
  });
});

describe('esquemaLogin', () => {
  test('normaliza el correo a minúsculas', () => {
    expect(esquemaLogin.parse({ correo: ' Admin@Incidentes.LOCAL ', password: 'Clave-segura-1' }).correo).toBe('admin@incidentes.local');
  });
  test('rechaza contraseñas de más de 72 bytes (límite de bcrypt)', () => {
    expect(esquemaLogin.safeParse({ correo: 'admin@incidentes.local', password: 'ñ'.repeat(37) }).success).toBe(false);
  });
});
