const express = require('express');
const controlador = require('../controllers/incidentes');
const { autenticar, permitir } = require('../middleware/autenticacion');
const { validarCuerpo } = require('../middleware/validar');
const { esquemaIncidente } = require('../validaciones/incidentes');
const { permisos } = require('../config/permisos');
const router = express.Router();

// Todas las rutas exigen sesión. El permiso se revisa antes de validar el cuerpo:
// quien no puede hacer la acción recibe 403 sin conocer las reglas del formulario.
router.use(autenticar);
router.get('/', permitir(permisos.consultar), controlador.listar);
router.get('/:id', permitir(permisos.consultar), controlador.consultar);
router.post('/', permitir(permisos.crear), validarCuerpo(esquemaIncidente), controlador.crear);
router.put('/:id', permitir(permisos.actualizar), validarCuerpo(esquemaIncidente), controlador.actualizar);
router.delete('/:id', permitir(permisos.eliminar), controlador.eliminar);

module.exports = router;
