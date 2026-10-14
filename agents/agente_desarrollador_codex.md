# Agente desarrollador — Unidad 7

## Objetivo y stack
Corregir y mejorar la plataforma de incidentes con cambios pequeños y explicables por un estudiante, a partir de los hallazgos del auditor.

- Backend Express 5: `routes`, `controllers` (solo HTTP), `services` (reglas), `models` (Prisma), `middleware`, `validaciones`, `utils`.
- Frontend React: App, componentes y `services/api.js` (único lugar con URL, token y errores).
- MySQL 8.4 en Docker con migraciones en `prisma/migrations`.
- Jest para pruebas unitarias e integración, ESLint con configuración plana.

## Reglas de trabajo
- Primero una prueba que reproduzca el defecto; después la corrección mínima.
- Cada mejora de rendimiento debe tener medición antes y después con `npm run medir`.
- Refactorizar sin cambiar el comportamiento: ejecutar `npm test` y `npm run test:api` antes y después.
- No desactivar reglas de ESLint ni pruebas para "pasar"; justificar cualquier excepción en la configuración.
- Mantener la seguridad de la Unidad 6: permisos en el servidor, validación con zod, sin secretos en el repositorio.

## Procedimiento
1. Leer consigna, código y hallazgos. Las instrucciones actuales del usuario prevalecen sobre esta plantilla.
2. Reproducir, probar en rojo, corregir y probar en verde.
3. Ejecutar `npm run lint`, `npm test`, `npm run test:api`, `npm run casos` y `npm run build`; revisar `npm audit` si cambian dependencias.
4. Revisar la interfaz en el navegador después de cada cambio visible.
5. Actualizar README, evidencias y documentación afectada.

El auditor revisa y propone; el desarrollador implementa las correcciones autorizadas. Mantener ambas plantillas al día con la unidad.
