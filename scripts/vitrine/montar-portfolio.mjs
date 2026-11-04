/**
 * Monta, na vitrine, as obras dos portfólios da AION (cliente pessoa jurídica citado pelo nome), a partir das
 * imagens originais extraídas dos PPTX. Uma mesma obra aparece em cada disciplina em que a AION atuou, com
 * o texto e a imagem daquela disciplina quando existem. Pessoa física, carimbos com nomes e fotos de pessoas
 * ficam de fora. Re-executável: apaga o que tem `fonte: "portfolio"` e gera de novo.
 *
 *   PPTX_IMAGENS=<pasta> node scripts/vitrine/montar-portfolio.mjs
 *
 * PPTX_IMAGENS tem as subpastas modelagens/, projetos/, projetos2/, asbuilt/ e topografia/.
 * Cada imagem é achatada sobre branco (as PNG transparentes), tem a margem vazia recortada, recebe uma moldura
 * branca de 4% e é gravada em WebP com até 2000 px de largura.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.PPTX_IMAGENS;
if (!BASE) throw new Error('Defina PPTX_IMAGENS com a pasta das imagens extraídas dos PPTX.');

const DISCIPLINAS_NOVAS = [
  { id: 'arquitetura', nome: 'Arquitetura', icone: 'ph-house-line' },
  { id: 'infra', nome: 'Infraestrutura e terraplenagem', icone: 'ph-road-horizon' },
  { id: 'compatibilizacao', nome: 'Compatibilização, coordenação e fiscalização BIM', icone: 'ph-checks' },
  { id: 'quantitativos', nome: 'Quantitativos e planejamento de obra', icone: 'ph-list-numbers' },
];
const ORDEM = ['arquitetura', 'estrutural', 'hidrossanitario', 'eletrico', 'incendio', 'infra', 'compatibilizacao', 'quantitativos', 'asbuilt', 'topografia'];

const M = 'modelagens/';
const P = 'projetos/';
const Q = 'projetos2/';
const A = 'asbuilt/';
const T = 'topografia/';

const ARQ = 'Modelagem BIM de arquitetura';
const ESTR = 'Modelagem BIM da estrutura';
const PLAN = 'para planejamento e logística de obra';

// [disciplina, id, nome, local, resumo, imagens]
const CARDS = [
  // ---------------- Arquitetura
  ['arquitetura', 'galeria-costa', 'Galeria Costa', 'Rio Verde/GO', 'Projeto de arquitetura e modelagem BIM de galeria comercial.', [P + 's07_galeria-costa.png']],
  ['arquitetura', 'posto-dor', 'Posto D’or', 'Senador Canedo/GO', 'Projeto de arquitetura de posto de combustíveis.', [P + 's07_posto-dor.png']],
  ['arquitetura', 'clinica-multimed', 'Clínica Multimed', 'Goiânia/GO', 'Arquitetura com alto nível de detalhamento para execução de reforma, com extração de quantitativos e compatibilização com estrutura e projetos complementares.', [P + 's07_clinica-multimed.png']],
  ['arquitetura', 'comigo-jussara', 'COMIGO Jussara', 'Goiânia/GO', 'Projeto e modelagem BIM de arquitetura.', [M + 's14_1.jpg']],
  ['arquitetura', 'vivendas-do-atlantico', 'Vivendas do Atlântico', 'Goiânia/GO', 'Projeto e modelagem BIM de arquitetura.', [M + 's15_1.png']],
  ['arquitetura', 'maternidade-agusta-de-barros', 'Maternidade Agusta de Barros', 'Rio Verde/GO', 'Projeto e modelagem BIM de arquitetura.', [M + 's26_1.png']],
  ['arquitetura', 'tjma', 'TJMA', 'Imperatriz/MA', `${ARQ} e do entorno, parte do modelo multidisciplinar do edifício.`, [M + 's05_1.png']],
  ['arquitetura', 'dub-11', 'DUB 11', 'Dublin, Irlanda', `${ARQ}, implantação, paisagismo e entorno, ${PLAN}.`, [M + 's06_1.png']],
  ['arquitetura', 'college-square', 'College Square', 'Dublin, Irlanda', `${ARQ}, implantação e entorno, para planejamento, logística e acompanhamento de obra.`, [M + 's07_1.png']],
  ['arquitetura', 'statestreet', 'Statestreet', 'Kilkenny, Irlanda', `${ARQ}, implantação e entorno, ${PLAN}.`, [M + 's08_1.png']],
  ['arquitetura', 'solidez', 'Solidez', 'Goiânia/GO', `${ARQ} a partir de nuvem de pontos fornecida pela Arismar Topografia.`, [M + 's11_2.jpg', M + 's11_1.jpg']],
  ['arquitetura', 'jorlan', 'Jorlan', 'Goiânia/GO', 'Modelagem arquitetônica BIM para documentação.', [M + 's13_2.png', M + 's13_1.png']],
  ['arquitetura', 'shalom-empreendimentos', 'Shalom Empreendimentos', 'Goiânia/GO', 'Modelagem BIM da arquitetura e da topografia.', [M + 's17_1.jpg']],
  ['arquitetura', 'ipec', 'IPEC', 'Pirenópolis/GO', 'Modelagem BIM das edificações de uma área de fazenda.', [M + 's12_2.png']],
  ['arquitetura', 'dec-maranhao', 'DEC Maranhão', 'Anápolis/GO', 'Consultoria e implementação BIM para a disciplina de interiores: criação de famílias, templates e bibliotecas BIM.', [M + 's09_1.png']],
  ['arquitetura', 'forum-aparecida', 'Fórum de Justiça de Aparecida', 'Aparecida de Goiânia/GO', `${ARQ}, interiores, implantação e entorno, para reforma.`, [M + 's18_1.png']],
  ['arquitetura', 'sesc-guarapuava', 'SESC Guarapuava', 'Paraná', `${ARQ} para projeto de retrofit e projetos complementares.`, [M + 's19_1.png']],
  ['arquitetura', 'forum-anapolis', 'Fórum de Justiça de Anápolis', 'Anápolis/GO', 'Modelagem BIM do fórum.', [M + 's20_1.png']],
  ['arquitetura', 'hupes', 'HUPES', 'Salvador/BA', `${ARQ}, interiores, implantação e entorno, para reforma.`, [M + 's21_1.png']],
  ['arquitetura', 'hospital-univasf', 'Hospital UNIVASF', 'Petrolina e Juazeiro', `${ARQ}, interiores, implantação e entorno, para reforma.`, [M + 's23_1.png']],
  ['arquitetura', 'hospital-ufba', 'Hospital Universitário UFBA', 'Salvador/BA', 'Levantamento e modelagem BIM de arquitetura e terreno.', [P + 's17_1.png']],
  ['arquitetura', 'assembleia-de-deus', 'Assembleia de Deus', 'Goiânia/GO', 'Modelagem e documentação BIM de arquitetura da edificação.', [A + 's21_1.png', A + 's22_1.png', A + 's22_3.png', A + 's22_2.jpg']],
  ['arquitetura', 'grupo-cesar', 'Grupo Cesar', 'Aparecida de Goiânia/GO', 'Modelagem e projeto de readequação de arquitetura.', [P + 's16_1.jpg']],

  // ---------------- Estrutural
  ['estrutural', 'tjma', 'TJMA', 'Imperatriz/MA', `${ESTR} do edifício, em modelo coordenado com as demais disciplinas.`, [M + 's05_2.png']],
  ['estrutural', 'galeria-costa', 'Galeria Costa', 'Rio Verde/GO', 'Projeto estrutural e de fundações de galeria comercial.', [Q + 's09_galeria-costa']],
  ['estrutural', 'galpoes-cerejeiras', 'Galpões Cerejeiras', 'Anápolis/GO', 'Projeto estrutural de galpões.', [Q + 's09_galpoes-cerejeiras']],
  ['estrutural', 'dub-11', 'DUB 11', 'Dublin, Irlanda', `${ESTR}, ${PLAN}.`, [M + 's06_1.png']],
  ['estrutural', 'college-square', 'College Square', 'Dublin, Irlanda', `${ESTR}, para planejamento, logística e acompanhamento de obra.`, [M + 's07_1.png']],
  ['estrutural', 'statestreet', 'Statestreet', 'Kilkenny, Irlanda', `${ESTR}, ${PLAN}.`, [M + 's08_1.png']],
  ['estrutural', 'jardins-berlim', 'Jardins Berlim', 'Senador Canedo/GO', 'Modelagem BIM da estrutura e das fundações das casas do empreendimento.', [P + 's21_1.png']],

  // ---------------- Hidrossanitário
  ['hidrossanitario', 'tjma', 'TJMA', 'Imperatriz/MA', 'Modelagem BIM das instalações hidrossanitárias, no modelo MEP do edifício.', [M + 's05_3.png']],
  ['hidrossanitario', 'escola-rettie-tipple', 'Escola Rettie Tipple', 'Anápolis/GO', 'Projeto hidrossanitário de escola.', [Q + 's10_escola-rettie-tipple']],
  ['hidrossanitario', 'parque-eldorado', 'Parque Eldorado', 'Goiânia/GO', 'Projeto hidrossanitário de empreendimento residencial.', [Q + 's10_parque-eldorado']],
  ['hidrossanitario', 'galpoes-cerejeiras', 'Galpões Cerejeiras', 'Anápolis/GO', 'Projeto hidrossanitário de galpões.', [Q + 's10_galpoes-cerejeiras']],

  // ---------------- Elétrico
  ['eletrico', 'tjma', 'TJMA', 'Imperatriz/MA', 'Modelagem BIM do sistema elétrico, da proteção contra descargas atmosféricas e do cabeamento estruturado, no modelo MEP do edifício.', [M + 's05_3.png']],
  ['eletrico', 'galpao-costa', 'Galpão Costa', 'Goiânia/GO', 'Projeto elétrico de galpão.', [Q + 's11_galpao-costa']],
  ['eletrico', 'escola-rettie-tipple', 'Escola Rettie Tipple', 'Anápolis/GO', 'Projeto elétrico de escola.', [Q + 's11_escola-rettie-tipple']],
  ['eletrico', 'consultorio', 'Consultório', 'Goiânia/GO', 'Projeto elétrico de consultório.', [Q + 's11_consultorio']],
  ['eletrico', 'galpoes-cerejeiras', 'Galpões Cerejeiras', 'Anápolis/GO', 'Projeto elétrico de galpões.', [Q + 's11_galpoes-cerejeiras']],

  // ---------------- Incêndio
  ['incendio', 'tjma', 'TJMA', 'Imperatriz/MA', 'Modelagem BIM da prevenção e do combate a incêndio, no modelo MEP do edifício.', [M + 's05_3.png']],
  ['incendio', 'galeria-plaza', 'Galeria Plaza', 'Goiânia/GO', 'Projeto de combate a incêndio.', [Q + 's12_galeria-plaza']],
  ['incendio', 'grupo-cesar', 'Grupo Cesar', 'Aparecida de Goiânia/GO', 'Projeto de combate a incêndio, dentro do projeto de readequação.', [Q + 's12_grupo-cesar']],
  ['incendio', 'parque-eldorado', 'Parque Eldorado', 'Goiânia/GO', 'Projeto de combate a incêndio de empreendimento residencial.', [Q + 's12_parque-eldorado']],
  ['incendio', 'galpoes-cerejeiras', 'Galpões Cerejeiras', 'Anápolis/GO', 'Projeto de combate a incêndio de galpões.', [Q + 's12_galpoes-cerejeiras']],

  // ---------------- Infraestrutura e terraplenagem
  ['infra', 'dub-11', 'DUB 11', 'Dublin, Irlanda', 'Modelagem BIM da infraestrutura de água, esgoto e drenagem.', [M + 's06_1.png']],
  ['infra', 'jardins-berlim', 'Jardins Berlim', 'Senador Canedo/GO', 'Modelagem de drenagem de arrimo e servidão, compatibilização das instalações prediais e da infraestrutura, e locação das casas.', [P + 's21_1.png']],
  ['infra', 'posto-dor', 'Posto D’or', 'Senador Canedo/GO', 'Projeto de terraplenagem de posto de combustíveis.', [Q + 's08_posto-dor']],
  ['infra', 'comigo', 'COMIGO', 'Rio Verde/GO', 'Projeto de terraplenagem.', [Q + 's08_comigo']],
  ['infra', 'loteamento-rc', 'Loteamento RC', 'Pirenópolis/GO', 'Projeto de terraplenagem de loteamento.', [Q + 's08_loteamento-rc']],
  ['infra', 'furnas', 'FURNAS', 'Espírito Santo', 'Modelagem BIM da barragem, do terreno e das edificações.', [P + 's14_1.png']],

  // ---------------- Compatibilização, coordenação e fiscalização BIM
  ['compatibilizacao', 'comigo-jussara', 'COMIGO Jussara', 'Goiânia/GO', 'Compatibilização BIM da arquitetura, do hidrossanitário e da estrutura.', [M + 's14_1.jpg']],
  ['compatibilizacao', 'vivendas-do-atlantico', 'Vivendas do Atlântico', 'Goiânia/GO', 'Compatibilização BIM da arquitetura, do hidrossanitário e da estrutura.', [M + 's15_1.png']],
  ['compatibilizacao', 'maternidade-agusta-de-barros', 'Maternidade Agusta de Barros', 'Rio Verde/GO', 'Compatibilização BIM da arquitetura, do hidrossanitário e da estrutura.', [M + 's26_1.png']],
  ['compatibilizacao', 'galeria-costa', 'Galeria Costa', 'Rio Verde/GO', 'Compatibilização BIM entre as disciplinas do projeto.', [P + 's07_galeria-costa.png']],
  ['compatibilizacao', 'clinica-multimed', 'Clínica Multimed', 'Goiânia/GO', 'Compatibilização de projetos: arquitetura, estrutura e projetos complementares.', [P + 's07_clinica-multimed.png']],
  ['compatibilizacao', 'jardins-berlim', 'Jardins Berlim', 'Senador Canedo/GO', 'Compatibilização das instalações prediais e da infraestrutura.', [P + 's21_1.png']],
  ['compatibilizacao', 'crea-parana', 'CREA Paraná', 'Curitiba/PR', 'Fiscalização de contrato BIM, coordenação de modelos e fiscalização de modelagem 3D, 4D e 5D, nos formatos IFC, RVT, NWF, NWD e NWC, com mais de 20 disciplinas de projeto envolvidas.', [M + 's16_1.png']],
  ['compatibilizacao', 'ministerio-publico', 'Ministério Público', 'Teresópolis/RJ', 'Fiscalização de contrato BIM, coordenação de modelos e fiscalização de modelagem 3D, 4D e 5D, nos formatos IFC, RVT, NWF, NWD e NWC, com mais de 20 disciplinas de projeto envolvidas.', [M + 's22_1.png']],

  // ---------------- Quantitativos e planejamento de obra
  ['quantitativos', 'nuveen', 'Nuveen', 'Londres, Inglaterra', 'Modelagem BIM de um auditório para extração de quantitativos.', [P + 's23_1.jpg']],
  ['quantitativos', 'quantitativos-interativos', 'Quantitativos de obra interativos', null, 'Painéis interativos com os quantitativos extraídos dos modelos BIM, por categoria de elemento (arquitetura, hidrossanitário e elétrico).', [P + 's26_2.png', P + 's27_2.png']],
  ['quantitativos', 'forum-aparecida', 'Fórum de Justiça de Aparecida', 'Aparecida de Goiânia/GO', 'Extração de quantitativos do modelo BIM de reforma.', [M + 's18_1.png']],
  ['quantitativos', 'forum-anapolis', 'Fórum de Justiça de Anápolis', 'Anápolis/GO', 'Extração de quantitativos do modelo BIM do fórum.', [M + 's20_1.png']],
  ['quantitativos', 'clinica-multimed', 'Clínica Multimed', 'Goiânia/GO', 'Extração de quantitativos dos modelos de arquitetura e estrutura.', [P + 's07_clinica-multimed.png']],
  ['quantitativos', 'jardins-berlim', 'Jardins Berlim', 'Senador Canedo/GO', 'Extração de quantitativos do modelo do empreendimento.', [P + 's21_1.png']],
  ['quantitativos', 'dub-11', 'DUB 11', 'Dublin, Irlanda', `Modelagem BIM ${PLAN}.`, [M + 's06_1.png']],
  ['quantitativos', 'college-square', 'College Square', 'Dublin, Irlanda', 'Modelagem BIM para planejamento, logística e acompanhamento de obra.', [M + 's07_1.png']],
  ['quantitativos', 'statestreet', 'Statestreet', 'Kilkenny, Irlanda', `Modelagem BIM ${PLAN}.`, [M + 's08_1.png']],

  // ---------------- As-built e nuvem de pontos
  ['asbuilt', 'buriti-shopping', 'Buriti Shopping', 'Aparecida de Goiânia/GO', 'Modelagem de arquitetura a partir de nuvem de pontos da fachada.', [P + 's20_1.png']],
  ['asbuilt', 'edificacao-comercial-goiania', 'Edificação comercial', 'Goiânia/GO', 'Modelagem de arquitetura e terreno a partir de nuvem de pontos.', [P + 's22_1.png']],
  ['asbuilt', 'carrefour', 'Carrefour', null, 'Modelagem e As-built BIM de arquitetura, estrutura e pontos elétricos e hidrossanitários, feitos por nuvem de pontos.', [P + 's25_1.jpg']],
  ['asbuilt', 'central-de-decorados-city', 'Central de Decorados (City)', 'Goiânia/GO', `Modelagem BIM com laser scanner de arquitetura, estrutura, infraestrutura de água, esgoto e drenagem, implantação, paisagismo e entorno, ${PLAN}.`, [A + 's09_1.png', A + 's09_2.jpg', A + 's10_1.png', A + 's10_3.png']],
  ['asbuilt', 'strip-mall', 'Strip Mall', 'Goiânia/GO', 'As-built BIM com laser scanner e levantamento topográfico.', [A + 's14_1.png']],
  ['asbuilt', 'ginasio-rio-vermelho', 'Ginásio Rio Vermelho', 'Goiânia/GO', 'As-built BIM de arquitetura e estrutura, com modelagem e documentação em DWG e PDF.', [A + 's15_1.jpg', A + 's15_2.jpg']],
  ['asbuilt', 'hupes', 'HUPES', 'Salvador/BA', 'As-built BIM de arquitetura, interiores e implantação, como base para a reforma.', [M + 's21_1.png']],
  ['asbuilt', 'jorlan', 'Jorlan', 'Goiânia/GO', 'Modelagem de arquitetura e terreno a partir de nuvem de pontos.', [M + 's13_1.png']],
  ['asbuilt', 'grupo-cesar', 'Grupo Cesar', 'Aparecida de Goiânia/GO', 'As-built, modelagem e projeto de readequação de arquitetura, instalações hidrossanitárias, drenagem e combate a incêndio.', [P + 's16_1.jpg']],

  // ---------------- Topografia
  ['topografia', 'complexo-serra-dourada', 'Complexo Serra Dourada', 'Goiânia/GO', 'Levantamento topográfico completo, com dados planialtimétricos precisos que serviram de base para projetos, estudos e planejamento das intervenções.', [A + 's06_1.png', A + 's07_1.png', A + 's07_3.png', A + 's07_2.png']],
  ['topografia', 'rio-meia-ponte', 'Rio Meia-Ponte', 'Goiânia/GO', 'Levantamento aerofotogramétrico planialtimétrico com drone e estudo de viabilidade, com ortomosaico e levantamento georreferenciado por LiDAR (Matrice 350 e Zenmuse L2).', [A + 's16_1.png', T + 's08_1.jpg']],
  ['topografia', 'oho-hotel', 'OHO Hotel', 'Pirenópolis/GO', 'Levantamento topográfico planialtimétrico e laser scanner, para planejamento e logística de obra.', [A + 's12_1.jpg', T + 's09_1.png', T + 's09_2.png']],
  ['topografia', 'shalom-empreendimentos', 'Shalom Empreendimentos', 'Goiânia/GO', 'Modelagem BIM da topografia do terreno.', [M + 's17_1.jpg']],
  ['topografia', 'ipec', 'IPEC', 'Pirenópolis/GO', 'Modelagem BIM da topografia e implantação de uma área de fazenda.', [M + 's12_1.png']],
];

const raiz = 'assets/vitrine';
const arquivoJson = path.join(raiz, 'projetos.json');
const dados = JSON.parse(fs.readFileSync(arquivoJson, 'utf8'));

// Limpa execuções anteriores (inclusive as pastas dos grupos que deixaram de existir).
for (const o of dados.projetos.filter((x) => x.fonte === 'portfolio')) {
  fs.rmSync(path.join(raiz, o.disciplina, o.id), { recursive: true, force: true });
}
for (const velho of ['civil', 'modelagem', 'fiscalizacao']) fs.rmSync(path.join(raiz, velho), { recursive: true, force: true });
dados.projetos = dados.projetos.filter((x) => x.fonte !== 'portfolio');
dados.disciplinas = dados.disciplinas.filter((d) => !['civil', 'modelagem', 'fiscalizacao'].includes(d.id));
for (const d of DISCIPLINAS_NOVAS) if (!dados.disciplinas.some((x) => x.id === d.id)) dados.disciplinas.push(d);
dados.disciplinas.sort((a, b) => ORDEM.indexOf(a.id) - ORDEM.indexOf(b.id));

function achar(relativo) {
  const completo = path.join(BASE, relativo);
  if (path.extname(relativo) && fs.existsSync(completo)) return completo;
  const dir = path.dirname(completo);
  const nome = path.basename(relativo);
  const achado = fs.existsSync(dir) ? fs.readdirSync(dir).find((f) => f === nome || f.startsWith(nome + '.')) : null;
  if (!achado) throw new Error(`imagem não encontrada: ${relativo}`);
  return path.join(dir, achado);
}

const cache = new Map(); // imagem de origem -> buffer WebP já preparado
const gravadas = new Map(); // imagem de origem -> caminho já gravado em assets/
async function preparar(relativo) {
  if (cache.has(relativo)) return cache.get(relativo);
  const arquivo = achar(relativo);
  const base = sharp(arquivo, { limitInputPixels: false }).flatten({ background: '#ffffff' });
  const { data, info } = await base.clone().trim({ background: '#ffffff', threshold: 14 }).png().toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(info.width, info.height) * 0.04);
  const webp = await sharp(data)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: '#ffffff' })
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 5 })
    .toBuffer();
  cache.set(relativo, webp);
  return webp;
}

for (const [disciplina, slug, nome, local, resumo, arquivos] of CARDS) {
  const id = `${slug}-${disciplina}`;
  const destino = path.join(raiz, disciplina, id);
  fs.mkdirSync(destino, { recursive: true });
  const imagens = [];
  let primeira = null;
  for (let i = 0; i < arquivos.length; i++) {
    const buf = await preparar(arquivos[i]);
    const n = String(i + 1).padStart(2, '0');
    // Uma imagem usada em várias disciplinas é gravada uma vez e reaproveitada.
    let src = gravadas.get(arquivos[i]);
    if (!src) {
      src = `${raiz}/${disciplina}/${id}/${n}.webp`;
      fs.writeFileSync(src, buf);
      gravadas.set(arquivos[i], src);
    }
    if (i === 0) primeira = buf;
    const meta = await sharp(buf).metadata();
    imagens.push({ src, caption: arquivos.length > 1 ? `Imagem ${i + 1}` : 'Imagem', w: meta.width, h: meta.height });
  }
  await sharp(primeira).resize({ width: 900, height: 600, fit: 'contain', background: '#ffffff' }).webp({ quality: 84 }).toFile(path.join(destino, 'capa.webp'));
  dados.projetos.push({
    id, disciplina, tipo: nome, local, resumo, ferramentas: [], fonte: 'portfolio',
    capa: `${raiz}/${disciplina}/${id}/capa.webp`, imagens, conteudo: [], area: null, modelo: null, modeloMB: null,
  });
}

fs.writeFileSync(arquivoJson, JSON.stringify(dados, null, 1) + '\n');
console.log(`cards de obras: ${CARDS.length}; obras distintas: ${new Set(CARDS.map((c) => c[1])).size}; total na vitrine: ${dados.projetos.length}`);
