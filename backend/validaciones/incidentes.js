const { z } = require('zod');
const sanitizeHtml = require('sanitize-html');

const tipos = ['Phishing', 'Malware', 'Acceso no autorizado', 'Fallo de disponibilidad', 'Vulnerabilidad'];
const prioridades = ['Alta', 'Media', 'Baja'];
const estados = ['Registrado', 'En revisión', 'Resuelto'];

// Limpieza: retira etiquetas HTML (y el contenido de <script> o <style>) y espacios repetidos.
// sanitize-html devuelve HTML escapado ("R&D" -> "R&amp;D"); la API guarda texto plano
// y React lo escapa al mostrarlo, por eso se revierten solo esas cuatro entidades.
function limpiarTexto(texto) {
  return sanitizeHtml(texto, { allowedTags: [], allowedAttributes: {} })
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&amp;', '&')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
// Segunda barrera: una etiqueta escrita como entidad (&lt;script&gt;) reaparece al revertirla.
const sinEtiquetas = (texto) => !/<[a-z!/?]/i.test(texto);

function textoLimpio(minimo, maximo) {
  const mensaje = `Usa entre ${minimo} y ${maximo} caracteres.`;
  return z.string({ error: 'Escribe un texto.' }).transform(limpiarTexto)
    .pipe(z.string().min(minimo, mensaje).max(maximo, mensaje).refine(sinEtiquetas, 'No incluyas etiquetas HTML.'));
}

function fechaReal(texto) {
  const fecha = new Date(texto + 'T00:00:00Z');
  return texto.length === 10 && !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}
function noFutura(texto) {
  const hoy = new Date();
  const fechaHoy = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  return texto <= fechaHoy;
}
// La evidencia es solo un nombre de archivo: sin rutas y con las extensiones del formulario.
function nombreEvidencia(texto) {
  if (texto === '') return true;
  const extension = texto.split('.').pop().toLowerCase();
  return !texto.includes('/') && !texto.includes('\\') && texto.includes('.') && ['png', 'jpg', 'jpeg', 'pdf'].includes(extension);
}

// strictObject rechaza propiedades desconocidas, como id, rol o __proto__.
const esquemaIncidente = z.strictObject({
  titulo: textoLimpio(5, 100),
  tipo: z.enum(tipos, { error: 'Selecciona un tipo válido.' }),
  fecha: z.string({ error: 'Usa el formato año-mes-día.' })
    .refine(fechaReal, { error: 'La fecha no existe.', abort: true })
    .refine(noFutura, 'La fecha no puede ser futura.'),
  prioridad: z.enum(prioridades, { error: 'Selecciona una prioridad válida.' }),
  estado: z.enum(estados, { error: 'Selecciona un estado válido.' }),
  descripcion: textoLimpio(30, 1000),
  correo: z.string({ error: 'Escribe un correo.' }).trim().max(120, 'Usa hasta 120 caracteres.')
    .pipe(z.email('El correo de contacto no es válido.')),
  evidencia: z.string({ error: 'Indica el nombre del archivo.' }).transform(limpiarTexto)
    .pipe(z.string().max(150, 'El nombre de la evidencia es demasiado largo.').refine(nombreEvidencia, 'Usa un archivo PNG, JPG o PDF, sin rutas.'))
    .default(''),
});

module.exports = { esquemaIncidente, limpiarTexto, tipos, prioridades, estados };
