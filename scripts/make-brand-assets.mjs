// Gera logo, favicon e og-image a partir da pasta LOGO (fonte local, fora do repositório).
import sharp from 'sharp';
import path from 'node:path';

const LOGO = process.env.AION_LOGO || '../LOGO';
const OUT = 'assets/brand';
const f = (n) => path.join(LOGO, n);

// Logo horizontal colorida (fundo branco): corta o excesso de margem.
const horiz = sharp(f('JPG 2.jpg')).trim({ background: '#ffffff', threshold: 12 });
await horiz.clone().resize({ height: 160 }).webp({ quality: 92 }).toFile(`${OUT}/logo-horizontal.webp`);
const horizBuf = await horiz.clone().png().toBuffer();

// Logo branca para fundo escuro (PNG transparente).
await sharp(f('LOGO MENOR 01.png')).trim().resize({ height: 160 }).png().toFile(`${OUT}/logo-branca.png`);

// Símbolo (A + infinito) para ícones.
const sym = sharp(f('Marcad\u2019\u00E1gua_LogotipoAION_3.png'.replace('\u2019', "'"))).trim();
const symBuf = await sym.clone().png().toBuffer();
await sharp(symBuf).resize({ height: 128 }).png().toFile(`${OUT}/simbolo.png`);
const resized32 = await sharp(symBuf).resize(28, 28, { fit: 'inside' }).toBuffer();
await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } } })
  .composite([{ input: resized32, gravity: 'center' }]).png().toFile('assets/favicon-32.png');
const resized180 = await sharp(symBuf).resize(130, 130, { fit: 'inside' }).toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#ffffff' } })
  .composite([{ input: resized180, gravity: 'center' }]).png().toFile('assets/apple-touch-icon.png');

// og-image 1200x630: logo horizontal centralizada sobre fundo claro.
const logoOg = await sharp(horizBuf).resize({ width: 820 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#F4F8FC' } })
  .composite([{ input: logoOg, gravity: 'center' }]).jpeg({ quality: 90 }).toFile('assets/og-image.jpg');
console.log('ok');
