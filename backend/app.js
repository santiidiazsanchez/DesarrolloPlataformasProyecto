const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const entorno = require('./config/entorno');
const rutasSalud = require('./routes/salud');
const rutasAuth = require('./routes/auth');
const rutasIncidentes = require('./routes/incidentes');
const registro = require('./middleware/registro');
const errores = require('./middleware/errores');
const { limiteGeneral } = require('./middleware/limites');

const app = express();
// Detrás de un proxy HTTPS, Express toma la IP y el protocolo reales de X-Forwarded-*.
if (entorno.confiarEnProxy) app.set('trust proxy', entorno.confiarEnProxy);

app.use(registro);
// Encabezados seguros y sin X-Powered-By.
app.use(helmet());
// CORS solo para los orígenes de .env. Sin Origin (curl, pruebas) no aplica CORS;
// con un Origin desconocido la API responde 403 y el navegador bloquea la lectura.
app.use(cors({
  origin(origen, responder) {
    if (!origen || entorno.origenesPermitidos.includes(origen)) return responder(null, true);
    responder(Object.assign(new Error('Origen no permitido'), { status: 403, tipo: 'cors' }));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Location'],
  maxAge: 600,
}));
app.use('/api', limiteGeneral);
// gzip para respuestas de más de 1 KB (la lista). El inicio de sesión es más pequeño y no se comprime.
app.use(compression({ threshold: 1024 }));
// Las respuestas llevan datos de incidentes: el navegador no debe guardarlas en caché.
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use(express.json({ limit: '100kb' }));

app.use('/api/salud', rutasSalud);
app.use('/api/auth', rutasAuth);
app.use('/api/incidentes', rutasIncidentes);
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use(errores);

module.exports = app;
