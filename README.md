# Incidentes — Tarea 7

Plataforma para registrar y dar seguimiento a incidentes de ciberseguridad. React en el cliente, Express en la API y MySQL con Prisma.

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

## Pruebas y calidad

- `npm test`: pruebas unitarias con Jest (reglas del negocio y servicio del cliente, sin base de datos).
- `npm run test:coverage`: lo mismo con el reporte de cobertura en `coverage/`.
- `npm run test:api`: pruebas de integración contra otra base MySQL (puerto 3308).
- `npm run casos`: casos de seguridad de la Unidad 6.
- `npm run lint`: ESLint.
- `npm run medir -- consulta antes` (o `red`, `imagen`; `antes` o `despues`): mediciones con 50 000 incidentes en la base de pruebas.

Antes de entregar corre `npm run lint`, `npm test` y `npm run test:api`.

## Estructura

```
backend/
  routes/        rutas y permisos de cada operación
  controllers/   solo HTTP: leen la solicitud y responden
  services/      reglas del negocio (filtros, paginación, códigos INC)
  models/        consultas con Prisma
  middleware/    autenticación, validación, límites y errores
  validaciones/  esquemas de zod
  utils/         token, códigos INC y errores
  tests/         unit/ (Jest) y api.test.js (integración)
frontend/src/    App, componentes y services/api.js
prisma/          esquema, migraciones y datos de ejemplo
scripts/         configurar, pruebas, casos, mediciones e imagen
evidencias/      capturas y reportes de cada unidad
```

## Variables de entorno

- `.env` (servidor): `DATABASE_URL`, `DATABASE_URL_PRUEBAS`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` y las claves de prueba. Opcionales: `LIMITE_POR_MINUTO`, `TRUST_PROXY`, `HTTPS_CERT`, `HTTPS_KEY`.
- `frontend/.env` (cliente): solo `VITE_API_URL`.

Los dos se crean con `npm run configurar`; `.env.example` y `frontend/.env.example` muestran los nombres.

## Otros comandos

Base: `npm run db:ver`. Imagen de ayuda: `npm run imagen` genera los WebP desde `recursos/originales`.

HTTPS local (opcional): `npm run certificado` y agrega a `.env` `HTTPS_CERT=certificados/certificado.pem` y `HTTPS_KEY=certificados/clave.pem`. En producción la API va detrás de un proxy (Nginx o Caddy) con certificado de una autoridad, que redirige HTTP a HTTPS; ahí se usa `TRUST_PROXY=1`.

Para volver a trabajar: `npm run db:iniciar` y `npm run dev`.
Para detener MySQL: `docker compose stop mysql`. El volumen conserva los datos.

Entrega: excluye `.env`, `frontend/.env`, `certificados`, `coverage`, `node_modules`, `.git`, `frontend/dist` y tareas anteriores.
