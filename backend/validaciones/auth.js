const { z } = require('zod');

// bcrypt solo considera los primeros 72 bytes; una contraseña más larga se rechaza.
const esquemaLogin = z.strictObject({
  correo: z.string({ error: 'Escribe tu correo.' }).trim().toLowerCase().max(120, 'Usa hasta 120 caracteres.')
    .pipe(z.email('Escribe un correo válido.')),
  password: z.string({ error: 'Escribe tu contraseña.' }).min(1, 'Escribe tu contraseña.')
    .refine((texto) => Buffer.byteLength(texto) <= 72, 'La contraseña es demasiado larga.'),
});

module.exports = { esquemaLogin };
