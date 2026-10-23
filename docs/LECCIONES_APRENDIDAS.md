# Retroalimentación y lecciones aprendidas

Versión 1.0.0 · 23 de octubre de 2026

## Retroalimentación

Fuentes: la verificación automática de producción, la revisión de los logs de Render, la revisión de la URL pública entre los cuatro integrantes y la revisión del agente auditor ([`agents/revision-unidad-8.md`](../agents/revision-unidad-8.md)).

| Observación (fuente) | Tipo · impacto · urgencia · esfuerzo | Decisión y acción |
| --- | --- | --- |
| La API rechazaba al cliente con 403 en producción (verificación) | Defecto · alto · alta · bajo | Aplicada: `CLIENT_ORIGIN` con la URL del cliente; la API ahora ignora la `/` final |
| La API se conectaba a la base con la URL externa (logs) | Defecto · medio · media · bajo | Aplicada: `DATABASE_URL` con la Internal URL, para que el tráfico no salga de la red de Render |
| Todas las IP del log eran del balanceador de Render (logs) | Defecto · alto · alta · bajo | Aplicada: `TRUST_PROXY=3` y una prueba que fija ese valor. Con 1, todos compartían el límite de solicitudes |
| El cliente no tenía CSP ni `X-Frame-Options` (verificación) | Defecto · medio · alta · bajo | Aplicada: Headers del Static Site y el caso P04 los revisa en cada despliegue |
| El pie decía "Unidad 7" y el inicio de sesión mandaba a buscar las claves en `.env` (revisión entre integrantes) | Defecto · bajo · alta · bajo | Aplicada en el commit `1b37b5f` |
| La primera carga tarda unos 50 segundos (revisión entre integrantes) | Limitación · medio · alta para la defensa · bajo | Aplicar ahora: abrir `/api/salud` dos minutos antes de presentar. Un plan pago queda fuera del alcance |
| La base gratuita vence a los 30 días y no tiene respaldos (auditor) | Riesgo · alto · media · bajo | Planificar: respaldo con `pg_dump` antes del vencimiento |
| El token vive en `sessionStorage` (auditor) | Mejora · medio · baja · medio | Investigar: cookie `HttpOnly` con `SameSite=Strict`, que también exige protección CSRF |
| No hay pruebas automáticas de la interfaz en el navegador (auditor) | Mejora · medio · baja · medio | Planificar: automatizar con Playwright los recorridos del manual |
| El límite de solicitudes está en memoria (auditor) | Mejora · bajo · baja · medio | No aplicar: con una sola instancia funciona. Haría falta un almacén compartido si se escala |

## Retrospectiva

**Planificado y ocurrido.** Planeamos publicar la misma API de la Unidad 7 con MySQL, pero Render solo ofrece bases administradas de PostgreSQL. Con Prisma el cambio se redujo al proveedor, una migración nueva y el SQL directo de las pruebas (nombres entre comillas y la secuencia del id). También esperábamos que el primer despliegue saliera en verde y aparecieron seis problemas de configuración, todos detectados por Actions, por Render o por los logs.

**Qué funcionó.**
- Correr las mismas pruebas de integración en la computadora y en Actions, con una base PostgreSQL temporal.
- La verificación después de cada despliegue. Sin ella habríamos entregado un cliente que no podía hablar con la API.
- La prueba de fuego: el commit con el permiso equivocado nunca llegó a Render.

**Qué dificultó el trabajo.**
- Las diferencias entre entornos: Node 22 en Actions frente a Node 24 en la computadora, y un `pnpm-lock.yaml` olvidado de la Unidad 4 que hizo que Render instalara con pnpm.
- El plan gratuito: sin Pre-Deploy Command (las migraciones corren al iniciar), la instancia se duerme y la base vence.
- No saber cuántos proxies había delante de la API.

**Qué haríamos diferente.** Fijar la versión de Node y un solo gestor de paquetes desde el inicio, y desplegar una versión mínima en la primera semana para encontrar antes los problemas de configuración.

## Lecciones aprendidas

1. **Pasar las pruebas no garantiza que producción funcione.** El código estaba bien y el CORS falló por una variable de Render. Acción: cada variable nueva de producción entra con un caso en `scripts/produccion.cjs`.
2. **El entorno también se versiona.** Un archivo de pnpm olvidado y una versión distinta de Node rompieron dos despliegues. Acción: `.node-version` y un solo lockfile, y revisar con `git ls-files` que no haya lockfiles de otro gestor antes de publicar.
3. **Medir antes de configurar seguridad.** `TRUST_PROXY=1` parecía correcto y no lo era. Acción: comprobar en los logs los datos que vienen de cabeceras y dejar una prueba que fije el valor.
4. **Un error de permisos debe detener el despliegue.** Acción: cada permiso nuevo se agrega a la tabla de `seguridad.test.js` y con un caso 403 en las pruebas de integración.
