import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ordenCampos = ['titulo', 'tipo', 'fecha', 'prioridad', 'estado', 'descripcion', 'correo', 'evidencia'];

// Mensaje del servidor junto a su campo; aria-describedby lo anuncia al lector de pantalla.
function ErrorCampo({ campo, errores }) {
  if (!errores[campo]) return null;
  return <p id={`error-${campo}`} className="text-sm text-red-700 mt-1">{errores[campo]}</p>;
}
function atributos(campo, errores, ayuda) {
  const describe = [ayuda, errores[campo] && `error-${campo}`].filter(Boolean).join(' ');
  return { 'aria-invalid': errores[campo] ? true : undefined, 'aria-describedby': describe || undefined };
}

export default function FormularioIncidente({ incidente, guardando, errores = {}, onGuardar, onCancelar }) {
  const [errorArchivo, setErrorArchivo] = useState('');
  const formulario = useRef(null);
  const hoy = new Date();
  const fechaHoy = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

  // Si la API rechaza datos, se enfoca el primer campo afectado. Los valores escritos se conservan.
  useEffect(() => {
    const primero = ordenCampos.find((campo) => errores[campo]);
    if (primero) formulario.current?.elements[primero === 'evidencia' ? 'archivo' : primero]?.focus();
  }, [errores]);

  function enviar(evento) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const archivo = datos.get('archivo');
    if (archivo.size > 0) {
      const extension = archivo.name.split('.').pop().toLowerCase();
      if (!['png', 'jpg', 'jpeg', 'pdf'].includes(extension) || archivo.size > 2 * 1024 * 1024) {
        setErrorArchivo('Selecciona un PNG, JPG o PDF de hasta 2 MB.');
        return;
      }
    }
    setErrorArchivo('');
    onGuardar({
      titulo: datos.get('titulo'), tipo: datos.get('tipo'), fecha: datos.get('fecha'),
      prioridad: datos.get('prioridad'), estado: datos.get('estado'),
      descripcion: datos.get('descripcion'), correo: datos.get('correo'),
      evidencia: archivo.name || incidente?.evidencia || '',
    });
  }

  return (
    <form ref={formulario} onSubmit={enviar} className="space-y-4">
      <fieldset disabled={guardando} className="space-y-4 min-w-0">
        <legend className="sr-only">Datos del incidente</legend>
        <div>
          <label htmlFor="titulo">Título</label>
          <Input id="titulo" name="titulo" required minLength={5} maxLength={100} defaultValue={incidente?.titulo || ''} placeholder="¿Qué ocurrió?" {...atributos('titulo', errores)} />
          <ErrorCampo campo="titulo" errores={errores} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tipo">Tipo de incidente</label>
            <select id="tipo" name="tipo" required defaultValue={incidente?.tipo || ''} {...atributos('tipo', errores)}>
              <option value="">Selecciona un tipo</option>
              {['Phishing', 'Malware', 'Acceso no autorizado', 'Fallo de disponibilidad', 'Vulnerabilidad'].map((tipo) => <option key={tipo}>{tipo}</option>)}
            </select>
            <ErrorCampo campo="tipo" errores={errores} />
          </div>
          <div>
            <label htmlFor="fecha">Fecha del incidente</label>
            <Input id="fecha" name="fecha" type="date" required max={fechaHoy} defaultValue={incidente?.fecha || fechaHoy} {...atributos('fecha', errores)} />
            <ErrorCampo campo="fecha" errores={errores} />
          </div>
          <div>
            <label htmlFor="prioridad">Prioridad</label>
            <select id="prioridad" name="prioridad" defaultValue={incidente?.prioridad || 'Media'} {...atributos('prioridad', errores)}>
              {['Alta', 'Media', 'Baja'].map((prioridad) => <option key={prioridad}>{prioridad}</option>)}
            </select>
            <ErrorCampo campo="prioridad" errores={errores} />
          </div>
          <div>
            <label htmlFor="estado">Estado</label>
            <select id="estado" name="estado" defaultValue={incidente?.estado || 'Registrado'} {...atributos('estado', errores)}>
              {['Registrado', 'En revisión', 'Resuelto'].map((estado) => <option key={estado}>{estado}</option>)}
            </select>
            <ErrorCampo campo="estado" errores={errores} />
          </div>
        </div>
        <div>
          <label htmlFor="descripcion">Descripción</label>
          <Textarea id="descripcion" name="descripcion" rows={3} required minLength={30} maxLength={1000} defaultValue={incidente?.descripcion || ''} placeholder="Describe lo ocurrido y el servicio afectado." {...atributos('descripcion', errores, 'ayuda-descripcion')} />
          <small id="ayuda-descripcion">Entre 30 y 1000 caracteres. Se guarda como texto: las etiquetas HTML se eliminan.</small>
          <ErrorCampo campo="descripcion" errores={errores} />
        </div>
        <div>
          <label htmlFor="correo">Correo de contacto</label>
          <Input id="correo" name="correo" type="email" required maxLength={120} defaultValue={incidente?.correo || ''} placeholder="usuario@example.com" autoComplete="email" {...atributos('correo', errores)} />
          <ErrorCampo campo="correo" errores={errores} />
        </div>
        <div>
          <label htmlFor="archivo">Evidencia <span className="font-normal text-muted-foreground">(opcional)</span></label>
          <Input id="archivo" name="archivo" type="file" accept=".png,.jpg,.jpeg,.pdf" {...atributos('evidencia', errores, 'ayuda-archivo')} />
          <small id="ayuda-archivo">PNG, JPG o PDF, hasta 2 MB. Solo se registra el nombre del archivo.</small>
          {incidente?.evidencia && <small>Nombre actual: {incidente.evidencia}</small>}
          <ErrorCampo campo="evidencia" errores={errores} />
          {errorArchivo && <p role="alert" className="text-sm text-red-700 mt-2">{errorArchivo}</p>}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit">{guardando ? 'Guardando…' : incidente ? 'Guardar cambios' : 'Registrar incidente'}</Button>
          {incidente && <Button type="button" variant="outline" onClick={onCancelar}>Cancelar edición</Button>}
        </div>
      </fieldset>
    </form>
  );
}
