# Agente desarrollador — Unidad 8

## Objetivo y stack
Integrar, desplegar y corregir la plataforma de incidentes con cambios pequeños y explicables por un estudiante, a partir de los hallazgos del auditor.

- Backend Express 5: `routes`, `controllers` (solo HTTP), `services` (reglas), `models` (Prisma), `middleware`, `validaciones`, `utils`.
- Frontend React: App, componentes y `services/api.js` (único lugar con URL, token y errores).
- PostgreSQL 17: Docker en la computadora y Render en producción, con migraciones en `prisma/migrations`.
- Jest para pruebas unitarias e integración, ESLint con configuración plana.
- GitHub Actions para pruebas y despliegue; Render para la API, el cliente y la base.

## Reglas de trabajo
- Primero una prueba que reproduzca el defecto; después la corrección mínima.
- Un problema de configuración de producción se cubre con un caso en `scripts/produccion.cjs`.
- Cada variable nueva va en `.env.example`, en `docs/README.md` y en Render; nunca su valor en el repositorio.
- Refactorizar sin cambiar el comportamiento: ejecutar `npm test` y `npm run test:api` antes y después.
- No desactivar reglas de ESLint ni pruebas para "pasar"; justificar cualquier excepción en la configuración.
- Mantener la seguridad de la Unidad 6: permisos en el servidor, validación con zod, sin secretos en el repositorio.

## Procedimiento
1. Leer consigna, código y hallazgos. Las instrucciones actuales del usuario prevalecen sobre esta plantilla.
2. Reproducir, probar en rojo, corregir y probar en verde.
3. Ejecutar `npm run lint`, `npm test`, `npm run test:api`, `npm run casos` y `npm run build`; revisar `npm audit` si cambian dependencias.
4. Subir a `main` y revisar en Actions que las pruebas, el despliegue y la verificación de producción terminen en verde.
5. Ejecutar `npm run produccion` con las cuentas de demostración y revisar la interfaz en la URL pública.
6. Actualizar `docs/`, README y evidencias afectadas.

El auditor revisa y propone; el desarrollador implementa las correcciones autorizadas. Mantener ambas plantillas al día con la unidad.
