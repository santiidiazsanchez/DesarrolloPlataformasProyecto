# API

Versión 1.0.0 · 23 de octubre de 2026

Base en producción: `https://incidentes-api-xqiw.onrender.com/api`. En local: `http://127.0.0.1:3001/api`.

Todas las respuestas son JSON (salvo el 204) y llevan `X-Request-Id` y `Cache-Control: no-store`. Las rutas de incidentes exigen `Authorization: Bearer <token>`.

## Rutas

| Método y ruta | Quién puede | Respuesta correcta |
| --- | --- | --- |
| `GET /salud` | Público | 200 con el estado de la base y el commit |
| `POST /auth/login` | Público | 200 con token y permisos |
| `GET /auth/perfil` | Con sesión | 200 con nombre, rol y permisos |
| `GET /incidentes` | Analista, supervisor y admin | 200 con la página pedida |
| `GET /incidentes/:id` | Analista, supervisor y admin | 200 con el incidente |
| `POST /incidentes` | Analista y admin | 201 con el incidente y `Location` |
| `PUT /incidentes/:id` | Supervisor y admin | 200 con el incidente actualizado |
| `DELETE /incidentes/:id` | Admin | 204 sin cuerpo |

El `:id` tiene la forma `INC-001`.

## Inicio de sesión

```http
POST /api/auth/login
Content-Type: application/json

{"correo": "analista@incidentes.local", "password": "<contraseña>"}
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs…",
  "expiraEn": "30m",
  "usuario": {
    "nombre": "Analista de prueba",
    "correo": "analista@incidentes.local",
    "rol": "ANALISTA",
    "permisos": { "consultar": true, "crear": true, "actualizar": false, "eliminar": false }
  }
}
```

- El correo se pasa a minúsculas. La contraseña admite hasta 72 bytes (límite de bcrypt).
- Correo inexistente, contraseña incorrecta y cuenta desactivada reciben el mismo 401: `Correo o contraseña incorrectos.`
- Después de 5 intentos fallidos en 15 minutos responde 429.
- El token es un JWT HS256 que dura 30 minutos y solo lleva el id del usuario y su rol.

## Lista de incidentes

`GET /api/incidentes?prioridad=Alta&estado=Registrado&pagina=1&limite=10`

| Parámetro | Valores |
| --- | --- |
| `prioridad` | `Alta`, `Media` o `Baja` (opcional) |
| `estado` | `Registrado`, `En revisión` o `Resuelto` (opcional) |
| `pagina` | Entero desde 1 (por defecto 1) |
| `limite` | Entre 1 y 50 (por defecto 10) |

```json
{
  "total": 3,
  "pagina": 1,
  "paginas": 1,
  "incidentes": [
    {
      "id": "INC-001",
      "titulo": "Correo que suplanta a soporte técnico",
      "tipo": "Phishing",
      "fecha": "2026-09-01",
      "prioridad": "Alta",
      "estado": "En revisión",
      "descripcion": "Se recibió un correo que solicita cambiar la contraseña…",
      "correo": "soporte@example.com",
      "evidencia": ""
    }
  ]
}
```

La lista no incluye `createdAt` ni `updatedAt`; el detalle (`GET /incidentes/:id`) sí.

## Cuerpo de un incidente

`POST` y `PUT` reciben el registro completo:

| Campo | Regla |
| --- | --- |
| `titulo` | 5 a 100 caracteres, único |
| `tipo` | `Phishing`, `Malware`, `Acceso no autorizado`, `Fallo de disponibilidad` o `Vulnerabilidad` |
| `fecha` | `AAAA-MM-DD`, una fecha que exista y no sea futura |
| `prioridad` | `Alta`, `Media` o `Baja` |
| `estado` | `Registrado`, `En revisión` o `Resuelto` |
| `descripcion` | 30 a 1000 caracteres |
| `correo` | Correo válido, hasta 120 caracteres |
| `evidencia` | Opcional: nombre de un PNG, JPG o PDF, sin rutas, hasta 150 caracteres |

- Las etiquetas HTML se eliminan y los espacios repetidos se reducen. Si después de limpiar queda una etiqueta (por ejemplo, escrita como `&lt;script&gt;`), se rechaza.
- Un campo que no está en la tabla (`id`, `rol`, `__proto__`) se rechaza con 400.
- El cuerpo admite hasta 100 KB.

## Errores

Formato: `{"error": "mensaje"}`. Los errores de validación agregan un mensaje por campo:

```json
{
  "error": "Revisa los datos enviados.",
  "campos": { "fecha": "La fecha no puede ser futura.", "correo": "El correo de contacto no es válido." }
}
```

| Código | Cuándo |
| --- | --- |
| 400 | Datos inválidos, JSON mal formado, id o filtro inválido |
| 401 | Sin token, token alterado, sin firma o vencido (con `WWW-Authenticate: Bearer`) |
| 403 | El rol no tiene el permiso o el origen no está en `CLIENT_ORIGIN` |
| 404 | El incidente o la ruta no existe |
| 409 | Ya existe un incidente con ese título (incluye `campos.titulo`) |
| 413 | El cuerpo pasa de 100 KB |
| 415 | Codificación no admitida |
| 429 | Demasiados intentos de inicio de sesión o solicitudes por minuto |
| 500 | Error inesperado: responde con el `id` de la solicitud, sin detalles |
| 503 | PostgreSQL no responde |

## Ejemplo con curl

```bash
API=https://incidentes-api-xqiw.onrender.com/api
TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d '{"correo":"analista@incidentes.local","password":"<contraseña>"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")
curl -s "$API/incidentes?prioridad=Alta" -H "Authorization: Bearer $TOKEN"
```
