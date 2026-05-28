#!/usr/bin/env node
// Scans all public repos in the org for docs-meta.json and generates index.html.

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

function statusLabel(status) {
  if (status === 'active') return { text: 'Ativo', css: 'active' };
  if (status === 'wip')    return { text: 'Em desenvolvimento', css: 'wip' };
  return { text: 'Em breve', css: 'soon' };
}

function card(project) {
  const { name, description, slug, status = 'active', url } = project;
  const href = url || `/${slug}/`;
  const label = statusLabel(status);
  const disabled = status !== 'active' ? ' card--disabled' : '';
  const pointer = status !== 'active' ? ' style="pointer-events:none"' : '';
  return `
      <a class="card${disabled}" href="${href}"${pointer}>
        <span class="tag tag--${label.css}">${label.text}</span>
        <h2>${name}</h2>
        <p>${description}</p>
      </a>`;
}

function html(projects) {
  const cards = projects.length
    ? projects.map(card).join('\n')
    : '      <p style="color:rgba(255,255,255,0.4)">Nenhum projeto encontrado.</p>';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TechGears Docs</title>
  <link rel="shortcut icon" href="https://techgears.app/assets/logo.png" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" />
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Ubuntu',sans-serif;background:#222;color:#fff;min-height:100vh;display:flex;flex-direction:column}
    header{padding:1.25rem 2rem;border-bottom:2px solid #f83038;display:flex;align-items:center;gap:.75rem;background:#1c1c1c}
    header img{height:36px;width:auto}
    header span{font-size:1.1rem;font-weight:500}
    header span b{color:#f83038}
    main{flex:1;max-width:900px;width:100%;margin:0 auto;padding:3rem 2rem}
    h1{font-size:2rem;font-weight:700;margin-bottom:.5rem}
    h1 span{color:#f83038}
    .subtitle{color:rgba(255,255,255,.6);font-weight:300;font-size:1rem;margin-bottom:2.5rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem}
    .card{background:#2f2f2f;border-left:4px solid #f83038;border-radius:6px;padding:1.25rem 1.5rem;text-decoration:none;color:inherit;transition:background .15s,transform .15s;display:block}
    .card:hover{background:#383838;transform:translateY(-2px)}
    .card--disabled{opacity:.45}
    .card h2{font-size:1rem;font-weight:500;margin-bottom:.35rem}
    .card p{font-size:.875rem;color:rgba(255,255,255,.55);font-weight:300;line-height:1.5}
    .tag{display:inline-block;font-size:.7rem;font-weight:500;padding:.15rem .5rem;border-radius:999px;margin-bottom:.6rem}
    .tag--active{background:rgba(248,48,56,.15);color:#f83038}
    .tag--wip{background:rgba(248,180,0,.12);color:#f8b400}
    .tag--soon{background:rgba(255,255,255,.08);color:rgba(255,255,255,.4)}
    footer{text-align:center;padding:1.5rem;font-size:.8rem;color:rgba(255,255,255,.3);border-top:1px solid rgba(255,255,255,.08)}
    footer a{color:#f83038;text-decoration:none}
  </style>
</head>
<body>
  <header>
    <img src="https://techgears.app/assets/logo.png" alt="TechGears" />
    <span>Tech<b>Gears</b> Docs</span>
  </header>
  <main>
    <h1>Tech<span>Gears</span> — Documentação</h1>
    <p class="subtitle">Portal de documentação técnica dos projetos do clube universitário TechGears.</p>
    <div class="grid">
${cards}
    </div>
  </main>
  <footer>
    © ${new Date().getFullYear()} <a href="https://techgears.app" target="_blank">TechGears Inteli</a> — todos os projetos sob licença MIT
  </footer>
</body>
</html>`;
}

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

  // Sort: active first, then wip, then soon; alphabetical within groups
  const order = { active: 0, wip: 1, soon: 2 };
  projects.sort((a, b) => {
    const diff = (order[a.status] ?? 2) - (order[b.status] ?? 2);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  console.log(`\nBuilding portal with ${projects.length} project(s)...`);
  fs.writeFileSync('index.html', html(projects));
  fs.writeFileSync('projects.json', JSON.stringify(projects, null, 2));
  console.log('Done → index.html + projects.json');
})();
