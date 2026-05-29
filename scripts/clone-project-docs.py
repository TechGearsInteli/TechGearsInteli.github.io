#!/usr/bin/env python3
# Clones each project repo and copies its docs/docs/ into project-docs/{slug}/.
import json, subprocess, shutil, os

with open('src/data/projects.json') as f:
    projects = json.load(f)

os.makedirs('project-docs', exist_ok=True)

for p in projects:
    slug = p['slug']
    repo = p.get('repoName', slug)
    print(f'Cloning {repo}...')

    clone_dir = f'/tmp/clone-{slug}'
    if os.path.exists(clone_dir):
        shutil.rmtree(clone_dir)

    result = subprocess.run(
        ['git', 'clone', '--depth=1', '--quiet',
         f'https://github.com/TechGearsInteli/{repo}.git', clone_dir],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f'  Failed: {result.stderr.strip()}')
        continue

    src = os.path.join(clone_dir, 'docs', 'docs')
    dst = os.path.join('project-docs', slug)

    if os.path.exists(src):
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        print(f'  ✓ {slug}')
    else:
        print(f'  No docs/docs/ found in {repo}')
