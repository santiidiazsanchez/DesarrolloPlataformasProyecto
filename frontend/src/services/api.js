// Único lugar que conoce la URL de la API, el token y el formato de errores.
import { API_URL } from './config.js';
const CLAVE_TOKEN = 'token';
const CLAVE_BORRADOR = 'borrador';
let alExpirarSesion = () => {};
let alCambiarPermisos = () => {};

export class ErrorApi extends Error {
  constructor(mensaje, estado, campos = {}) {
    super(mensaje);
    this.estado = estado;
    this.campos = campos;
  }
}

export function cuandoExpireSesion(funcion) { alExpirarSesion = funcion; }
export function cuandoCambienPermisos(funcion) { alCambiarPermisos = funcion; }
export function haySesion() { return Boolean(sessionStorage.getItem(CLAVE_TOKEN)); }
export function cerrarSesion() { sessionStorage.removeItem(CLAVE_TOKEN); }

// Lee el id de la cuenta desde el token. La firma la valida el servidor; aquí solo se usa para el borrador.
function cuentaActual() {
  const token = sessionStorage.getItem(CLAVE_TOKEN);
  try {
    return JSON.parse(atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))).sub;
  } catch {
    return null;
  }
}

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
  // Un 403 con sesión indica que el rol cambió: la interfaz vuelve a pedir los permisos.
  if (respuesta.status === 403 && token) alCambiarPermisos();
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

export async function guardarIncidente(datos, id) {
  const cuenta = cuentaActual();
  try {
    return await solicitar(id ? `/incidentes/${id}` : '/incidentes', { metodo: id ? 'PUT' : 'POST', datos });
  } catch (error) {
    // Si la sesión venció al guardar, los datos quedan en un borrador de esta pestaña para la misma cuenta.
    if (error.estado === 401 && cuenta) sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ cuenta, datos, id: id || null }));
    throw error;
  }
}

// Entrega el borrador una sola vez y solo a la cuenta que lo escribió.
export function recuperarBorrador() {
  const guardado = sessionStorage.getItem(CLAVE_BORRADOR);
  if (!guardado) return null;
  sessionStorage.removeItem(CLAVE_BORRADOR);
  const { cuenta, datos, id } = JSON.parse(guardado);
  return cuenta === cuentaActual() ? { datos, id } : null;
}

export function eliminarIncidente(id) {
  return solicitar(`/incidentes/${id}`, { metodo: 'DELETE' });
}
