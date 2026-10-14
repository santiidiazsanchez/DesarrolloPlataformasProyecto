// Genera las versiones WebP de la guía de phishing a partir del PNG original.
// La imagen se muestra con un ancho máximo de 672 px: 720 px cubre pantallas normales y 1440 px pantallas de alta densidad.
const path = require('node:path');
const sharp = require('sharp');

const original = path.join(__dirname, '..', 'recursos', 'originales', 'guia-phishing.png');
const destino = path.join(__dirname, '..', 'frontend', 'public', 'recursos');

(async () => {
  for (const ancho of [720, 1440]) {
    const salida = path.join(destino, `guia-phishing-${ancho}.webp`);
    const { size, width, height } = await sharp(original).resize({ width: ancho }).webp({ quality: 80 }).toFile(salida);
    console.log(`${path.basename(salida)}: ${width}x${height}, ${(size / 1024).toFixed(1)} KB`);
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
