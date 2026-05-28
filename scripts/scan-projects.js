#!/usr/bin/env node
// Scans all public repos in the org for docs-meta.json and updates src/data/projects.json.

const https = require('https');
const fs = require('fs');

const ORG = 'TechGearsInteli';
const TOKEN = process.env.GITHUB_TOKEN;

function request(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'portal-scanner',
        'Accept': 'application/vnd.github+json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
      },
    };
    https.get(url, opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) return resolve(null);
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
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

(async () => {
  console.log(`Scanning ${ORG} repos for docs-meta.json...`);
  const repos = await fetchAllRepos();
  console.log(`Found ${repos.length} public repos`);

  const projects = [];
  for (const repo of repos) {
    const meta = await request(
      `https://raw.githubusercontent.com/${ORG}/${repo.name}/main/docs-meta.json`
    );
    if (meta && meta.slug) {
      console.log(`  ✓ ${repo.name}`);
      projects.push(meta);
    }
  }

  const order = { active: 0, wip: 1, soon: 2 };
  projects.sort((a, b) => {
    const diff = (order[a.status] ?? 2) - (order[b.status] ?? 2);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });

  fs.writeFileSync('src/data/projects.json', JSON.stringify(projects, null, 2));
  console.log(`Done — ${projects.length} project(s) written to src/data/projects.json`);
})();
