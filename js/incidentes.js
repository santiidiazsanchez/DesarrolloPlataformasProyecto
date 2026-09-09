const formulario = document.querySelector('#formulario');
const lista = document.querySelector('#lista');
const descripcion = formulario.elements.descripcion;
const evidencia = formulario.elements.evidencia;
let consecutivo = 4;

const hoy = new Date();
hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
formulario.elements.fecha.max = hoy.toISOString().slice(0, 10);
document.querySelector('#registrar').disabled = false;

// HTML valida campos requeridos, correo y longitudes. JS revisa espacios y archivos.
function validarCampo(campo) {
  if (campo === formulario.elements.titulo) {
    campo.setCustomValidity(campo.value && campo.value.trim().length < 5
      ? 'Escribe un título de al menos 5 caracteres, sin contar espacios de los extremos.' : '');
  }
  if (campo === descripcion) {
    campo.setCustomValidity(campo.value && campo.value.trim().length < 30
      ? 'Escribe al menos 30 caracteres sin contar espacios al inicio o al final.' : '');
  }
  if (campo === evidencia) {
    const archivo = campo.files[0];
    let error = '';
    if (archivo && !/\.(png|jpe?g|pdf)$/i.test(archivo.name)) error = 'Selecciona un archivo PNG, JPG o PDF.';
    else if (archivo && archivo.size > 2 * 1024 * 1024) error = 'El archivo debe pesar como máximo 2 MB.';
    campo.setCustomValidity(error);
  }
}

// Los errores quedan junto al campo y asociados mediante aria-describedby.
formulario.addEventListener('invalid', (evento) => {
  const campo = evento.target;
  campo.setAttribute('aria-invalid', 'true');
  document.querySelector(`#error-${campo.id}`).textContent = campo.validationMessage;
}, true);

function revisarEntrada(evento) {
  const campo = evento.target;
  validarCampo(campo);
  if (campo.hasAttribute('aria-invalid')) {
    document.querySelector(`#error-${campo.id}`).textContent = campo.validationMessage;
    if (campo.validity.valid) campo.removeAttribute('aria-invalid');
  }
}
formulario.addEventListener('input', revisarEntrada);
formulario.addEventListener('change', revisarEntrada);

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();
  validarCampo(formulario.elements.titulo);
  validarCampo(descripcion);
  validarCampo(evidencia);
  if (!formulario.reportValidity()) return;

  const datos = new FormData(formulario);
  const codigo = `INC-${String(consecutivo++).padStart(3, '0')}`;
  // Reutiliza una tarjeta: los datos se insertan como texto, nunca como HTML.
  const tarjeta = lista.querySelector('article').cloneNode(true);
  tarjeta.id = codigo.toLowerCase();
  for (const nombre of ['titulo', 'tipo', 'correo', 'descripcion', 'estado']) {
    tarjeta.querySelector(`.${nombre}`).textContent = datos.get(nombre).trim();
  }
  tarjeta.querySelector('.codigo').textContent = codigo;
  tarjeta.querySelector('.codigo-detalle').textContent = codigo;
  const prioridad = datos.get('prioridad');
  tarjeta.querySelector('.prioridad').textContent = `Prioridad ${prioridad.toLowerCase()}`;
  tarjeta.querySelector('.prioridad').className = `prioridad ${prioridad.toLowerCase()}`;
  const fecha = datos.get('fecha');
  tarjeta.querySelector('time').dateTime = fecha;
  tarjeta.querySelector('time').textContent = fecha.split('-').reverse().join('/');
  tarjeta.querySelector('.evidencia').textContent = evidencia.files[0]
    ? `${evidencia.files[0].name} (solo nombre, archivo no guardado).` : 'Sin evidencia adjunta.';
  tarjeta.querySelector('details').open = true;
  lista.prepend(tarjeta);
  document.querySelector('#total').textContent = `${lista.children.length} registros`;
  document.querySelector('#mensaje').textContent = `${codigo} registrado en la demostración. Se borrará al recargar.`;
  formulario.reset();
  formulario.querySelectorAll('[aria-invalid]').forEach((campo) => campo.removeAttribute('aria-invalid'));
  formulario.querySelectorAll('.error').forEach((mensaje) => { mensaje.textContent = ''; });
  tarjeta.querySelector('summary').focus();
});
