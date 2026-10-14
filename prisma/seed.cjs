const bcrypt = require('bcryptjs');
const prisma = require('../backend/config/prisma');
const ejemplos = require('../backend/models/ejemplos.json');
const { preparar } = require('../backend/models/incidentes');

// Cuentas de prueba: las contraseñas vienen de .env y solo se guarda su hash bcrypt (costo 12).
const cuentas = [
  { nombre: 'Administrador de prueba', correo: 'admin@incidentes.local', rol: 'ADMIN', variable: 'CLAVE_ADMIN' },
  { nombre: 'Supervisor de prueba', correo: 'supervisor@incidentes.local', rol: 'SUPERVISOR', variable: 'CLAVE_SUPERVISOR' },
  { nombre: 'Analista de prueba', correo: 'analista@incidentes.local', rol: 'ANALISTA', variable: 'CLAVE_ANALISTA' },
];

async function sembrar() {
  for (const { id, ...ejemplo } of ejemplos) {
    await prisma.incidente.upsert({
      where: { titulo: ejemplo.titulo }, update: {},
      create: preparar(ejemplo),
    });
  }
  console.log('Tres ejemplos disponibles. Los registros existentes no se modifican.');
  for (const { variable, ...cuenta } of cuentas) {
    const clave = process.env[variable];
    if (!clave || clave.length < 12) throw new Error(`Falta ${variable} en .env. Ejecuta npm run configurar.`);
    const passwordHash = await bcrypt.hash(clave, 12);
    // Las cuentas de prueba se sincronizan con .env: rol activo y contraseña actual.
    await prisma.usuario.upsert({
      where: { correo: cuenta.correo },
      update: { passwordHash, rol: cuenta.rol, activo: true },
      create: { ...cuenta, passwordHash },
    });
  }
  console.log('Usuarios de prueba listos: admin, supervisor y analista @incidentes.local. Las contraseñas están en .env.');
}
sembrar().catch((error) => {
  console.error(error.message.startsWith('Falta') ? error.message : 'No se pudieron cargar los ejemplos. Revisa la base y las migraciones.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
