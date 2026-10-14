// Respuesta de validación sencilla: 400, mensaje general y un mensaje por campo.
function describirErrores(error) {
  // Un Map conserva el orden del formulario y el primer mensaje de cada campo.
  const campos = new Map();
  for (const problema of error.issues) {
    if (problema.code === 'unrecognized_keys') {
      for (const clave of problema.keys) campos.set(clave, 'Campo no permitido.');
    } else if (problema.path.length > 0 && !campos.has(String(problema.path[0]))) {
      campos.set(String(problema.path[0]), problema.message);
    }
  }
  // fromEntries crea propiedades propias, incluso si alguien envía una clave "__proto__".
  return Object.fromEntries(campos);
}

function validarCuerpo(esquema) {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req.body);
    if (!resultado.success) {
      const campos = describirErrores(resultado.error);
      const error = Object.keys(campos).length ? 'Revisa los datos enviados.' : 'Envía los datos en formato JSON.';
      return res.status(400).json({ error, campos });
    }
    // El controlador recibe únicamente los campos permitidos y ya limpios.
    req.body = resultado.data;
    next();
  };
}

module.exports = { validarCuerpo, describirErrores };
