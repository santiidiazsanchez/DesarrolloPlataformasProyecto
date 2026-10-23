# Revisión de la Unidad 8

Revisión del 22 y 23 de octubre de 2026 con el agente auditor (Claude Code) aplicando `agente_auditor_claude.md`; las correcciones siguieron `agente_desarrollador_codex.md`. Las evidencias están en `evidencias/Unidad 8`.

## Línea base (final de la Unidad 7)

- MySQL 8.4 en Docker. Render no ofrece MySQL administrado.
- ESLint: 0 problemas. Pruebas: 77 unitarias, 30 de integración y 16 de 16 casos.
- `/api/salud` respondía `{"estado":"ok"}` sin consultar la base.
- El registro era una línea de texto (`fecha método ruta código`) sin nivel ni id de solicitud.
- La API escuchaba solo en 127.0.0.1 y no confiaba en ningún proxy.

## Cambios para producción

- PostgreSQL 17 con una sola migración inicial; Docker en los puertos 5433 (desarrollo) y 5434 (pruebas).
- `/api/salud` con `SELECT 1`, el commit en línea y 503 si la base falla.
- Logs JSON con nivel, duración, id de solicitud (`X-Request-Id`) y usuario; los 500 responden con ese id.
- `HOST`, `TRUST_PROXY`, `NODE_ENV` y `RENDER_GIT_COMMIT` leídos del entorno.
- Workflow de CI/CD con base temporal, Deploy Hooks y verificación de producción.

## Hallazgos

| # | Hallazgo y evidencia | Causa | Corrección y prueba |
| --- | --- | --- | --- |
| 1 | La primera ejecución de Actions falló en Jest (captura 01) | Actions usó Node 22, que no carga con `require()` el ESM de `htmlparser2` | `.node-version` con 24 para Actions y Render; ejecución #2 en verde |
| 2 | El primer despliegue del cliente falló con `ERR_PNPM_OUTDATED_LOCKFILE` (captura 05) | Un `pnpm-lock.yaml` de la Unidad 4 hizo que Render instalara con pnpm | Se eliminó; Render usa npm y `package-lock.json` |
| 3 | Todas las IP del log eran `10.x` (captura 07) | `TRUST_PROXY=1`; delante de la API hay Cloudflare, el balanceador y un proxy local | `TRUST_PROXY=3`, comprobado con `DEPURAR_IP=1`; prueba de integración con un `X-Forwarded-For` inventado |
| 4 | La verificación de producción dio 403 en P05 (captura 08) | `CLIENT_ORIGIN` sin la URL del cliente | Variable corregida en Render; la API ignora la `/` final; P05 en verde |
| 5 | El cliente no enviaba CSP ni `X-Frame-Options` | Faltaban los Headers del Static Site | Headers en Render (captura 10); P04 los revisa en cada despliegue |
| 6 | El cliente decía "Unidad 7" y mandaba a buscar las claves en `.env` | Textos de la unidad anterior | Corregidos en `1b37b5f` |
| 7 | En el log de Prisma, el host de la base terminaba en `.virginia-postgres.render.com` | La API usaba la External Database URL: funcionaba con SSL, pero el tráfico salía de la red privada de Render | `DATABASE_URL` cambiada a la Internal URL; el log muestra solo `dpg-…-a` y los 21 casos siguen en verde |

## Verificaciones

- **Prueba de fuego:** el commit `ef50c55` dio al analista el permiso de eliminar. Fallaron las unitarias y las de integración, el despliegue quedó omitido y Render no recibió el commit. El `git revert` (`d17f6a1`) se desplegó con 11 de 11.
- **Secretos:** solo se versionaron los `.env.example`. Ninguna de las 13 claves reales de `.env` y `.env.produccion`, ni los Deploy Hooks, aparece en `git log -p`.
- **CSP en el navegador:** el cliente carga sin errores en consola y llega a la API; un script en línea y una conexión a otro dominio quedan bloqueados.
- **Móvil:** a 375 px no hay desplazamiento horizontal en el inicio de sesión; el equipo revisó el panel a 400 px.
- **Persistencia:** INC-006 se creó y editó antes de reiniciar el servicio y después seguía "En revisión" (`persistencia-reinicio.txt`).
- **Producción:** 21 de 21 casos con las tres cuentas.

## Resultado

- Pruebas: 80 unitarias (95,4 % de sentencias en los archivos medidos), 32 de integración, 16 de 16 casos y 21 de 21 en producción.
- ESLint: 0 problemas.
- Despliegues por Deploy Hook: el primero (`a480885`) no pasó la verificación por el CORS y los siguientes dieron 11 de 11. El commit de la prueba de fuego no se desplegó.

## Límites

- El auditor no inició sesión en el navegador de producción; las capturas con sesión las tomó el equipo.
- No se hizo prueba de carga: el plan gratuito tiene una instancia que se duerme tras 15 minutos.
- La base gratuita vence a los 30 días y no tiene respaldos automáticos.
- En el plan gratuito, Metrics solo muestra el ancho de banda y los despliegues; CPU y memoria no se pudieron revisar.
