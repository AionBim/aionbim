/**
 * Troca, nas obras vindas dos portfólios, o "print" do slide pela imagem original do modelo ou render,
 * extraída dos PPTX (pasta PPTX_IMAGENS, com subpastas modelagens/, projetos/, asbuilt/ e topografia/).
 * Rode depois de `adicionar-portfolio.mjs`:
 *
 *   PPTX_IMAGENS=<pasta> node scripts/vitrine/imagens-pptx.mjs
 *
 * Cada imagem é achatada sobre branco (as PNG transparentes), tem a margem vazia recortada, recebe uma
 * moldura branca de 4% e é gravada em WebP com até 2000 px de largura. Pranchas com carimbo, fotos de
 * pessoas e obras de pessoa física não entram.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.PPTX_IMAGENS;
if (!BASE) throw new Error('Defina PPTX_IMAGENS com a pasta das imagens extraídas dos PPTX.');

const M = 'modelagens/';
const P = 'projetos/';
const A = 'asbuilt/';
const T = 'topografia/';
const OBRAS = {
  // civil
  'galeria-costa': [P + 's07_galeria-costa.png'],
  'posto-dor': [P + 's07_posto-dor.png'],
  'clinica-multimed': [P + 's07_clinica-multimed.png'],
  'comigo-jussara': [M + 's14_1.jpg'],
  'vivendas-do-atlantico': [M + 's15_1.png'],
  'maternidade-agusta-de-barros': [M + 's26_1.png'],
  'grupo-cesar': [P + 's16_1.jpg'],
  // modelagem
  tjma: [M + 's05_2.png', M + 's05_1.png', M + 's05_3.png'],
  'dub-11': [M + 's06_1.png'],
  'college-square': [M + 's07_1.png'],
  statestreet: [M + 's08_1.png'],
  'dec-maranhao': [M + 's09_1.png'],
  solidez: [M + 's11_2.jpg', M + 's11_1.jpg'],
  ipec: [M + 's12_2.png', M + 's12_1.png'],
  jorlan: [M + 's13_2.png', M + 's13_1.png'],
  'shalom-empreendimentos': [M + 's17_1.jpg'],
  'forum-aparecida': [M + 's18_1.png'],
  'sesc-guarapuava': [M + 's19_1.png'],
  'forum-anapolis': [M + 's20_1.png'],
  hupes: [M + 's21_1.png'],
  'hospital-univasf': [M + 's23_1.png'],
  furnas: [P + 's14_1.png'],
  'hospital-ufba': [P + 's17_1.png'],
  nuveen: [P + 's23_1.jpg'],
  'jardins-berlim': [P + 's21_1.png'],
  'quantitativos-interativos': [P + 's26_2.png', P + 's27_2.png'],
  // fiscalização
  'crea-parana': [M + 's16_1.png'],
  'ministerio-publico': [M + 's22_1.png'],
  // as-built
  'buriti-shopping': [P + 's20_1.png'],
  'edificacao-comercial-goiania': [P + 's22_1.png'],
  carrefour: [P + 's25_1.jpg'],
  'central-de-decorados-city': [A + 's09_1.png', A + 's09_2.jpg', A + 's10_1.png', A + 's10_3.png'],
  'strip-mall': [A + 's14_1.png'],
  'ginasio-rio-vermelho': [A + 's15_1.jpg', A + 's15_2.jpg'],
  'assembleia-de-deus': [A + 's21_1.png', A + 's22_1.png', A + 's22_3.png', A + 's22_2.jpg'],
  // topografia
  'complexo-serra-dourada': [A + 's06_1.png', A + 's07_1.png', A + 's07_3.png', A + 's07_2.png'],
  'rio-meia-ponte': [A + 's16_1.png', T + 's08_1.jpg'],
  'oho-hotel': [A + 's12_1.jpg', T + 's09_1.png', T + 's09_2.png'],
};

const raiz = 'assets/vitrine';
const arquivoJson = path.join(raiz, 'projetos.json');
const dados = JSON.parse(fs.readFileSync(arquivoJson, 'utf8'));

async function preparar(arquivo) {
  const base = sharp(arquivo, { limitInputPixels: false }).flatten({ background: '#ffffff' });
  const { data, info } = await base.clone().trim({ background: '#ffffff', threshold: 14 }).png().toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(info.width, info.height) * 0.04);
  return sharp(data)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#ffffff' })
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true });
}

let trocadas = 0;
for (const [id, arquivos] of Object.entries(OBRAS)) {
  const obra = dados.projetos.find((o) => o.id === id && o.fonte === 'portfolio');
  if (!obra) throw new Error(`obra ${id} não está na vitrine`);
  const destino = path.join(raiz, obra.disciplina, id);
  fs.rmSync(destino, { recursive: true, force: true });
  fs.mkdirSync(destino, { recursive: true });
  const imagens = [];
  for (let i = 0; i < arquivos.length; i++) {
    const entrada = path.join(BASE, arquivos[i]);
    if (!fs.existsSync(entrada)) throw new Error(`não achei ${entrada}`);
    const nome = String(i + 1).padStart(2, '0');
    const saida = path.join(destino, `${nome}.webp`);
    await (await preparar(entrada)).webp({ quality: 86, effort: 5 }).toFile(saida);
    const meta = await sharp(saida).metadata();
    imagens.push({ src: `${raiz}/${obra.disciplina}/${id}/${nome}.webp`, caption: arquivos.length > 1 ? `Imagem ${i + 1}` : 'Imagem', w: meta.width, h: meta.height });
  }
  await sharp(path.join(destino, '01.webp')).resize({ width: 900, height: 600, fit: 'contain', background: '#ffffff' }).webp({ quality: 84 }).toFile(path.join(destino, 'capa.webp'));
  obra.imagens = imagens;
  obra.capa = `${raiz}/${obra.disciplina}/${id}/capa.webp`;
  obra.origem = 'pptx';
  trocadas++;
}

fs.writeFileSync(arquivoJson, JSON.stringify(dados, null, 1) + '\n');
console.log(`obras com imagem original: ${trocadas}`);
