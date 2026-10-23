# Revisión de la Unidad 7

Revisión del 13 de octubre de 2026 con el agente auditor (Claude Code) aplicando `agente_auditor_claude.md`; las correcciones siguieron `agente_desarrollador_codex.md`. Las evidencias están en `evidencias/Unidad 7`.

## Línea base

- ESLint: 10 problemas (9 errores y 1 advertencia) en 39 archivos.
- Pruebas: 28 de integración aprobadas; no había pruebas unitarias.
- Consulta con filtro Alta + Resuelto sobre 50 000 incidentes: mediana 19,3 ms (página 1) y 39,5 ms (página 200).
- Lista de 10 incidentes: 6 125 bytes sin compresión.
- Guía de phishing: PNG de 1600×1000 y 446 KB descargado al iniciar sesión.

## Defectos reproducidos con DevTools

| # | Defecto | Causa | Corrección | Prueba |
| --- | --- | --- | --- | --- |
| 1 | Al repetir un título, la API respondía 409 solo con un mensaje general; el formulario no marcaba el campo. | El manejador de errores no incluía `campos` para P2002. | Se agrega `campos.titulo`. | `middleware.test.js` y `api.test.js` |
| 2 | Si un administrador perdía su rol, seguía viendo Eliminar y cada intento devolvía 403. | Los permisos se leían una sola vez al iniciar sesión (Watch: `usuario.permisos.eliminar = true`). | Ante un 403 el cliente vuelve a pedir el perfil y oculta las acciones. | `api.test.js` (cliente) |
| 3 | Si el token vencía mientras se llenaba el formulario, al volver a entrar se perdía lo escrito. | El 401 desmontaba el panel y el formulario no guardaba nada. | Borrador en `sessionStorage` asociado a la cuenta, devuelto una sola vez. | `api.test.js` (cliente) |

Las tres pruebas fallaron antes de la corrección (4 casos en rojo) y pasaron después.

Pasos para reproducir (datos de `npm run db:ejemplos`, DevTools abierto en Network):

1. Iniciar sesión como analista y registrar un incidente con el título "Correo que suplanta a soporte técnico", que ya existe. Esperado: el campo Título marcado. Obtenido: 409 con solo `error` y ningún campo marcado.
2. Iniciar sesión como administrador, cambiar su rol a `ANALISTA` en la base (`npm run db:ver`) y pulsar Eliminar en INC-004. Esperado: la vista se ajusta al rol nuevo. Obtenido: 403 y el botón sigue visible. En Sources, breakpoint en el `catch` de `eliminar` (App.jsx:118) y Watch `usuario.permisos.eliminar`.
3. Iniciar sesión como analista, llenar el formulario y reemplazar el token de `sessionStorage` por uno vencido (firmado con la misma clave, para no esperar 30 minutos). Enviar y volver a iniciar sesión. Esperado: recuperar lo escrito. Obtenido: 401 y el formulario vacío.

## Otros hallazgos

- ESLint: parámetro `next` sin usar, dependencia faltante en un `useEffect`, seis `import React` innecesarios, una variable de `catch` sin usar y una desestructuración para quitar `id` (se justificó `ignoreRestSiblings`). Resultado: 0 problemas en 52 archivos.
- Jest no cargaba `sanitize-html` porque `htmlparser2` solo se publica como ESM; se ejecuta con `--experimental-vm-modules`.
- `fetch` de Node crea objetos fuera del contexto de Jest: `assert.deepStrictEqual` fallaba por el prototipo; se usa `expect().toEqual()`.
- La prueba unitaria del servicio detectó que `actualizar` y `eliminar` lanzaban el error de forma síncrona; se declararon `async`.
- `loading="lazy"` no bastó: al montar el panel la lista aún está vacía y la imagen queda dentro de la distancia de precarga de Chrome. Se movió a una sección plegable.
- `npm audit` marcó `sprintf-js` (vía `argparse` 1 de `js-yaml` 3, usado solo por la cobertura). Se fijó `argparse` 2.0.1, que `js-yaml` 3 no usa como biblioteca. Resultado: 0 vulnerabilidades.

## Resultado

- Pruebas: 77 unitarias (cobertura de reglas: 95,5 % de sentencias), 30 de integración y 16 de 16 casos.
- Consulta: 8,96 ms y 13,8 ms con el índice (prioridad, estado). La lista sin filtros no cambió (13 ms): su costo es el conteo total.
- Red: 739 bytes para 10 incidentes y 1 726 bytes para 50 (br). Los datos de prueba repiten frases, por eso la compresión es tan alta.
- Imagen: 0 bytes al iniciar sesión; 32 KB (720 px) o 93 KB (1440 px) al abrir la guía.

## Límites

- Las mediciones son locales; en una red real el ahorro de bytes pesa más que en `127.0.0.1`.
- No hay pruebas automáticas de componentes React; la interfaz se verificó con DevTools.
- El borrador vive solo en la pestaña (`sessionStorage`) y se pierde al cerrarla.
