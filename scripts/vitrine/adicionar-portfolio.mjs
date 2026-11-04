/**
 * Acrescenta à vitrine as obras dos portfólios em PDF da AION (pasta PORTIFÓLIO), citando o cliente
 * pelo nome (só pessoa jurídica ou órgão público). Obras de pessoa física, páginas com carimbo de
 * pessoa física e fotos de pessoas ficam de fora. Re-executável: apaga o que tem `fonte: "portfolio"`
 * e gera de novo.
 *
 *   node scripts/vitrine/adicionar-portfolio.mjs
 *
 * Cada imagem é uma página do PDF (ou um recorte dela, em frações da página: crop [x0, y0, x1, y1]).
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { SRC, openPdf, renderPage } from './lib.mjs';

const MOD = 'AION (MODELAGENS BIM).pdf';
const PRJ = 'AION PROJETOS.pdf';
const ASB = 'PORTFÓLIO AS BUILT BIM.pdf';
const TOP = 'PORTFÓLIO TOPOGRAFIA.pdf';

const DISCIPLINAS_NOVAS = [
  { id: 'civil', nome: 'Projetos civis', icone: 'ph-house-line' },
  { id: 'modelagem', nome: 'Modelagem BIM', icone: 'ph-cube' },
  { id: 'fiscalizacao', nome: 'Fiscalização e coordenação BIM', icone: 'ph-checks' },
];
// Ordem de exibição na vitrine.
const ORDEM = ['civil', 'modelagem', 'fiscalizacao', 'estrutural', 'hidrossanitario', 'eletrico', 'incendio', 'asbuilt', 'topografia'];

const p = (pdf, pagina, crop) => ({ pdf, pagina, crop });
const OBRAS = [
  // --- Projetos civis
  ['civil', 'galeria-costa', 'Galeria Costa · Rio Verde/GO', 'Projeto de arquitetura e modelagem BIM de galeria comercial, com compatibilização entre as disciplinas.', [p(PRJ, 7, [0.06, 0.105, 0.5, 0.47])]],
  ['civil', 'posto-dor', 'Posto D’or · Senador Canedo/GO', 'Projetos de arquitetura e de terraplenagem de posto de combustíveis.', [p(PRJ, 7, [0.06, 0.49, 0.5, 0.915])]],
  ['civil', 'clinica-multimed', 'Clínica Multimed · Goiânia/GO', 'Arquitetura com alto nível de detalhamento para execução de reforma, extração de quantitativos e compatibilização com estrutura e projetos complementares.', [p(PRJ, 7, [0.505, 0.5, 0.88, 0.915])]],
  ['civil', 'comigo-jussara', 'COMIGO Jussara · Goiânia/GO', 'Projeto e modelagem BIM de arquitetura, com compatibilização entre arquitetura, hidrossanitário e estrutura.', [p(MOD, 14)]],
  ['civil', 'vivendas-do-atlantico', 'Vivendas do Atlântico · Goiânia/GO', 'Projeto e modelagem BIM de arquitetura, com compatibilização entre arquitetura, hidrossanitário e estrutura.', [p(MOD, 15)]],
  ['civil', 'maternidade-agusta-de-barros', 'Maternidade Agusta de Barros · Rio Verde/GO', 'Projeto e modelagem BIM de arquitetura, com compatibilização BIM da arquitetura, do hidrossanitário e da estrutura.', [p(MOD, 26)]],
  ['civil', 'grupo-cesar', 'Grupo Cesar · Aparecida de Goiânia/GO', 'As-built, modelagem e projeto de readequação de arquitetura, instalações hidrossanitárias, drenagem e combate a incêndio.', [p(PRJ, 16)]],

  // --- Modelagem BIM
  ['modelagem', 'tjma', 'TJMA · Imperatriz/MA', 'Modelagem BIM multidisciplinar: arquitetura, estrutura, hidrossanitário, elétrico, prevenção e combate a incêndio, climatização, proteção contra descargas atmosféricas, cabeamento estruturado e entorno.', [p(MOD, 5)]],
  ['modelagem', 'dub-11', 'DUB 11 · Dublin, Irlanda', 'Modelagem BIM de arquitetura, estrutura, infraestrutura de água, esgoto e drenagem, implantação, paisagismo e entorno, para planejamento e logística de obra.', [p(MOD, 6)]],
  ['modelagem', 'college-square', 'College Square · Dublin, Irlanda', 'Modelagem BIM de arquitetura, estrutura, implantação e entorno, para planejamento, logística e acompanhamento de obra.', [p(MOD, 7)]],
  ['modelagem', 'statestreet', 'Statestreet · Kilkenny, Irlanda', 'Modelagem BIM de arquitetura, estrutura, implantação e entorno, para planejamento e logística de obra.', [p(MOD, 8)]],
  ['modelagem', 'dec-maranhao', 'DEC Maranhão · Anápolis/GO', 'Consultoria e implementação BIM para a disciplina de interiores: criação de famílias, templates e bibliotecas BIM.', [p(MOD, 9)]],
  ['modelagem', 'solidez', 'Solidez · Goiânia/GO', 'Modelagem BIM de arquitetura a partir de nuvem de pontos fornecida pela Arismar Topografia.', [p(MOD, 11)]],
  ['modelagem', 'ipec', 'IPEC · Pirenópolis/GO', 'Modelagem BIM de topografia e de arquitetura de edificações em área de fazenda.', [p(MOD, 12)]],
  ['modelagem', 'jorlan', 'Jorlan · Goiânia/GO', 'Modelagem arquitetônica BIM para documentação.', [p(MOD, 13)]],
  ['modelagem', 'shalom-empreendimentos', 'Shalom Empreendimentos · Goiânia/GO', 'Modelagem BIM da topografia e da arquitetura.', [p(MOD, 17)]],
  ['modelagem', 'forum-aparecida', 'Fórum de Justiça de Aparecida · GO', 'Modelagem BIM de arquitetura, interiores, implantação e entorno para reforma, com extração de quantitativos.', [p(MOD, 18)]],
  ['modelagem', 'sesc-guarapuava', 'SESC Guarapuava · PR', 'Modelagem BIM de arquitetura para projeto de retrofit e projetos complementares.', [p(MOD, 19)]],
  ['modelagem', 'forum-anapolis', 'Fórum de Justiça de Anápolis · GO', 'Modelagem BIM do fórum e extração de quantitativos.', [p(MOD, 20)]],
  ['modelagem', 'hupes', 'HUPES · Salvador/BA', 'Modelagem BIM de arquitetura, interiores, implantação e entorno para reforma.', [p(MOD, 21)]],
  ['modelagem', 'hospital-univasf', 'Hospital UNIVASF · Petrolina e Juazeiro', 'Modelagem BIM de arquitetura, interiores, implantação e entorno para reforma.', [p(MOD, 23)]],
  ['modelagem', 'furnas', 'FURNAS · Espírito Santo', 'Modelagem BIM da barragem, do terreno e das edificações.', [p(PRJ, 14)]],
  ['modelagem', 'hospital-ufba', 'Hospital Universitário UFBA · Salvador/BA', 'Levantamento e modelagem BIM de arquitetura e terreno.', [p(PRJ, 17)]],
  ['modelagem', 'nuveen', 'Nuveen · Londres, Inglaterra', 'Modelagem BIM de um auditório para extração de quantitativos.', [p(PRJ, 23)]],
  ['modelagem', 'jardins-berlim', 'Jardins Berlim · Senador Canedo/GO', 'Modelagem de drenagem de arrimo e servidão, compatibilização das instalações prediais e da infraestrutura, estrutura e fundação, locação das casas e extração de quantitativos.', [p(PRJ, 21)]],
  ['modelagem', 'quantitativos-interativos', 'Quantitativos de obra interativos', 'Painéis interativos com os quantitativos extraídos dos modelos BIM, por categoria de elemento (arquitetura, hidrossanitário e elétrico).', [p(PRJ, 26), p(PRJ, 27)]],

  // --- Fiscalização e coordenação BIM
  ['fiscalizacao', 'crea-parana', 'CREA Paraná · Curitiba/PR', 'Fiscalização de contrato BIM, coordenação de modelos e fiscalização de modelagem 3D, 4D e 5D, nos formatos IFC, RVT, NWF, NWD e NWC, com mais de 20 disciplinas de projeto envolvidas.', [p(MOD, 16)]],
  ['fiscalizacao', 'ministerio-publico', 'Ministério Público · Teresópolis/RJ', 'Fiscalização de contrato BIM, coordenação de modelos e fiscalização de modelagem 3D, 4D e 5D, nos formatos IFC, RVT, NWF, NWD e NWC, com mais de 20 disciplinas de projeto envolvidas.', [p(MOD, 22)]],

  // --- As-built e nuvem de pontos
  ['asbuilt', 'buriti-shopping', 'Buriti Shopping · Aparecida de Goiânia/GO', 'Modelagem de arquitetura a partir de nuvem de pontos da fachada.', [p(PRJ, 20)]],
  ['asbuilt', 'edificacao-comercial-goiania', 'Edificação comercial · Goiânia/GO', 'Modelagem de arquitetura e terreno a partir de nuvem de pontos.', [p(PRJ, 22)]],
  ['asbuilt', 'carrefour', 'Carrefour', 'Modelagem e As-built BIM de arquitetura, estrutura e pontos elétricos e hidrossanitários, feitos por nuvem de pontos.', [p(PRJ, 25)]],
  ['asbuilt', 'central-de-decorados-city', 'Central de Decorados (City) · Goiânia/GO', 'Modelagem BIM com laser scanner de arquitetura, estrutura, infraestrutura de água, esgoto e drenagem, implantação, paisagismo e entorno, para planejamento e logística de obra.', [p(ASB, 9), p(ASB, 10)]],
  ['asbuilt', 'strip-mall', 'Strip Mall · Goiânia/GO', 'As-built BIM com laser scanner e levantamento topográfico.', [p(ASB, 14)]],
  ['asbuilt', 'ginasio-rio-vermelho', 'Ginásio Rio Vermelho · Goiânia/GO', 'As-built BIM de arquitetura e estrutura, com modelagem e documentação em DWG e PDF.', [p(ASB, 15)]],
  ['asbuilt', 'assembleia-de-deus', 'Assembleia de Deus · Goiânia/GO', 'Modelagem e documentação BIM de arquitetura da edificação.', [p(ASB, 21), p(ASB, 22)]],

  // --- Topografia
  ['topografia', 'complexo-serra-dourada', 'Complexo Serra Dourada · Goiânia/GO', 'Levantamento topográfico completo, com dados planialtimétricos precisos que serviram de base para projetos, estudos e planejamento das intervenções.', [p(ASB, 6), p(ASB, 7)]],
  ['topografia', 'rio-meia-ponte', 'Rio Meia-Ponte · Goiânia/GO', 'Levantamento aerofotogramétrico planialtimétrico com drone e estudo de viabilidade, com ortomosaico e levantamento georreferenciado por LiDAR (Matrice 350 e Zenmuse L2).', [p(TOP, 8), p(ASB, 16)]],
  ['topografia', 'oho-hotel', 'OHO Hotel · Pirenópolis/GO', 'Levantamento topográfico planialtimétrico e laser scanner, para planejamento e logística de obra.', [p(ASB, 12)]],
];

const raiz = 'assets/vitrine';
const arquivoJson = path.join(raiz, 'projetos.json');
const dados = JSON.parse(fs.readFileSync(arquivoJson, 'utf8'));

// Limpa uma execução anterior.
for (const o of dados.projetos.filter((x) => x.fonte === 'portfolio')) {
  fs.rmSync(path.join(raiz, o.disciplina, o.id), { recursive: true, force: true });
}
dados.projetos = dados.projetos.filter((x) => x.fonte !== 'portfolio');
for (const d of DISCIPLINAS_NOVAS) if (!dados.disciplinas.some((x) => x.id === d.id)) dados.disciplinas.push(d);
dados.disciplinas.sort((a, b) => ORDEM.indexOf(a.id) - ORDEM.indexOf(b.id));

const docs = new Map();
const abrir = async (nome) => {
  if (!docs.has(nome)) docs.set(nome, await openPdf(path.join(SRC, nome)));
  return docs.get(nome);
};

for (const [disciplina, id, tipo, resumo, paginas] of OBRAS) {
  const destino = path.join(raiz, disciplina, id);
  fs.mkdirSync(destino, { recursive: true });
  const imagens = [];
  for (let i = 0; i < paginas.length; i++) {
    const { pdf, pagina, crop } = paginas[i];
    const doc = await abrir(pdf);
    const { png, width, height } = renderPage(doc, pagina - 1, crop ? 3000 : 2000);
    let img = sharp(png);
    let w = width;
    let h = height;
    if (crop) {
      const [x0, y0, x1, y1] = crop;
      const area = { left: Math.round(x0 * width), top: Math.round(y0 * height), width: Math.round((x1 - x0) * width), height: Math.round((y1 - y0) * height) };
      img = img.extract(area);
      w = area.width;
      h = area.height;
    }
    const nome = String(i + 1).padStart(2, '0');
    await img.webp({ quality: 82, effort: 5 }).toFile(path.join(destino, `${nome}.webp`));
    imagens.push({ src: `${raiz}/${disciplina}/${id}/${nome}.webp`, caption: paginas.length > 1 ? `Imagem ${i + 1}` : 'Imagem', w, h });
  }
  await sharp(path.join(destino, '01.webp')).resize({ width: 900 }).webp({ quality: 80 }).toFile(path.join(destino, 'capa.webp'));
  const [nome, local] = tipo.split(' · ');
  dados.projetos.push({
    id, disciplina, tipo: nome, local: local || null, resumo, ferramentas: [], fonte: 'portfolio',
    capa: `${raiz}/${disciplina}/${id}/capa.webp`, imagens, conteudo: [], area: null, modelo: null, modeloMB: null,
  });
}

fs.writeFileSync(arquivoJson, JSON.stringify(dados, null, 1) + '\n');
console.log(`obras acrescentadas: ${OBRAS.length}; total na vitrine: ${dados.projetos.length}`);
