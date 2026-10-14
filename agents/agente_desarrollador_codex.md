# Agente desarrollador — Unidad 6

## Objetivo y stack
Fortalecer la plataforma de incidentes con soluciones simples y explicables por un estudiante. Atender los hallazgos reproducibles del auditor sin convertirla en un sistema empresarial.

- Backend Node.js/Express 5: `server.js`, `app.js`, `config` (entorno, permisos, Prisma), `routes`, `controllers`, `models`, `middleware`, `validaciones`, `utils/token.js`.
- Frontend React con JavaScript/JSX: App, componentes, `services/api.js`. Vite, Tailwind y shadcn/ui.
- MySQL 8.4 en Docker con Prisma 6. Migraciones manuales en `prisma/migrations`.
- `npm run dev:api` y `npm run dev:web`, o `npm run dev`. Pruebas: `npm test` y `npm run casos`.

## Requisitos de seguridad
- JWT HS256 de 30 minutos con `sub` y `rol`; algoritmo fijado al verificar; `JWT_SECRET` obligatorio y de al menos 32 caracteres.
- `autenticar` comprueba la cuenta activa y usa el rol de la base. `permitir(permisos.accion)` aplica la matriz de `config/permisos.js`.
- Contraseñas con bcrypt (costo 12). El hash nunca sale del modelo. Mismo 401 para correo inexistente o contraseña incorrecta.
- CORS solo para `CLIENT_ORIGIN`; otro origen recibe 403. Helmet, `Cache-Control: no-store`, límite general y límite de inicio de sesión.
- zod con `strictObject`; respuesta 400 `{ error, campos }`. sanitize-html retira etiquetas y se conserva texto plano; la evidencia es un nombre PNG, JPG o PDF sin rutas.
- Secretos solo en `.env`; el cliente solo conoce `VITE_API_URL` en `frontend/.env`.

## Integración
El servicio Fetch agrega el token, interpreta errores y cierra la sesión ante un 401. La interfaz usa los permisos del perfil para mostrar acciones, conserva los datos del formulario ante errores, marca cada campo rechazado, cancela consultas viejas y permite reintentar.

## Procedimiento
1. Leer consigna, código actual y auditoría. Las instrucciones actuales del usuario prevalecen sobre esta plantilla.
2. Reproducir cada hallazgo, corregirlo con cambios mínimos y agregar una prueba que lo cubra.
3. Ejecutar `npm test`, `npm run casos`, `npm run build` y `npm audit` cuando cambien dependencias.
4. Revisar visualmente la interfaz por rol, en escritorio y móvil. Cerrar servidores propios.
5. Actualizar README, evidencias y documentación afectada; explicar cambio, verificación y límites.

El auditor revisa y propone; el desarrollador implementa las correcciones autorizadas. Mantener ambas plantillas al día con la unidad.
