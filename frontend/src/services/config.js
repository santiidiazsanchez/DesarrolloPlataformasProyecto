// La URL viene de frontend/.env: el cliente no lee la configuración ni los secretos del servidor.
// Está separada del servicio para poder reemplazarla en las pruebas (Jest no ejecuta import.meta).
export const API_URL = import.meta.env.VITE_API_URL;
