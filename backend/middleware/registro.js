// Registro de cada solicitud con el usuario que la hizo. No se imprimen cuerpos,
// contraseñas ni tokens: solo método, ruta, código y el id y rol del usuario.
module.exports = function registro(req, res, next) {
  res.on('finish', () => {
    const quien = req.usuario ? ` usuario=${req.usuario.id} rol=${req.usuario.rol}` : '';
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode}${quien}`);
  });
  next();
};
