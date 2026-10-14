const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });
const { PrismaClient } = require('@prisma/client');
// Un cliente compartido; las credenciales permanecen en el backend.
module.exports = new PrismaClient();
