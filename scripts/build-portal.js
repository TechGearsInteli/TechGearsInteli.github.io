#!/usr/bin/env node
// Scans all public repos in the org for docs-meta.json and generates index.html + guide.html.

const https = require('https');
const fs = require('fs');

const ORG = 'TechGearsInteli';
const TOKEN = process.env.GITHUB_TOKEN;

function request(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'portal-builder',
        'Accept': 'application/vnd.github+json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
      },
    };
    https.get(url, opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) return resolve(null);
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const batch = await request(
      `https://api.github.com/orgs/${ORG}/repos?type=public&per_page=100&page=${page}`
    );
    if (!batch || !Array.isArray(batch) || batch.length === 0) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return repos;
}

async function fetchMeta(repoName) {
  return await request(
    `https://raw.githubusercontent.com/${ORG}/${repoName}/main/docs-meta.json`
  );
}

// ─── Shared layout ────────────────────────────────────────────────────────────

const SHARED_CSS = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Ubuntu',sans-serif;background:#222;color:#fff;min-height:100vh;display:flex;flex-direction:column}
    a{color:#f83038;text-decoration:none}
    a:hover{text-decoration:underline}
    header{padding:1.25rem 2rem;border-bottom:2px solid #f83038;display:flex;align-items:center;justify-content:space-between;background:#1c1c1c}
    .header-left{display:flex;align-items:center;gap:.75rem;text-decoration:none}
    header img{height:36px;width:auto}
    .header-brand{font-size:1.1rem;font-weight:500;color:#fff}
    .header-brand b{color:#f83038}
    nav{display:flex;gap:1.5rem}
    nav a{color:rgba(255,255,255,.7);font-size:.9rem;font-weight:400}
    nav a:hover,nav a.active{color:#fff;text-decoration:none}
    main{flex:1;max-width:900px;width:100%;margin:0 auto;padding:3rem 2rem}
    h1{font-size:2rem;font-weight:700;margin-bottom:.5rem}
    h1 span{color:#f83038}
    h2{font-size:1.25rem;font-weight:600;margin:2rem 0 .75rem;color:#fff}
    h3{font-size:1rem;font-weight:600;margin:1.5rem 0 .5rem;color:rgba(255,255,255,.85)}
    p{line-height:1.7;color:rgba(255,255,255,.75);margin-bottom:.75rem}
    ul,ol{padding-left:1.25rem;color:rgba(255,255,255,.75);line-height:1.8}
    li{margin-bottom:.25rem}
    code{background:#2f2f2f;border:1px solid rgba(255,255,255,.1);border-radius:4px;padding:.1rem .4rem;font-size:.85rem;font-family:monospace;color:#f83038}
    pre{background:#1c1c1c;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:1rem 1.25rem;overflow-x:auto;margin:.75rem 0}
    pre code{background:none;border:none;padding:0;color:rgba(255,255,255,.85);font-size:.85rem}
    .subtitle{color:rgba(255,255,255,.6);font-weight:300;font-size:1rem;margin-bottom:2.5rem}
    .note{background:rgba(248,48,56,.08);border-left:3px solid #f83038;padding:.75rem 1rem;border-radius:0 4px 4px 0;margin:1rem 0}
    .note p{color:rgba(255,255,255,.8);margin:0}
    footer{text-align:center;padding:1.5rem;font-size:.8rem;color:rgba(255,255,255,.3);border-top:1px solid rgba(255,255,255,.08)}
    footer a{color:#f83038}
`;

function layout({ title, navActive, body }) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — TechGears Docs</title>
  <link rel="shortcut icon" href="https://techgears.app/assets/logo.png" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" />
  <style>${SHARED_CSS}</style>
</head>
<body>
  <header>
    <a class="header-left" href="/">
      <img src="https://techgears.app/assets/logo.png" alt="TechGears" />
      <span class="header-brand">Tech<b>Gears</b> Docs</span>
    </a>
    <nav>
      <a href="/" class="${navActive === 'home' ? 'active' : ''}">Projetos</a>
      <a href="/guide.html" class="${navActive === 'guide' ? 'active' : ''}">Guia</a>
    </nav>
  </header>
  <main>${body}</main>
  <footer>
    © ${year} <a href="https://techgears.app" target="_blank">TechGears Inteli</a> — todos os projetos sob licença MIT
  </footer>
</body>
</html>`;
}

// ─── index.html ───────────────────────────────────────────────────────────────

function statusLabel(status) {
  if (status === 'active') return { text: 'Ativo',             css: 'active' };
  if (status === 'wip')    return { text: 'Em desenvolvimento', css: 'wip'    };
  return                          { text: 'Em breve',           css: 'soon'   };
}

const CARD_CSS = `
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem}
    .card{background:#2f2f2f;border-left:4px solid #f83038;border-radius:6px;padding:1.25rem 1.5rem;text-decoration:none;color:inherit;transition:background .15s,transform .15s;display:block}
    .card:hover{background:#383838;transform:translateY(-2px)}
    .card--disabled{opacity:.45;pointer-events:none}
    .card h2{font-size:1rem;font-weight:500;margin-bottom:.35rem;color:#fff}
    .card p{font-size:.875rem;color:rgba(255,255,255,.55);font-weight:300;line-height:1.5;margin:0}
    .tag{display:inline-block;font-size:.7rem;font-weight:500;padding:.15rem .5rem;border-radius:999px;margin-bottom:.6rem}
    .tag--active{background:rgba(248,48,56,.15);color:#f83038}
    .tag--wip{background:rgba(248,180,0,.12);color:#f8b400}
    .tag--soon{background:rgba(255,255,255,.08);color:rgba(255,255,255,.4)}
`;

function indexHtml(projects) {
  const cards = projects.length
    ? projects.map(p => {
        const { name, description, slug, status = 'active', url } = p;
        const href = url || `/${slug}/`;
        const label = statusLabel(status);
        const disabled = status !== 'active' ? ' card--disabled' : '';
        return `
      <a class="card${disabled}" href="${href}">
        <span class="tag tag--${label.css}">${label.text}</span>
        <h2>${name}</h2>
        <p>${description}</p>
      </a>`;
      }).join('\n')
    : '<p style="color:rgba(255,255,255,.4)">Nenhum projeto encontrado.</p>';

  const body = `
    <style>${CARD_CSS}</style>
    <h1>Tech<span>Gears</span></h1>
    <p class="subtitle">Portal de documentação técnica dos projetos do clube universitário TechGears.</p>
    <div class="grid">${cards}
    </div>`;

  return layout({ title: 'Projetos', navActive: 'home', body });
}

// ─── guide.html ───────────────────────────────────────────────────────────────

function guideHtml() {
  const body = `
    <h1>Guia de <span>Documentação</span></h1>
    <p class="subtitle">Como adicionar e manter a documentação de um projeto TechGears.</p>

    <h2>Como funciona o portal</h2>
    <p>O portal em <code>docs.techgears.app</code> é gerado automaticamente a partir dos repositórios da organização <strong>TechGearsInteli</strong>. Cada projeto que quiser aparecer no portal precisa ter um arquivo <code>docs-meta.json</code> na raiz do repositório e o GitHub Pages configurado.</p>
    <p>Quando o deploy de documentação de um projeto é concluído, ele dispara o workflow do portal via <code>repository_dispatch</code>, que escaneia todos os repositórios e regenera as páginas automaticamente.</p>

    <h2>Adicionando um novo projeto</h2>

    <h3>1. Crie o docs-meta.json na raiz do repositório</h3>
    <pre><code>{
  "slug": "nome-do-projeto",
  "name": "Nome do Projeto",
  "description": "Descrição curta exibida no card do portal.",
  "status": "active"
}</code></pre>
    <p>Valores de <code>status</code>: <code>active</code> (ativo e clicável), <code>wip</code> (em desenvolvimento), <code>soon</code> (em breve, desabilitado).</p>

    <h3>2. Configure o GitHub Pages</h3>
    <p>Em <strong>Settings &rarr; Pages &rarr; Source</strong>, selecione <strong>GitHub Actions</strong>. O projeto será servido em <code>docs.techgears.app/nome-do-projeto/</code> automaticamente.</p>

    <h3>3. Copie o workflow de deploy</h3>
    <p>Adicione o arquivo <code>.github/workflows/deploy-docs.yml</code> ao repositório. O modelo está em <a href="https://github.com/TechGearsInteli/programmable-ecu/blob/main/.github/workflows/deploy-docs.yml" target="_blank">programmable-ecu</a>. Inclua o passo de notificação ao portal no final do job <code>deploy</code>:</p>
    <pre><code>- name: Notify docs portal
  continue-on-error: true
  env:
    GH_TOKEN: \${{ secrets.PORTAL_TOKEN }}
  run: |
    gh api repos/TechGearsInteli/TechGearsInteli.github.io/dispatches \\
      --field event_type=docs-deployed \\
      --field "client_payload[slug]=nome-do-projeto"</code></pre>

    <div class="note">
      <p>O secret <code>PORTAL_TOKEN</code> é um org secret configurado uma única vez em <strong>github.com/organizations/TechGearsInteli/settings/secrets/actions</strong>. Todos os repositórios da organização herdam automaticamente.</p>
    </div>

    <h2>Padrão de documentação</h2>
    <p>Cada projeto deve usar Docusaurus com <code>routeBasePath: '/'</code> e <code>baseUrl: '/nome-do-projeto/'</code>. As páginas de documentação devem seguir o padrão definido abaixo.</p>

    <h3>Estrutura mínima de um arquivo .md</h3>
    <pre><code>---
title: "Título da Página"
slug: /secao/titulo
sidebar_position: 1
---

# Título da Página

&lt;div style={{textAlign: 'justify'}}&gt;

&amp;emsp;Parágrafo de abertura.

&amp;emsp;Desenvolvimento do conteúdo.

&lt;/div&gt;</code></pre>

    <h3>Regras obrigatórias</h3>
    <ul>
      <li>Frontmatter com <code>title</code>, <code>slug</code> e <code>sidebar_position</code></li>
      <li>Conteúdo dentro de <code>&lt;div style={{textAlign: 'justify'}}&gt;</code></li>
      <li>Parágrafos iniciando com <code>&amp;emsp;</code></li>
      <li>Imagens dentro de <code>&lt;div align="center"&gt;</code> com legenda numerada (<strong>Figura X</strong>) e fonte</li>
      <li>Tabelas dentro de <code>&lt;div align="center"&gt;</code> com legenda numerada (<strong>Quadro X</strong>) e fonte</li>
      <li>Linguagem formal, sem primeira pessoa</li>
    </ul>
    <p>O lint é executado automaticamente em todo Pull Request que alterar arquivos <code>.md</code> dentro de <code>docs-site/docs/</code>.</p>

    <h2>Estrutura recomendada do repositório</h2>
    <pre><code>meu-projeto/
├── docs-meta.json          # registro no portal
├── firmware/               # código do microcontrolador
├── hardware/               # esquemáticos e diagramas
├── calibration/            # arquivos de calibração
├── docs-site/              # site Docusaurus
│   ├── docs/
│   │   ├── visao-geral.md
│   │   └── guia/
│   ├── docusaurus.config.ts
│   └── package.json
├── scripts/
│   └── check-docs.js       # validador de documentação
└── .github/
    └── workflows/
        ├── deploy-docs.yml
        └── lint-docs.yml</code></pre>

    <h2>Rodando localmente</h2>
    <pre><code>cd docs-site
npm install
npm run start</code></pre>
    <p>O site abre em <code>http://localhost:3000/nome-do-projeto/</code>.</p>
  `;

  return layout({ title: 'Guia', navActive: 'guide', body });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`Scanning ${ORG} repos...`);
  const repos = await fetchAllRepos();
  console.log(`Found ${repos.length} public repos`);

  const projects = [];
  for (const repo of repos) {
    const meta = await fetchMeta(repo.name);
    if (meta && meta.slug) {
      console.log(`  ✓ ${repo.name} → ${meta.slug}`);
      projects.push(meta);
    }
  }

  const order = { active: 0, wip: 1, soon: 2 };
  projects.sort((a, b) => {
    const diff = (order[a.status] ?? 2) - (order[b.status] ?? 2);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  console.log(`\nBuilding portal with ${projects.length} project(s)...`);
  fs.writeFileSync('index.html', indexHtml(projects));
  fs.writeFileSync('guide.html', guideHtml());
  fs.writeFileSync('projects.json', JSON.stringify(projects, null, 2));
  console.log('Done → index.html + guide.html + projects.json');
})();
