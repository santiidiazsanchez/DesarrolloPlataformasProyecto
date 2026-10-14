// Único lugar que conoce la URL de la API, el token y el formato de errores.
// La URL viene de frontend/.env: el cliente no lee la configuración ni los secretos del servidor.
const API_URL = import.meta.env.VITE_API_URL;
const CLAVE_TOKEN = 'token';
let alExpirarSesion = () => {};

export class ErrorApi extends Error {
  constructor(mensaje, estado, campos = {}) {
    super(mensaje);
    this.estado = estado;
    this.campos = campos;
  }
}

export function cuandoExpireSesion(funcion) { alExpirarSesion = funcion; }
export function haySesion() { return Boolean(sessionStorage.getItem(CLAVE_TOKEN)); }
export function cerrarSesion() { sessionStorage.removeItem(CLAVE_TOKEN); }

async function solicitar(ruta, { metodo = 'GET', datos, signal } = {}) {
  if (!API_URL) throw new ErrorApi('Falta VITE_API_URL en frontend/.env. Ejecuta npm run configurar.', 0);
  const token = sessionStorage.getItem(CLAVE_TOKEN);
  const headers = {};
  if (datos !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  let respuesta;
  try {
    respuesta = await fetch(API_URL + ruta, { method: metodo, headers, body: datos === undefined ? undefined : JSON.stringify(datos), signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ErrorApi('No se pudo conectar con la API. Revisa que esté encendida.', 0);
  }
  if (respuesta.status === 204) return null;
  const cuerpo = await respuesta.json().catch(() => null);
  // Un 401 con token guardado significa sesión vencida o revocada: se vuelve al inicio de sesión.
  if (respuesta.status === 401 && token) {
    cerrarSesion();
    alExpirarSesion(cuerpo?.error || 'Tu sesión terminó. Inicia sesión de nuevo.');
  }
  if (!respuesta.ok) throw new ErrorApi(cuerpo?.error || 'La API no está disponible. Intenta de nuevo.', respuesta.status, cuerpo?.campos);
  if (!cuerpo) throw new ErrorApi('La respuesta de la API no contiene datos válidos.', respuesta.status);
  return cuerpo;
}

export async function iniciarSesion(correo, password) {
  const datos = await solicitar('/auth/login', { metodo: 'POST', datos: { correo, password } });
  // sessionStorage: el token se borra al cerrar la pestaña y no viaja solo en cada petición como una cookie.
  sessionStorage.setItem(CLAVE_TOKEN, datos.token);
  return datos.usuario;
}

export function obtenerPerfil() {
  return solicitar('/auth/perfil');
}

export function listarIncidentes({ prioridad = '', estado = '', pagina = 1 } = {}, signal) {
  const filtros = new URLSearchParams({ pagina, limite: 10 });
  if (prioridad) filtros.set('prioridad', prioridad);
  if (estado) filtros.set('estado', estado);
  return solicitar(`/incidentes?${filtros}`, { signal });
}

export function guardarIncidente(datos, id) {
  return solicitar(id ? `/incidentes/${id}` : '/incidentes', { metodo: id ? 'PUT' : 'POST', datos });
}

export function eliminarIncidente(id) {
  return solicitar(`/incidentes/${id}`, { metodo: 'DELETE' });
}
