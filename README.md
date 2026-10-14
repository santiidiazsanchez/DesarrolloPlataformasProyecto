# Incidentes — Tarea 6

Requisitos: Node.js 22.12 o superior y Docker Desktop encendido.

Primera vez, desde esta carpeta:

```bash
npm install
npm run configurar
npm run db:iniciar
npm run db:generar
npm run db:migrar
npm run db:ejemplos
```

`npm run configurar` crea `.env` con las claves y `frontend/.env` con la URL de la API.

Backend (primera terminal):

```bash
npm run dev:api
```

Frontend (segunda terminal):
```bash
npm run dev:web
```

Abre http://127.0.0.1:5173. También puedes iniciar ambos con `npm run dev`.

Usuarios de prueba: admin, supervisor y analista `@incidentes.local`. Las contraseñas están en `.env` (`CLAVE_ADMIN`, `CLAVE_SUPERVISOR`, `CLAVE_ANALISTA`).

Base: `npm run db:ver`. Pruebas: `npm test` (usa otra base, en el puerto 3308). Casos de seguridad: `npm run casos`.

HTTPS local (opcional): `npm run certificado` y agrega a `.env` `HTTPS_CERT=certificados/certificado.pem` y `HTTPS_KEY=certificados/clave.pem`. En producción la API va detrás de un proxy (Nginx o Caddy) con certificado de una autoridad, que redirige HTTP a HTTPS; ahí se usa `TRUST_PROXY=1`.

Para volver a trabajar: `npm run db:iniciar` y `npm run dev`.
Para detener MySQL: `docker compose stop mysql`. El volumen conserva los datos.

Entrega: excluye `.env`, `frontend/.env`, `certificados`, `node_modules`, `.git`, `frontend/dist` y tareas anteriores.
