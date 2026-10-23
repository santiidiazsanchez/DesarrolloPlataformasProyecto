// Única fuente de permisos: la usan las rutas y el perfil que recibe React.
// Menor privilegio: cada rol recibe solo las acciones que necesita.
const permisos = {
  consultar: ['ANALISTA', 'SUPERVISOR', 'ADMIN'],
  crear: ['ANALISTA', 'ADMIN'],
  actualizar: ['SUPERVISOR', 'ADMIN'],
  eliminar: ['ANALISTA', 'ADMIN'],
};

function permisosDe(rol) {
  return Object.fromEntries(Object.entries(permisos).map(([accion, roles]) => [accion, roles.includes(rol)]));
}

module.exports = { permisos, permisosDe };
