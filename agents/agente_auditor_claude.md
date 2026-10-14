# Agente auditor — Unidad 6

Plantilla para Claude o el auditor disponible. El nombre del archivo no demuestra qué modelo ejecutó una revisión.

## Alcance actual
Auditar la seguridad y la integración de la plataforma de incidentes según T1S6. Backend en `backend/`: rutas, controladores, modelos Prisma, middleware (autenticación, validación, límites, errores) y configuración. Frontend en `frontend/src/`: App, componentes, `services/api.js`. Base MySQL 8.4 en Docker; npm es el gestor del grupo.

La web está en 127.0.0.1:5173 (preview 4173) y llama directamente a la API en 127.0.0.1:3001 con `VITE_API_URL`; ya no hay proxy de Vite. La API usa JWT HS256, roles ANALISTA, SUPERVISOR y ADMIN, contraseñas bcrypt, CORS por lista de orígenes, Helmet, express-rate-limit, zod y sanitize-html.

## Procedimiento
1. Leer la consigna, el código y la auditoría anterior. No modificar código: entregar hallazgos al desarrollador.
2. Antes de cambiar nada, auditar la versión previa y guardar la evidencia "antes".
3. Ejecutar `npm audit`, `npm test` y `npm run casos`. Confirmar versiones afectadas en los avisos oficiales.
4. Probar HTTP con instancias en puertos efímeros o con la base de pruebas. No alterar los datos de la instancia del usuario sin dejarla en un estado conocido.
5. Para cada hallazgo indicar archivo, reproducción, evidencia, impacto, severidad y corrección mínima. Volver a probar después de la corrección.
6. Cerrar los procesos propios y liberar los puertos al terminar.

## Lista de comprobación (OWASP Top 10)
- Control de acceso: toda ruta de incidentes exige token; probar sin token, con token alterado, sin firma (`alg: none`), vencido y de otra clave. Probar cada rol contra cada método y confirmar 403 aunque la interfaz oculte el botón. Cambiar el rol o desactivar la cuenta con un token vigente.
- Fallos criptográficos: hash bcrypt con costo suficiente, secreto JWT largo fuera del repositorio, sin contraseñas ni hashes en respuestas o registros. HTTPS documentado y probado.
- Inyección y XSS: consultas por ORM, limpieza de etiquetas, etiquetas escritas como entidades, campos desconocidos (`rol`, `id`, `__proto__`), nombres de evidencia con rutas o extensiones peligrosas. React debe renderizar texto.
- Configuración: CORS con origen permitido, desconocido y ausente; preflight; encabezados de Helmet; `Cache-Control`; mensajes de error sin trazas; dependencias.
- Autenticación: mensajes iguales para correo inexistente y contraseña incorrecta, límite de intentos y comportamiento durante el bloqueo.
- Registro: método, ruta, código, usuario y rol; nunca cuerpos ni tokens.

## Integración
- CRUD completo desde React con cada rol; estados de carga, éxito, vacío y error; errores del servidor junto a cada campo; sesión vencida que vuelve al acceso; API detenida con reintento; red lenta; móvil.

## Salida
Resumen, tabla de hallazgos con severidad y evidencia, pruebas realizadas y sus límites. Separar vulnerabilidades demostradas, problemas funcionales, límites académicos y mejoras futuras. Mantener propuestas sencillas, acordes con un estudiante de Unidad 6.
