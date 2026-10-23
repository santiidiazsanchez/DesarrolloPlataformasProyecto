# Pruebas

Versión 1.0.0 · 23 de octubre de 2026

Las evidencias están en [`evidencias/Unidad 8`](../evidencias/Unidad%208).

## Resumen

| Nivel | Cómo se ejecuta | Resultado |
| --- | --- | --- |
| Lint | `npm run lint` (también en Actions) | 0 problemas |
| Unitarias | `npm test` (también en Actions) | 80 de 80; cobertura de 95,4 % de sentencias en los archivos medidos |
| Integración | `npm run test:api` con PostgreSQL 17 (Docker o Actions) | 32 de 32 |
| Casos de seguridad (Unidad 6) | `npm run casos` | 16 de 16 |
| Producción, casos públicos | Actions después de cada despliegue | 11 de 11 |
| Producción, con cuentas | `npm run produccion` | 21 de 21 |
| Prueba de fuego | Push con un error a propósito | Bloqueado antes de Render |
| Recorridos de usuario | A mano en la URL pública | 8 de 8 |

Salidas completas: [`npm-test-lista.txt`](../evidencias/Unidad%208/npm-test-lista.txt), [`npm-test.txt`](../evidencias/Unidad%208/npm-test.txt) (cobertura), [`npm-test-api-lista.txt`](../evidencias/Unidad%208/npm-test-api-lista.txt), [`lint.txt`](../evidencias/Unidad%208/lint.txt) y [`pruebas-produccion.md`](../evidencias/Unidad%208/pruebas-produccion.md).

## Integración

Corren contra `incidentes_test`, una base separada que el script vacía al empezar. Cubren:

- Inicio de sesión, hash bcrypt, mismo 401 para cualquier fallo y bloqueo con 429 tras 5 intentos.
- Tokens ausentes, alterados, sin firma (`alg: none`), vencidos o de otra clave: 401.
- Permisos por rol con 403 aunque la interfaz oculte el botón; un cambio de rol o una cuenta desactivada se aplican sin esperar a que venza el token.
- CORS, Helmet, `X-Request-Id`, `/api/salud`.
- CRUD completo, filtros, paginación, 409 por título repetido, 400 por datos inválidos, limpieza de HTML.
- 413, 415, JSON mal formado, rutas mal codificadas y gzip inválido.
- Persistencia al reiniciar Node y 503 con PostgreSQL detenido.
- Límite por minuto y `TRUST_PROXY=3`: un `X-Forwarded-For` inventado no evade el límite.

## Producción

`scripts/produccion.cjs` prueba la URL pública. Los casos P01 a P11 no necesitan cuentas y corren en Actions después de cada despliegue. P12 a P21 usan las contraseñas de `.env.produccion` y se ejecutan desde la computadora; crean un incidente y lo eliminan al final. La última corrida completa fue sobre `5665fe9` ([resultado](../evidencias/Unidad%208/pruebas-produccion.md)); los commits siguientes solo cambian documentación y evidencias.

| Caso | Esperado | Obtenido |
| --- | --- | --- |
| P01 Health check con la base conectada | 200 | 200 |
| P02 HTTP redirige a HTTPS | 301 | 301 |
| P03 HSTS y encabezados de Helmet | 200 | 200 |
| P04 El cliente carga por HTTPS con CSP y `X-Frame-Options` | 200 | 200 |
| P05 CORS acepta el dominio del cliente | 204 | 204 |
| P06 CORS rechaza otro dominio | 403 | 403 |
| P07 Acceso sin token | 401 | 401 |
| P08 Token sin firma con rol ADMIN | 401 | 401 |
| P09 Contraseña incorrecta | 401 | 401 |
| P10 JSON mal formado | 400 | 400 |
| P11 Ruta inexistente | 404 | 404 |
| P12 Inicio de sesión de las tres cuentas | 200 | 200 |
| P13 El analista lista los incidentes | 200 | 200 |
| P14 El analista registra un incidente | 201 | 201 |
| P15 Fecha futura, correo inválido y HTML | 400 | 400 |
| P16 Título repetido | 409 | 409 |
| P17 El analista intenta eliminar | 403 | 403 |
| P18 El supervisor cambia el estado | 200 | 200 |
| P19 El cambio persiste en una nueva consulta | 200 | 200 |
| P20 El administrador elimina el incidente | 204 | 204 |
| P21 El incidente eliminado ya no existe | 404 | 404 |

La verificación también encontró un error real: en el commit `a480885`, P05 dio 403 porque `CLIENT_ORIGIN` todavía no tenía la URL del cliente ([captura 08](../evidencias/Unidad%208/08-actions-verificacion-detecta-cors.png)). Se corrigió en Render y la siguiente ejecución dio 11 de 11 ([captura 14](../evidencias/Unidad%208/14-actions-revert-verde.png)).

## Recorridos de usuario

Hechos en la URL pública con las tres cuentas, siguiendo el [manual de usuario](MANUAL_USUARIO.md).

| Recorrido | Esperado | Obtenido | Evidencia |
| --- | --- | --- | --- |
| PF-01 Iniciar sesión | Panel con nombre y rol | Correcto | [17](../evidencias/Unidad%208/17-login-produccion.png), [18](../evidencias/Unidad%208/18-panel-analista.png) |
| PF-02 Filtrar sin resultados | Mensaje de lista vacía | *No hay incidentes con estos filtros.* | [19c](../evidencias/Unidad%208/19c-filtros.png) |
| PF-03 Título de 3 caracteres | No se envía | Aviso del navegador: mínimo 5 caracteres | [20](../evidencias/Unidad%208/20-validacion.png) |
| PF-04 Registrar como analista | 201 y aviso | *INC-006 registrado correctamente.* | [21](../evidencias/Unidad%208/21-registro-analista.png), [23b](../evidencias/Unidad%208/23b-render-logs-crud.png) |
| PF-05 Supervisor sin registrar ni eliminar | Solo **Editar** | Correcto | [19](../evidencias/Unidad%208/19-panel-supervisor.png), [19b](../evidencias/Unidad%208/19b-supervisor-sin-eliminar.png) |
| PF-06 Supervisor cambia el estado | 200 y estado nuevo | "En revisión" | [22](../evidencias/Unidad%208/22-edicion-supervisor.png), [22b](../evidencias/Unidad%208/22b-estado-en-revision.png), [23b](../evidencias/Unidad%208/23b-render-logs-crud.png) |
| PF-07 Persistencia tras reiniciar | El cambio sigue | INC-006 sigue "En revisión" | [24c](../evidencias/Unidad%208/24c-render-reinicio.png), [`persistencia-reinicio.txt`](../evidencias/Unidad%208/persistencia-reinicio.txt) |
| PF-08 Admin elimina con confirmación | 204 y aviso | *INC-001 eliminado.* | [26](../evidencias/Unidad%208/26-confirmar-eliminacion.png), [27](../evidencias/Unidad%208/27-panel-admin.png) |

También se revisó la vista a 400 px de ancho ([29](../evidencias/Unidad%208/29-movil.png), [29b](../evidencias/Unidad%208/29b-movil.png)) y que la CSP no bloquee nada del cliente.

## Prueba de fuego

Simulamos un error de seguridad: en `backend/config/permisos.js` le dimos al analista el permiso de eliminar (commit `ef50c55`).

| Paso | Resultado |
| --- | --- |
| Push del error | Fallaron las unitarias (caso `ANALISTA` de permisos) y las de integración (403 por rol) |
| Despliegue | "Desplegar en Render" y "Verificar producción" quedaron omitidos; Render no recibió el commit |
| `git revert` y push (`d17f6a1`) | Todo en verde, despliegue y 11 de 11 en producción |

Capturas: [11](../evidencias/Unidad%208/11-prueba-fuego-bug.png), [12](../evidencias/Unidad%208/12-prueba-fuego-actions.png), [13](../evidencias/Unidad%208/13-prueba-fuego-revert.png), [15](../evidencias/Unidad%208/15-render-deploys-web.png) y [16](../evidencias/Unidad%208/16-render-deploys-api.png).

## Checklist de producción (Tema 15.5)

| Punto | Resultado |
| --- | --- |
| La URL carga con HTTPS sin advertencias | Sí (P02, P04 y [captura 17](../evidencias/Unidad%208/17-login-produccion.png)) |
| `/api/salud` responde 200 con la base conectada | Sí (P01 y [captura 04](../evidencias/Unidad%208/04-salud-produccion.png)) |
| El CRUD funciona y las validaciones responden 400 | Sí (P12 a P21) |
| Los datos persisten tras reiniciar el servicio | Sí (PF-07: INC-006 creado y editado antes del reinicio, consultado después) |
| No hay `.env` en ningún commit; la URL de la base y los hooks solo están en Render y GitHub | Sí: solo se versionaron los `.env.example` y ninguna de las 13 claves reales aparece en `git log -p` |
| Los logs no muestran cuerpos, contraseñas ni tokens | Sí: solo método, ruta, código, duración, usuario y rol ([23](../evidencias/Unidad%208/23-render-logs-sesiones.png), [23b](../evidencias/Unidad%208/23b-render-logs-crud.png)). En las capturas tapamos la IP del cliente y el host de la base |
| El último workflow está en verde y Render tiene el último commit de `main` | Sí (capturas 14 a 16; `/api/salud` muestra el commit de la etiqueta `v1.0.0`) |
