# Verificación en producción

- Fecha: 2026-10-23T20:50:01.262Z
- API: https://incidentes-api-xqiw.onrender.com/api
- Cliente: https://incidentes-web-0eqn.onrender.com
- Versión en línea: 5665fe9
- Resultado: 21 de 21 casos correctos

| Caso | Solicitud | Esperado | Obtenido |
|---|---|---|---|
| ✔ P01 Health check con la base conectada | GET /api/salud | 200 | 200 |
| ✔ P02 HTTP redirige a HTTPS | GET http://…/api/salud | 301 o 302 o 307 o 308 | 301 |
| ✔ P03 HSTS y encabezados de Helmet | GET /api/salud | 200 | 200 |
| ✔ P04 El cliente React carga por HTTPS con CSP | GET / (sitio) | 200 | 200 |
| ✔ P05 CORS acepta el dominio del cliente | OPTIONS /api/incidentes | 204 | 204 |
| ✔ P06 CORS rechaza otro dominio | GET /api/incidentes con Origin externo | 403 | 403 |
| ✔ P07 Acceso sin token | GET /api/incidentes | 401 | 401 |
| ✔ P08 Token sin firma (alg none) con rol ADMIN | DELETE /api/incidentes/INC-001 | 401 | 401 |
| ✔ P09 Contraseña incorrecta | POST /api/auth/login | 401 | 401 |
| ✔ P10 JSON mal formado | POST /api/auth/login | 400 | 400 |
| ✔ P11 Ruta inexistente | GET /api/no-existe | 404 | 404 |
| ✔ P12 Inicio de sesión de las tres cuentas | POST /api/auth/login | 200 | 200 |
| ✔ P13 El analista lista los incidentes | GET /api/incidentes | 200 | 200 |
| ✔ P14 El analista registra un incidente | POST /api/incidentes | 201 | 201 |
| ✔ P15 Datos inválidos: fecha futura, correo y HTML | POST /api/incidentes | 400 | 400 |
| ✔ P16 Título repetido | POST /api/incidentes | 409 | 409 |
| ✔ P17 Rol insuficiente: el analista intenta eliminar | DELETE /api/incidentes/INC-009 | 403 | 403 |
| ✔ P18 El supervisor cambia el estado | PUT /api/incidentes/INC-009 | 200 | 200 |
| ✔ P19 El cambio persiste en una nueva consulta | GET /api/incidentes/INC-009 | 200 | 200 |
| ✔ P20 El administrador elimina el incidente | DELETE /api/incidentes/INC-009 | 204 | 204 |
| ✔ P21 El incidente eliminado ya no existe | GET /api/incidentes/INC-009 | 404 | 404 |
