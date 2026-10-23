# Guion de defensa

Versión 1.0.0 · 23 de octubre de 2026 · video de máximo 20 minutos

## Recorrido

| Momento (tema) | Tiempo | Responsable | Qué se muestra |
| --- | --- | --- | --- |
| Problema, usuarios y alcance (16.1) | 2 min | Santiago Díaz | Diapositivas: necesidad, tres roles, qué hace y qué no hace la plataforma |
| Arquitectura y despliegue (16.1) | 4 min | Kevin Buitron | Diagrama, capas del backend, servicios de Render, variables por entorno y workflow |
| Demostración del CRUD con roles (16.2) | 5 min | Leonardo Guallichico | URL pública: analista registra, supervisor actualiza, analista sin permiso, admin elimina |
| Pruebas y operación (16.2) | 4 min | Kevin Cañizares | Actions, prueba de fuego, 21 casos de producción, logs, health check y métricas |
| Documentación (16.3) | 1 min | Santiago Díaz | Carpeta `docs/`: técnica, API, pruebas y manual de usuario |
| Límites, retroalimentación y lecciones (16.5) | 2 min | Kevin Buitron | Tabla de retroalimentación y las cuatro lecciones |
| Preguntas preparadas y cierre (16.4) | 2 min | Los cuatro | Respuestas de la sección siguiente |

Total: 20 minutos como máximo. Si el ensayo pasa de 19, se acorta la parte de arquitectura.

## Demostración (5 minutos)

1. Abrir el cliente y mostrar el candado de HTTPS.
2. Iniciar sesión como **analista**: lista con filtros y sin botón Eliminar.
3. Registrar un incidente con fecha futura: la API responde 400 y el formulario marca el campo. Corregir y guardar: 201.
4. Cerrar sesión e iniciar como **supervisor**: cambiar el estado a "En revisión".
5. Volver como analista y, en la consola de DevTools, enviar un `DELETE` con su propio token. La API responde 403 aunque la interfaz oculte el botón:

   ```js
   await fetch('https://incidentes-api-xqiw.onrender.com/api/incidentes/INC-001', { method: 'DELETE', headers: { Authorization: 'Bearer ' + sessionStorage.getItem('token') } }).then((r) => r.status)
   ```
6. Iniciar como **administrador** y eliminar el incidente de la demostración.
7. Mostrar en Render → Logs las líneas de cada paso, con usuario y rol y sin contraseñas.

## Antes de grabar

- Abrir `/api/salud` dos minutos antes para despertar la API y confirmar que `version` coincide con la etiqueta `v1.0.0`.
- Ejecutar `npm run produccion` y confirmar 21 de 21.
- Tener a mano las contraseñas de demostración sin mostrarlas en pantalla. No abrir `.env` ni `.env.produccion` mientras se graba.
- Cerrar pestañas y notificaciones; zoom del navegador al 125 %.

## Plan de contingencia

| Situación | Qué hacemos |
| --- | --- |
| La API está dormida y tarda en responder | Explicar el límite del plan gratuito y seguir con las diapositivas de arquitectura mientras despierta |
| `/api/salud` responde 503 | Explicar el diagnóstico (la API vive, la base no responde), revisar `incidentes-db` en Render y seguir la demostración en local con `npm run db:iniciar` y `npm run dev` |
| Falla un despliegue durante la grabación | Mostrar la ejecución en Actions, hacer Rollback en Render al despliegue anterior y explicar la corrección con `git revert` |
| Sin internet | Demostración local y capturas de `evidencias/Unidad 8` |

## Preguntas preparadas

**¿Cómo se protegen las rutas?** Cada ruta de incidentes pasa primero por `autenticar`, que verifica la firma y el vencimiento del JWT y vuelve a leer el rol y si la cuenta está activa. Después `permitir` compara el rol con `config/permisos.js`, y solo entonces se valida el cuerpo. Ocultar el botón en React es solo comodidad: la API responde 403 de todas formas.

**¿Qué pasa si falla la base?** Prisma lanza un error de conexión, el manejador lo convierte en 503 sin mostrar detalles, y `/api/salud` también responde 503. Render ve el health check fallido. Lo probamos deteniendo PostgreSQL en una prueba de integración.

**¿Cómo se revierte un despliegue?** Con `git revert` y push: el workflow prueba y despliega la corrección, como en la prueba de fuego. Si hay que volver atrás al instante, Render tiene Rollback a un despliegue anterior.

**¿Qué prueba da más confianza?** Las de integración contra PostgreSQL real, porque recorren rutas, permisos, validación y base juntas. Pero la verificación después del despliegue encontró un error que ninguna otra podía ver: la variable `CLIENT_ORIGIN` de Render.

**¿Por qué `TRUST_PROXY=3`?** Porque así lo mostró la cadena `X-Forwarded-For` en los logs: Cloudflare, el balanceador de Render y un proxy local. Con un número menor todos los usuarios comparten el límite de solicitudes; con uno mayor, un cliente podría inventar su IP.

**¿Qué falta para usarla con datos reales?** Respaldos, un plan sin suspensión, el token en una cookie `HttpOnly`, revocación de sesiones, pruebas automáticas de la interfaz y definir quién mantiene el servicio.
