const express = require('express');
const controlador = require('../controllers/auth');
const { autenticar } = require('../middleware/autenticacion');
const { validarCuerpo } = require('../middleware/validar');
const { limiteLogin } = require('../middleware/limites');
const { esquemaLogin } = require('../validaciones/auth');
const router = express.Router();

router.post('/login', limiteLogin, validarCuerpo(esquemaLogin), controlador.login);
router.get('/perfil', autenticar, controlador.perfil);

module.exports = router;
