// Traducciones entre lo que ve el cliente y lo que guarda MySQL, en un solo lugar.
const MAXIMO_ID = 2147483647; // INT de MySQL

/**
 * Convierte el id numérico de la base en el código que muestra la interfaz.
 * @param {number} id Id de MySQL.
 * @returns {string} Código con al menos tres dígitos, por ejemplo INC-004.
 */
function aCodigo(id) {
  return 'INC-' + String(id).padStart(3, '0');
}

/**
 * Convierte un código INC-004 en el id numérico. Solo acepta la forma exacta que genera aCodigo.
 * @param {string} codigo Código recibido en la ruta.
 * @returns {number|null} Id válido o null si el código no tiene el formato esperado.
 */
function desdeCodigo(codigo) {
  if (typeof codigo !== 'string' || !codigo.startsWith('INC-')) return null;
  const numero = Number(codigo.slice(4));
  const valido = Number.isSafeInteger(numero) && numero > 0 && numero <= MAXIMO_ID && codigo === aCodigo(numero);
  return valido ? numero : null;
}

// MySQL no admite espacios ni tildes en los valores del enum de Prisma: "En revisión" se guarda como En_revision.
const estadoABase = (estado) => (estado === 'En revisión' ? 'En_revision' : estado);
const estadoDesdeBase = (estado) => (estado === 'En_revision' ? 'En revisión' : estado);

module.exports = { aCodigo, desdeCodigo, estadoABase, estadoDesdeBase };
