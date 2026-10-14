import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const colores = { Alta: 'bg-red-50 text-red-800 border-red-200', Media: 'bg-amber-50 text-amber-800 border-amber-200', Baja: 'bg-emerald-50 text-emerald-800 border-emerald-200' };

// Los botones se muestran según los permisos que envía la API. Ocultarlos solo mejora la experiencia:
// el servidor vuelve a comprobar el rol en cada solicitud.
export default function TarjetaIncidente({ incidente, ocupado, puedeEditar, puedeEliminar, onEditar, onEliminar }) {
  return (
    <article className="rounded-lg border border-border bg-white p-4 wrap-anywhere" aria-label={incidente.id}>
      <div className="flex justify-between items-center gap-2 mb-2">
        <span className="text-xs font-bold tracking-wide text-muted-foreground">{incidente.id}</span>
        <Badge variant="outline" className={colores[incidente.prioridad]}>{incidente.prioridad}</Badge>
      </div>
      <h3 className="text-base font-semibold leading-snug">{incidente.titulo}</h3>
      <p className="text-xs text-muted-foreground mt-2"><time>{incidente.fecha}</time> · {incidente.tipo} · {incidente.estado}</p>
      <details className="mt-2">
        <summary className="text-sm font-medium text-primary py-2">Ver detalle</summary>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{incidente.descripcion}</p>
        <p className="text-xs text-muted-foreground mt-2">Contacto: {incidente.correo}</p>
        <p className="text-xs text-muted-foreground mt-1">Evidencia: {incidente.evidencia || 'Sin archivo indicado'}</p>
      </details>
      {(puedeEditar || puedeEliminar) && (
        <div className="flex gap-2 border-t border-border pt-3 mt-2">
          {puedeEditar && <Button type="button" size="sm" variant="outline" disabled={ocupado} onClick={() => onEditar(incidente)}>Editar</Button>}
          {puedeEliminar && <Button type="button" size="sm" variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" disabled={ocupado} onClick={() => onEliminar(incidente)}>Eliminar</Button>}
        </div>
      )}
    </article>
  );
}
