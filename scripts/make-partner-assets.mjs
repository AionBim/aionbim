// Converte os logos de parceiros (PNG com fundo transparente) para WebP em assets/parceiros/.
// Uso: node scripts/make-partner-assets.mjs <pasta-com-os-PNGs>
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const src = process.argv[2];
if (!src) throw new Error('Informe a pasta com os PNGs dos logos.');
const out = 'assets/parceiros';
fs.mkdirSync(out, { recursive: true });

for (const file of fs.readdirSync(src).filter((f) => f.endsWith('.png'))) {
  const slug = path.basename(file, '.png');
  await sharp(path.join(src, file))
    .trim()
    .resize({ width: 320, height: 140, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(out, `${slug}.webp`));
}
console.log('logos convertidos:', fs.readdirSync(out).length);
