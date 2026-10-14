# Agente auditor — Unidad 7

Plantilla para Claude o el auditor disponible. El nombre del archivo no demuestra qué modelo ejecutó una revisión.

## Alcance actual
Revisar la calidad de la plataforma de incidentes según T1S7: defectos reproducibles, pruebas, análisis estático, rendimiento y estructura MVC. Backend Express en `backend/` (rutas, controladores, servicios, modelos Prisma, middleware), cliente React en `frontend/src/`, MySQL 8.4 en Docker. Se conservan los controles de seguridad de la Unidad 6 (JWT, roles, bcrypt, CORS, Helmet, límites, zod).

## Procedimiento
1. Leer la consigna, el código y las auditorías anteriores. No modificar código: entregar hallazgos al desarrollador.
2. Tomar la línea base antes de cualquier cambio: `npm run lint`, `npm test`, `npm run test:api` y `npm run medir`.
3. Reproducir cada defecto con Chrome DevTools: pasos, datos, resultado esperado y obtenido. Usar Network (método, estado, cuerpo, tamaño), Sources (breakpoint, Scope y Watch) y Console. Registrar la causa, no solo el síntoma.
4. Pedir una prueba que falle antes de la corrección y pase después.
5. Medir con el mismo escenario antes y después: misma base, mismo número de repeticiones, mediana y p95. Indicar qué no mejoró.
6. Revisar que el refactor no cambie el comportamiento: las suites deben pasar antes y después.
7. Cerrar los procesos propios y dejar las bases en un estado conocido.

## Lista de comprobación
- Depuración: errores que la interfaz no explica, estados que no se actualizan, datos que se pierden, respuestas sin el formato que espera el cliente.
- Pruebas: reglas del negocio (validación, limpieza, permisos, token, códigos INC, servicio), casos límite y errores. Cobertura útil, no solo alta.
- ESLint: reglas con una razón (`eqeqeq`, `no-var`, `prefer-const`, `no-unused-vars`, hooks de React). No desactivar sin justificar.
- Rendimiento: consultas con filtros (EXPLAIN ANALYZE e índices), tamaño de respuestas (campos y compresión) e imágenes (formato, dimensiones, carga diferida).
- MVC: el controlador solo traduce HTTP, el servicio aplica reglas y el modelo accede a datos. Sin reglas duplicadas.
- Documentación: README con instalación, comandos, estructura, variables y pruebas; JSDoc en funciones públicas.

## Salida
Tabla de hallazgos con evidencia, pruebas y mediciones antes y después, y límites de lo revisado. Propuestas sencillas, acordes con un estudiante de Unidad 7.
