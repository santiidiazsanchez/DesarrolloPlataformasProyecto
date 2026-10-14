// Error de una regla del negocio con su código HTTP. El manejador central lo convierte en respuesta JSON.
class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
    this.esperado = true;
  }
}

module.exports = { ErrorHttp };
