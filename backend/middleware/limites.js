const { rateLimit } = require('express-rate-limit');
const entorno = require('../config/entorno');

// Límite general por IP para toda la API.
const limiteGeneral = rateLimit({
  windowMs: 60 * 1000,
  limit: entorno.limitePorMinuto,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un minuto e intenta de nuevo.' },
});

// Contra fuerza bruta: 5 intentos fallidos cada 15 minutos. Los accesos correctos no cuentan.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.' },
});

module.exports = { limiteGeneral, limiteLogin };
