# Auditoría de la Unidad 4

Revisión del 22 de septiembre de 2026 con el agente auditor disponible, aplicando `agente_auditor_claude.md`. No se ejecutó el modelo Claude. Alcance: código de React/Express, dependencias y solicitudes HTTP aisladas; no es una certificación de seguridad ni una revisión visual WCAG completa.

## Resultado

- `npm audit --json`: 0 vulnerabilidades conocidas en las dependencias instaladas.
- `npm test`, después de las correcciones: 7 pruebas aprobadas, 0 fallos.
- No se identificaron vulnerabilidades críticas demostradas en las comprobaciones realizadas.
- Se usaron instancias del backend en puertos efímeros. No se modificaron los registros de la instancia del usuario y se cerraron los servidores de prueba.

## Hallazgos corregidos

| Severidad | Hallazgo reproducido | Corrección y comprobación |
| --- | --- | --- |
| Baja, funcional | Charset no admitido, compresión desconocida, gzip inválido y URL mal codificada terminaban en 500. | `backend/middleware/errores.js` conserva 400/415 con mensajes fijos. Nuevas pruebas verifican códigos, mensajes y ausencia de cambios en el modelo. |
| Baja, validación | El correo admitía un tabulador dentro del texto. | `backend/controllers/incidentes.js` rechaza espacios, tabuladores, CR y LF. Pruebas con las cuatro variantes devuelven 400. No se demostró inyección de cabeceras porque el prototipo no envía correos. |

El auditor volvió a revisar ambos cambios y confirmó el cierre de los hallazgos.

## CORS y proxy

No hay una configuración explícita de CORS en Express. El frontend llama a `/api/incidentes` desde su propio origen y Vite reenvía la solicitud a `127.0.0.1:3001`. La arquitectura actual no necesita habilitar llamadas directas entre orígenes.

Se probaron GET y preflight OPTIONS con Origin local y desconocido. Express no devolvió `Access-Control-Allow-Origin`. OPTIONS devolvió 200 y `Allow`, lo que informa métodos, pero no autoriza CORS. Un navegador no puede leer la API desde otro origen ni completar esos preflight de POST JSON, PUT o DELETE. Las solicitudes simples pueden llegar al servidor: los POST con text/plain o formulario devolvieron 400 sin crear registros.

CORS no sustituye autenticación ni impide llamadas con curl. Si se cambia Fetch a una URL de otro origen, habrá que definir los orígenes permitidos y probarlos. No se agregó `Access-Control-Allow-Origin: *`.

## Otras verificaciones

- CRUD correcto; JSON mal formado 400; cuerpos de más de 100 KB 413; ids inexistentes 404; errores internos sin trazas en el cliente.
- Campos ajenos como `id` y `__proto__` ignorados; no se observó contaminación del prototipo.
- React renderiza los datos como texto; no se encontró innerHTML, dangerouslySetInnerHTML ni eval.
- La evidencia es un nombre de archivo, no una ruta que el servidor lea.
- El servidor escucha únicamente en `127.0.0.1`.

Autenticación, autorización, HTTPS, límites de frecuencia y almacenamiento permanente requerirían otra revisión antes de publicar el proyecto. Ocultar X-Powered-By es una mejora opcional; no se demostró una vulnerabilidad por esa cabecera en esta práctica.

Referencias: [CORS en MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [proxy de Vite](https://vite.dev/config/server-options.html#server-proxy), [errores del parser de Express](https://expressjs.com/en/resources/middleware/body-parser/#errors).
