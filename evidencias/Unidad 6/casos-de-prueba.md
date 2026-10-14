# Casos de prueba — Unidad 6

Ejecutados con `npm run casos`. Fecha: 9/10/2026, 11:55:09 a. m.

| Id | Caso | Rol | Solicitud | Esperado | Obtenido | Resultado |
| --- | --- | --- | --- | --- | --- | --- |
| C01 | Inicio de sesión correcto | Analista | `POST /api/auth/login` | 200 | 200 | Correcto |
| C02 | Contraseña incorrecta | Sin sesión | `POST /api/auth/login` | 401 | 401 | Correcto |
| C03 | Acceso sin token | Sin sesión | `GET /api/incidentes` | 401 | 401 | Correcto |
| C04 | Token manipulado (rol cambiado a ADMIN) | Analista | `DELETE /api/incidentes/INC-001` | 401 | 401 | Correcto |
| C05 | Crear con etiquetas HTML (se limpian) | Analista | `POST /api/incidentes` | 201 | 201 | Correcto |
| C06 | Consultar el incidente creado | Supervisor | `GET /api/incidentes/INC-006` | 200 | 200 | Correcto |
| C07 | Permiso insuficiente: eliminar | Analista | `DELETE /api/incidentes/INC-006` | 403 | 403 | Correcto |
| C08 | Permiso insuficiente: crear | Supervisor | `POST /api/incidentes` | 403 | 403 | Correcto |
| C09 | Actualizar el estado | Supervisor | `PUT /api/incidentes/INC-006` | 200 | 200 | Correcto |
| C10 | Datos inválidos y campo interno "rol" | Admin | `POST /api/incidentes` | 400 | 400 | Correcto |
| C11 | Título solo con `<script>` | Admin | `POST /api/incidentes` | 400 | 400 | Correcto |
| C12 | Eliminar con rol autorizado | Admin | `DELETE /api/incidentes/INC-006` | 204 | 204 | Correcto |
| C13 | Consultar el incidente eliminado | Admin | `GET /api/incidentes/INC-006` | 404 | 404 | Correcto |
| C14 | CORS: preflight del cliente permitido | Navegador | `OPTIONS /api/incidentes` | 204 | 204 | Correcto |
| C15 | CORS: origen no permitido | Navegador | `GET /api/incidentes` | 403 | 403 | Correcto |
| C16 | Fuerza bruta: sexto intento fallido | Sin sesión | `POST /api/auth/login x6` | 429 | 429 | Correcto |
