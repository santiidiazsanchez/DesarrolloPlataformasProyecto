# Auditoría de la Unidad 6

Revisión del 9 de octubre de 2026 con el agente auditor (Claude Code), aplicando `agente_auditor_claude.md`; las correcciones siguieron `agente_desarrollador_codex.md`. Alcance: API Express, cliente React, base MySQL de desarrollo y de pruebas, dependencias y solicitudes HTTP. No es una certificación de seguridad.

## Resultado

- Auditoría inicial sobre la versión de la Tarea 5: 8 hallazgos (figura 15 de `evidencias/Unidad 6`).
- Durante la implementación se encontraron 4 fallos más; todos se corrigieron y se volvieron a probar.
- `npm audit`: de 3 vulnerabilidades (2 críticas y 1 alta) a 0.
- `npm test`: 28 pruebas aprobadas, 0 fallos. `npm run casos`: 16 de 16 casos correctos.
- Las pruebas usaron una base separada o instancias en puertos temporales. Se cerraron los procesos propios.

## Hallazgos de la auditoría inicial

| # | Severidad | Hallazgo reproducido | Corrección y verificación |
| --- | --- | --- | --- |
| 1 | Crítica | Sin `Authorization`, `POST` respondió 201 y `DELETE /api/incidentes/INC-004` respondió 204. | Todas las rutas de incidentes usan `autenticar` y `permitir`. Sin token: 401 en las 6 rutas protegidas (C03); analista eliminando y supervisor creando: 403 (C07, C08). |
| 2 | Alta | No existían cuentas: `POST /api/auth/login` devolvía 404. | Tabla `Usuario`, inicio de sesión con bcrypt costo 12 y JWT HS256 de 30 minutos (C01, C02, figura 21). |
| 3 | Media | El título `<img src=x onerror=alert(1)> Acceso <b>raro</b>` se guardaba tal cual. React lo escapaba, pero otro cliente con `innerHTML` lo ejecutaría. | zod + sanitize-html retiran etiquetas; `<script>` sin texto queda vacío y recibe 400 (C05, C11). |
| 4 | Media | La API aceptó las evidencias `virus.exe` y `../../etc/passwd`, aunque el formulario solo permite PNG, JPG y PDF. | El servidor exige un nombre sin rutas con esas extensiones (C10). |
| 5 | Baja | Los campos `rol` e `id` se ignoraban sin aviso y la validación solo informaba el primer error. | `z.strictObject`: 400 con `campos` y "Campo no permitido." (C10). React muestra cada mensaje junto a su campo. |
| 6 | Media | 120 solicitudes seguidas recibieron 200: no había límite ni protección de fuerza bruta. | 100 solicitudes por minuto por IP y 5 inicios de sesión fallidos cada 15 minutos (C16 y prueba automática del 429). |
| 7 | Baja | `X-Powered-By: Express`, sin encabezados de seguridad y sin política CORS propia (dependía del proxy de Vite). | Helmet, `Cache-Control: no-store` y CORS con `CLIENT_ORIGIN`; otro origen recibe 403 (C14, C15, figura 20). |
| 8 | Crítica en desarrollo | `npm audit`: shell-quote (vía concurrently 9.2.4) y source-map-js. | concurrently 9.2.5 y `npm audit fix`: 0 vulnerabilidades (figura 25). |

## Fallos encontrados durante la implementación

| # | Fallo | Cómo se detectó | Corrección |
| --- | --- | --- | --- |
| 9 | Con el patrón de la guía (rol leído del token), un token emitido como ADMIN siguió eliminando (204) después de cambiar el rol a ANALISTA, y una cuenta desactivada siguió consultando (200). | Prueba manual cambiando el rol y `activo` en MySQL con un token vigente. | `autenticar` busca la cuenta y usa el rol actual: 403 y 401. Prueba automática agregada (figura 16). |
| 10 | sanitize-html devuelve HTML escapado: "R&D" se guardaba como "R&amp;D" y React lo mostraba literalmente. | Prueba con caracteres `&`, `<` y `>`. | Se revierten esas entidades y se rechaza una etiqueta escrita como entidad (`&lt;script&gt;`) con 400 (figura 19). |
| 11 | El navegador recibía 304 en consultas autenticadas: guardaba incidentes en su caché. | Registro del servidor durante la prueba en el navegador. | `Cache-Control: no-store` en `/api` y prueba automática. |
| 12 | El botón "Cerrar sesión" perdía contraste con tema oscuro y "Reintentar consulta" aparecía en errores de validación. | Revisión visual en el navegador. | Variante `secondary` y reintento solo cuando falla la consulta de la lista. |

## CORS y configuración del cliente

El cliente ya no usa el proxy de Vite: llama a `VITE_API_URL` desde `frontend/.env`, que solo contiene la URL pública. Así el cliente queda aislado de la configuración y los secretos del servidor (sugerencia de entregas anteriores). La API responde el preflight del origen permitido con 204 y los métodos y encabezados aceptados; cualquier otro origen recibe 403 sin `Access-Control-Allow-Origin`, y Chrome bloquea la lectura. CORS no reemplaza la autenticación: curl sin `Origin` sigue necesitando un token válido.

## Límites y mejoras futuras

- El token vive en `sessionStorage`: un XSS podría leerlo. Se reduce el riesgo con React (texto, sin `innerHTML`), limpieza en servidor y tokens de 30 minutos. En producción se evaluaría una cookie `HttpOnly` y `SameSite` con protección CSRF.
- Cerrar sesión borra el token del navegador; el servidor solo lo invalida al desactivar la cuenta o cambiar el rol, o cuando vence.
- No hay gestión de usuarios, recuperación de contraseña ni segundo factor. Las cuentas de prueba se crean con `npm run db:ejemplos`.
- El límite de solicitudes se guarda en memoria; con varias instancias haría falta un almacén compartido.
- HTTPS se probó con un certificado autofirmado; la publicación requiere un certificado de una autoridad en el proxy (README).
- El registro de operaciones se imprime en consola; no se conserva en una tabla de auditoría.
