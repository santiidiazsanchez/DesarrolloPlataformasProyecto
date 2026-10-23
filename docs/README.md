# Documentación técnica

Plataforma de incidentes de ciberseguridad · versión 1.0.0 · 23 de octubre de 2026

Grupo: Santiago Díaz, Kevin Buitron, Leonardo Guallichico y Kevin Cañizares.

## Propósito

La plataforma sirve para registrar incidentes de ciberseguridad, clasificarlos por tipo y prioridad y dar seguimiento a su estado. Hay tres roles: el analista registra, el supervisor actualiza el seguimiento y el administrador además puede eliminar. Es un prototipo académico y solo tiene datos de demostración.

| Recurso | Dirección |
| --- | --- |
| Cliente | https://incidentes-web-0eqn.onrender.com |
| API | https://incidentes-api-xqiw.onrender.com/api |
| Health check | https://incidentes-api-xqiw.onrender.com/api/salud |
| Repositorio | https://github.com/santiidiazsanchez/DesarrolloPlataformasProyecto |

Las contraseñas de las cuentas de demostración van en el informe de entrega, no en el repositorio.

Otros documentos: [ARQUITECTURA.md](ARQUITECTURA.md), [API.md](API.md), [PRUEBAS.md](PRUEBAS.md), [MANUAL_USUARIO.md](MANUAL_USUARIO.md), [LECCIONES_APRENDIDAS.md](LECCIONES_APRENDIDAS.md) y [DEFENSA.md](DEFENSA.md).

## Requisitos

- Node.js 24.9 o superior. GitHub Actions y Render leen la misma versión de `.node-version`.
- Docker Desktop, solo para PostgreSQL en la computadora.
- Para publicar: cuentas de GitHub y Render.

## Instalación local

```bash
npm install
npm run configurar
npm run db:iniciar
npm run db:generar
npm run db:migrar
npm run db:ejemplos
npm run dev
```

`npm run configurar` crea `.env` y `frontend/.env` con contraseñas y una clave JWT aleatorias. `db:iniciar` levanta PostgreSQL 17 en Docker (puerto 5433, solo en 127.0.0.1). `db:ejemplos` crea las tres cuentas y tres incidentes de ejemplo sin tocar los que ya existen. El cliente queda en http://127.0.0.1:5173 y la API en http://127.0.0.1:3001/api.

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `backend/` | API de Express: rutas, middleware, controladores, servicios, modelos y validaciones |
| `frontend/` | Cliente React con Vite y Tailwind |
| `prisma/` | Esquema, migración de PostgreSQL y carga de ejemplos |
| `scripts/` | Configuración, pruebas, casos de seguridad, mediciones y verificación de producción |
| `.github/workflows/` | Workflow de CI/CD |
| `evidencias/` | Capturas y resultados de cada unidad |
| `agents/` | Instrucciones y revisiones de los agentes |

## Variables por entorno

| Variable | Local (`.env`) | Producción (Render) |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL de Docker, puerto 5433 | Internal Database URL de `incidentes-db` |
| `JWT_SECRET` | Aleatoria, creada por `configurar` | Otra distinta, solo para producción |
| `CLIENT_ORIGIN` | `http://127.0.0.1:5173,http://127.0.0.1:4173` | `https://incidentes-web-0eqn.onrender.com` |
| `HOST` | `127.0.0.1` (por defecto) | `0.0.0.0` |
| `PORT` | `3001` | La define Render |
| `TRUST_PROXY` | `0` (por defecto) | `3` |
| `NODE_ENV` | `development` | `production` |
| `JWT_EXPIRES_IN` | `30m` | `30m` (por defecto) |
| `CLAVE_ADMIN`, `CLAVE_SUPERVISOR`, `CLAVE_ANALISTA` | Locales | Solo en `.env.produccion`, para sembrar la base |
| `VITE_API_URL` (cliente) | `http://127.0.0.1:3001/api` | `https://incidentes-api-xqiw.onrender.com/api` |

- La API no arranca si falta `DATABASE_URL`, `JWT_SECRET` o `CLIENT_ORIGIN`, o si la clave JWT tiene menos de 32 caracteres.
- `VITE_API_URL` se fija al compilar el cliente, por eso va en el Static Site y no en la API.
- `.env` y `.env.produccion` están en `.gitignore`. `.env.produccion` solo existe en la computadora de quien despliega y guarda la External URL de la base, las URL públicas y las contraseñas de demostración.
- Los Deploy Hooks de Render están solo en GitHub Secrets.

## Comandos

| Comando | Para qué |
| --- | --- |
| `npm run dev` | API y cliente en local |
| `npm test` | 80 pruebas unitarias (backend y cliente) |
| `npm run test:api` | 32 pruebas de integración con PostgreSQL de pruebas (puerto 5434) |
| `npm run lint` | ESLint |
| `npm run casos` | 16 casos de seguridad de la Unidad 6 |
| `npm run produccion` | 21 casos contra la URL pública |
| `npm run db:produccion` | Migra y siembra la base de Render desde la computadora |

## Despliegue en Render

Los tres servicios están en la región Virginia (US East), en el plan gratuito.

### 1. Base de datos

New → Postgres, nombre `incidentes-db`, PostgreSQL 17. De la página de la base se copian dos URL:

- **Internal Database URL**: para la API. Solo funciona dentro de la red de Render.
- **External Database URL**: para migrar y sembrar desde la computadora. Se guarda en `.env.produccion` con `?sslmode=require` al final.

### 2. API (Web Service `incidentes-api`)

| Campo | Valor |
| --- | --- |
| Repositorio y rama | `DesarrolloPlataformasProyecto`, `main` |
| Root Directory | Vacío (raíz del repositorio) |
| Build Command | `npm ci --include=dev && npm run db:generar` |
| Start Command | `npm run db:migrar && npm start` |
| Health Check Path | `/api/salud` |
| Auto-Deploy | Off |
| Variables | `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `HOST`, `TRUST_PROXY`, `NODE_ENV` |

- `--include=dev`: con `NODE_ENV=production`, npm omite las devDependencies y ahí está el CLI de Prisma.
- La migración corre al iniciar porque el Pre-Deploy Command es de planes pagos. `migrate deploy` solo aplica las migraciones pendientes; si no hay, el log dice `No pending migrations to apply`.

### 3. Cuentas de demostración

Se siembran una sola vez desde la computadora, con la External URL de `.env.produccion`:

```bash
npm run db:produccion
```

Crea las tres cuentas (solo con su hash bcrypt) y tres incidentes de ejemplo.

### 4. Cliente (Static Site `incidentes-web`)

| Campo | Valor |
| --- | --- |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `frontend/dist` |
| Variable | `VITE_API_URL=https://incidentes-api-xqiw.onrender.com/api` |
| Auto-Deploy | Off |

En Headers, con la ruta `/*`:

| Encabezado | Valor |
| --- | --- |
| `Content-Security-Policy` | `default-src 'self'; connect-src 'self' https://incidentes-api-xqiw.onrender.com; img-src 'self' data:; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `no-referrer` |

Render ya agrega HSTS y `X-Content-Type-Options: nosniff`. Al final se copia la URL del sitio en `CLIENT_ORIGIN` de la API, sin `/` al final.

### 5. CI/CD con GitHub Actions

El workflow [`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml) corre en cada push y pull request a `main`:

1. **Lint, pruebas unitarias y build.**
2. **Pruebas de integración con PostgreSQL.** Usa una base PostgreSQL 17 temporal del propio workflow, que se borra al terminar. La clave JWT y las contraseñas se generan en cada ejecución y quedan ocultas en el log.
3. **Desplegar en Render.** Solo en un push a `main` y si los dos trabajos anteriores pasaron. Llama a los Deploy Hooks de la API y del cliente.
4. **Verificar producción.** Espera hasta que `/api/salud` muestre el commit nuevo, corre los 11 casos públicos de `scripts/produccion.cjs` y deja la tabla en el Summary de la ejecución.

En GitHub → Settings → Secrets and variables → Actions:

| Tipo | Nombre |
| --- | --- |
| Secret | `RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_WEB` |
| Variable | `API_URL`, `WEB_URL` |

Auto-Deploy está en Off en los dos servicios. Si estuviera activo, Render desplegaría cada push aunque las pruebas fallen; así, solo Actions ordena el despliegue.

## Operación

### Health check

`GET /api/salud` ejecuta `SELECT 1` en PostgreSQL:

```json
{"estado":"ok","baseDeDatos":"conectada","version":"d17f6a1","entorno":"production"}
```

`version` es el commit en línea (Render lo entrega en `RENDER_GIT_COMMIT`). Si la base no responde, devuelve 503 con `"baseDeDatos":"sin conexión"`. Render usa esta ruta para dar por bueno un despliegue y para reiniciar la instancia si deja de responder.

### Logs

La API escribe una línea JSON por solicitud, que se ve en Render → Logs:

```json
{"fecha":"2026-10-23T16:10:02.114Z","nivel":"INFO","id":"6f1c…","ip":"203.0.113.7","metodo":"PUT","ruta":"/api/incidentes/INC-004","estado":200,"ms":41.3,"usuario":2,"rol":"SUPERVISOR"}
```

- El nivel es `ERROR` para 5xx, `WARN` para 4xx e `INFO` para el resto.
- No se escriben cuerpos, contraseñas ni tokens.
- Los health checks correctos de Render no se registran; los que fallan sí.
- El `id` también va en la cabecera `X-Request-Id`. Un error 500 responde con ese id y en el log queda solo el tipo de error.
- La IP es la del cliente gracias a `TRUST_PROXY=3`. Con `DEPURAR_IP=1` el log agrega la cadena `X-Forwarded-For`; así comprobamos que delante de la API hay tres proxies (Cloudflare, el balanceador de Render y un proxy local).

### Monitoreo

| Dónde | Qué se revisa |
| --- | --- |
| Render → Logs | Cada solicitud y los errores |
| Render → Events | Despliegues (Deploy Hook), reinicios y fallos |
| Render → Metrics | Ancho de banda de salida y línea de tiempo de despliegues. CPU y memoria solo se ven en planes pagos |
| GitHub → Actions | Resultado de cada push y la verificación de producción |

### Reiniciar y revertir

- **Reiniciar:** Render → Manual Deploy → Restart service. Los datos siguen en PostgreSQL.
- **Revertir un cambio:** `git revert` del commit y `git push`; el workflow prueba y despliega la corrección.
- **Volver atrás de inmediato:** Render → Deploys → Rollback en un despliegue anterior. No espera a las pruebas; después hay que corregir en `main`.

### Límites del plan gratuito

- La API se duerme tras 15 minutos sin tráfico; la primera solicitud puede tardar unos 50 segundos.
- La base gratuita vence 30 días después de crearse y no tiene respaldos. Antes de esa fecha se puede guardar una copia con la External URL:

```bash
docker run --rm postgres:17 pg_dump "<External Database URL>" > respaldo.sql
```

- Hay una sola instancia y el límite de solicitudes guarda los contadores en memoria: se reinician con cada despliegue.

## Solución de problemas

| Síntoma | Causa y solución |
| --- | --- |
| Actions falla en Jest con `require()` de un módulo ESM | Node 22 no carga `htmlparser2`. Usar Node 24 (`.node-version`) |
| Render falla con `ERR_PNPM_OUTDATED_LOCKFILE` | Había un `pnpm-lock.yaml` viejo y Render instaló con pnpm. Se eliminó; el proyecto usa npm |
| El navegador recibe 403 al llamar a la API | `CLIENT_ORIGIN` no coincide con la URL del cliente |
| Todas las IP del log son `10.x` | `TRUST_PROXY` en 1. En Render va en 3 |
| `/api/salud` responde 503 | La base no responde o venció. Revisar `incidentes-db` en Render |
| La primera carga tarda casi un minuto | La instancia gratuita estaba dormida |
| El sitio carga pero no inicia sesión | Revisar en la consola (F12) si la CSP bloqueó la URL de la API |
