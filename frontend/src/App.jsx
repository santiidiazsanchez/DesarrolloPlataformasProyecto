import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import FormularioIncidente from './components/FormularioIncidente';
import TarjetaIncidente from './components/TarjetaIncidente';
import InicioSesion from './components/InicioSesion';
import { listarIncidentes, guardarIncidente, eliminarIncidente, obtenerPerfil, haySesion, cerrarSesion, cuandoExpireSesion } from './services/api';

const nombresRol = { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', ANALISTA: 'Analista' };

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(haySesion());
  const [avisoSesion, setAvisoSesion] = useState('');
  const [incidentes, setIncidentes] = useState([]);
  const [prioridad, setPrioridad] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errorConsulta, setErrorConsulta] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [edicion, setEdicion] = useState(null);
  const [versionFormulario, setVersionFormulario] = useState(0);
  const consultaActual = useRef(null);

  function salir(aviso = '') {
    consultaActual.current?.abort();
    cerrarSesion();
    setUsuario(null);
    setAvisoSesion(aviso);
    setIncidentes([]); setEdicion(null); setErrores({}); setError(''); setMensaje('');
  }

  // Al recargar la página se valida el token guardado con la API antes de mostrar el panel.
  useEffect(() => {
    cuandoExpireSesion((motivo) => salir(motivo));
    if (!haySesion()) return;
    // Un 401 ya llama a salir(); otro error (API apagada) se explica en la pantalla de acceso.
    obtenerPerfil().then(setUsuario)
      .catch((error) => { if (error.estado !== 401) setAvisoSesion(error.message); })
      .finally(() => setVerificando(false));
  }, []);

  async function cargar() {
    // Una consulta nueva cancela la anterior: un filtro viejo no puede sobrescribir uno reciente.
    consultaActual.current?.abort();
    const control = new AbortController();
    consultaActual.current = control;
    setCargando(true);
    setError('');
    try {
      const datos = await listarIncidentes({ prioridad, estado, pagina }, control.signal);
      if (pagina > datos.paginas) { setPagina(datos.paginas); return; }
      setIncidentes(datos.incidentes);
      setTotal(datos.total);
      setPaginas(datos.paginas);
    } catch (error) {
      if (error.name !== 'AbortError') { setError(error.message); setErrorConsulta(true); }
    } finally {
      if (consultaActual.current === control) setCargando(false);
    }
  }

  useEffect(() => { if (usuario) cargar(); }, [usuario, prioridad, estado, pagina]);

  function editar(incidente) {
    setEdicion(incidente);
    setMensaje('');
    setError('');
    setErrores({});
    document.getElementById('registro').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('titulo-registro').focus({ preventScroll: true });
  }

  function cancelarEdicion() {
    setEdicion(null);
    setErrores({});
  }

  async function guardar(datos) {
    setGuardando(true);
    setError('');
    setErrores({});
    setMensaje('');
    try {
      const guardado = await guardarIncidente(datos, edicion?.id);
      await cargar();
      setMensaje(edicion ? `${guardado.id} actualizado.` : `${guardado.id} registrado correctamente.`);
      setEdicion(null);
      setVersionFormulario(versionFormulario + 1);
    } catch (error) {
      // Los datos escritos se conservan; los mensajes del servidor se muestran en cada campo.
      setErrores(error.campos || {});
      setErrorConsulta(false);
      setError(error.campos && Object.keys(error.campos).length ? 'Revisa los campos marcados en el formulario.' : error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(incidente) {
    if (!window.confirm(`¿Eliminar ${incidente.id}: ${incidente.titulo}?`)) return;
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      await eliminarIncidente(incidente.id);
      await cargar();
      if (edicion?.id === incidente.id) setEdicion(null);
      setMensaje(`${incidente.id} eliminado.`);
    } catch (error) {
      setError(error.message);
      setErrorConsulta(false);
    } finally {
      setGuardando(false);
    }
  }

  const encabezado = (
    <header className="bg-[#122c4a] text-white">
      <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center gap-4">
        <img src="/recursos/cerrar.svg" alt="" width="42" height="42" />
        <div className="flex-1 min-w-48"><p className="text-xs uppercase tracking-widest text-blue-200 mb-1">Gestión de seguridad</p><h1 className="text-xl sm:text-2xl font-semibold">Incidentes de ciberseguridad</h1></div>
        {usuario && (
          <div className="flex items-center gap-3 text-sm">
            <p className="sm:text-right"><span className="block font-semibold">{usuario.nombre}</span><span className="text-blue-200">{nombresRol[usuario.rol]}</span></p>
            <Button variant="secondary" size="sm" onClick={() => salir()}>Cerrar sesión</Button>
          </div>
        )}
      </div>
    </header>
  );
  const pie = <footer className="max-w-6xl mx-auto px-5 pb-6 text-xs text-muted-foreground">Desarrollo en Plataformas · Unidad 6 · Prototipo académico</footer>;

  if (verificando) return <>{encabezado}<main className="max-w-6xl mx-auto px-5 py-10"><p role="status" className="text-sm text-muted-foreground">Verificando la sesión…</p></main></>;
  if (!usuario) return <><a className="salto" href="#contenido">Saltar al contenido</a>{encabezado}<InicioSesion aviso={avisoSesion} onIngresar={(datos) => { setAvisoSesion(''); setUsuario(datos); }} />{pie}</>;

  const { permisos } = usuario;
  const ocupado = cargando || guardando;
  const mostrarFormulario = permisos.crear || edicion;

  return (
    <>
      <a className="salto" href="#contenido">Saltar al contenido</a>
      {encabezado}
      <nav className="bg-white border-b border-border" aria-label="Navegación principal">
        <div className="max-w-6xl mx-auto px-5 flex gap-6 text-sm font-semibold text-primary">
          <a className="py-3" href="#registro">{permisos.crear ? 'Nuevo incidente' : 'Seguimiento'}</a><a className="py-3" href="#incidentes">Incidentes</a><a className="py-3" href="#ayuda">Ayuda</a>
        </div>
      </nav>
      <main id="contenido" className="max-w-6xl mx-auto px-5 py-6" tabIndex={-1}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div><h2 className="text-lg font-semibold">Registro y seguimiento</h2><p className="text-sm text-muted-foreground mt-1">Sesión de {nombresRol[usuario.rol].toLowerCase()}: solo ves las acciones que tu rol puede realizar.</p></div>
          <div className="flex gap-5 text-sm"><p><strong className="text-xl">{total}</strong> registros encontrados</p></div>
        </div>
        <div role="status" aria-live="polite">{mensaje && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 mb-4 text-sm text-emerald-900">{mensaje}</p>}</div>
        <div role="alert">{error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 mb-4 text-sm text-red-800 flex flex-wrap gap-3 items-center justify-between"><p>{error}</p>{errorConsulta && <Button variant="outline" onClick={cargar} disabled={ocupado}>Reintentar consulta</Button>}</div>}</div>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Card id="registro" className="scroll-mt-5">
            <CardHeader><CardTitle id="titulo-registro" tabIndex={-1}>{edicion ? `Editar ${edicion.id}` : permisos.crear ? 'Registrar un incidente' : 'Actualizar el seguimiento'}</CardTitle><CardDescription>{mostrarFormulario ? 'Completa los datos. La evidencia es opcional.' : 'Tu rol puede cambiar el estado y los datos de un incidente existente.'}</CardDescription></CardHeader>
            <CardContent>
              {mostrarFormulario
                ? <FormularioIncidente key={edicion?.id || versionFormulario} incidente={edicion} guardando={ocupado} errores={errores} onGuardar={guardar} onCancelar={cancelarEdicion} />
                : <p className="p-6 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">Selecciona <strong>Editar</strong> en un incidente de la lista para actualizarlo.</p>}
            </CardContent>
          </Card>
          <Card id="incidentes" className="scroll-mt-5">
            <CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Incidentes reportados</CardTitle><Button variant="outline" size="sm" onClick={cargar} disabled={ocupado}>Actualizar</Button></div><CardDescription>Consulta los detalles y actualiza su seguimiento.</CardDescription></CardHeader>
            <CardContent>
              <label htmlFor="filtro-prioridad">Filtrar por prioridad</label>
              <select id="filtro-prioridad" value={prioridad} onChange={(evento) => { setPrioridad(evento.target.value); setPagina(1); }} disabled={guardando}><option value="">Todas las prioridades</option><option>Alta</option><option>Media</option><option>Baja</option></select>
              <label htmlFor="filtro-estado" className="mt-3">Filtrar por estado</label>
              <select id="filtro-estado" value={estado} onChange={(evento) => { setEstado(evento.target.value); setPagina(1); }} disabled={guardando}><option value="">Todos los estados</option><option>Registrado</option><option>En revisión</option><option>Resuelto</option></select>
              <p role="status" className="text-xs text-muted-foreground my-3">{cargando ? 'Cargando incidentes…' : `${incidentes.length} de ${total} registros`}</p>
              <div className="space-y-3" aria-busy={cargando}>
                {incidentes.map((incidente) => <TarjetaIncidente key={incidente.id} incidente={incidente} ocupado={ocupado} puedeEditar={permisos.actualizar} puedeEliminar={permisos.eliminar} onEditar={editar} onEliminar={eliminar} />)}
                {!cargando && !error && incidentes.length === 0 && <p className="p-6 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">No hay incidentes con estos filtros.</p>}
              </div>
              <div className="flex items-center justify-between gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={ocupado || pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</Button>
                <span className="text-xs">Página {pagina} de {paginas}</span>
                <Button variant="outline" size="sm" disabled={ocupado || pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <aside id="ayuda" className="mt-6 text-sm text-muted-foreground">
          <h2 className="font-semibold text-foreground mb-1">Antes de registrar</h2>
          <p>Describe hechos observados. Alta: servicio detenido o información expuesta; media: afectación parcial; baja: impacto menor. Usa datos ficticios y no incluyas contraseñas.</p>
          <p className="mt-2"><Badge variant="outline">Permisos</Badge> Analista: consulta y registra. Supervisor: consulta y actualiza. Administrador: además elimina.</p>
        </aside>
      </main>
      {pie}
    </>
  );
}
