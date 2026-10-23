# Incidentes — Tarea 7

Requisitos: Node.js 22.12 o superior y Docker Desktop encendido.

Primera vez, desde esta carpeta:

```bash
npm install
npm run configurar
npm run db:iniciar
npm run db:generar
npm run db:migrar
npm run db:ejemplos
```

Backend (primera terminal):

```bash
npm run dev:api
```

Frontend (segunda terminal):
```bash
npm run dev:web
```

Abre http://127.0.0.1:5173. También puedes iniciar ambos con `npm run dev`.
Usuarios: admin, supervisor y analista `@incidentes.local`. Las claves están en `.env`.

Pruebas y lint:

```bash
npm test
npm run test:api
npm run lint
```

`npm test` corre las pruebas unitarias y `npm run test:api` las de integración (usa otra base, en el puerto 3308). Cobertura: `npm run test:coverage`. Casos de seguridad: `npm run casos`.

Mediciones: `npm run medir -- consulta antes` (también `red` o `imagen`, y `despues`).

Backend: routes → controllers → services → models.

Para volver a trabajar: `npm run db:iniciar` y `npm run dev`.
Para detener MySQL: `docker compose stop mysql`. El volumen conserva los datos.

Entrega: excluye `.env`, `frontend/.env`, `certificados`, `coverage`, `node_modules`, `.git`, `frontend/dist` y tareas anteriores.
