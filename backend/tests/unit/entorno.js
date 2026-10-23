// Las pruebas unitarias no necesitan .env ni PostgreSQL: se fijan valores de ejemplo antes de cargar la configuración.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'clave-de-pruebas-unitarias-con-mas-de-32-caracteres';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://usuario:clave@127.0.0.1:5432/sin_conexion';
