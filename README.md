# TechGears Docs Portal

Repositório do portal de documentação técnica da [TechGears](https://techgears.app), acessível em **[docs.techgears.app](https://docs.techgears.app)**.

---

## O que é este repositório

Este repositório serve dois propósitos:

1. **Portal de projetos** — página inicial em `docs.techgears.app` que lista automaticamente todos os projetos da organização [TechGearsInteli](https://github.com/TechGearsInteli) que possuem documentação publicada.
2. **Guia de documentação** — seção `docs.techgears.app/guia` com o padrão de escrita, estrutura de arquivos, regras de formatação e instruções de CI/CD que todos os projetos da TechGears devem seguir.

---

## Como funciona a automação

Cada projeto que quiser aparecer no portal precisa ter um arquivo `docs-meta.json` na raiz do seu repositório. O workflow `build-portal.yml` deste repositório escaneia todos os repos públicos da organização, coleta os metadados e reconstrói o site automaticamente.

### Fluxo completo

```
Projeto faz push em main
        │
        ▼
deploy-docs.yml (projeto) — faz build e deploy do Docusaurus
        │
        ▼
Envia repository_dispatch → TechGearsInteli.github.io
        │
        ▼
build-portal.yml — escaneia a org, atualiza projects.json, reconstrói e publica o portal
```

O portal também pode ser reconstruído manualmente via **Actions → Build Portal → Run workflow**.

---

## Estrutura do repositório

```
TechGearsInteli.github.io/
├── docs/
│   └── guia/                      # Guia de documentação da TechGears
│       ├── estilizacao.md          # Como usar admonitions, tabelas, código
│       ├── estrutura.md            # Organização de pastas e como publicar páginas
│       ├── padrao-documentacao.md  # Regras de escrita, imagens e tabelas
│       ├── padrao-pesquisas.md     # Template para documentar pesquisas comparativas
│       ├── rodar-localmente.md     # Como rodar o portal e projetos localmente
│       └── integracao-continua.md  # Como funciona o CI/CD
├── scripts/
│   └── scan-projects.js           # Escaneia a org e atualiza src/data/projects.json
├── src/
│   ├── css/custom.css             # Identidade visual TechGears
│   ├── data/projects.json         # Lista de projetos (gerada automaticamente)
│   └── pages/index.tsx            # Home page com os cards de projetos
├── static/
│   ├── CNAME                      # docs.techgears.app
│   └── img/
│       └── techgears-logo.png
├── docusaurus.config.ts
├── sidebars.ts
└── .github/
    └── workflows/
        └── build-portal.yml       # Escaneia, builda e publica no GitHub Pages
```

---

## Adicionando um novo projeto ao portal

### 1. Crie o `docs-meta.json` na raiz do repositório do projeto

```json
{
  "slug": "nome-do-projeto",
  "name": "Nome do Projeto",
  "description": "Descrição curta exibida no card do portal.",
  "status": "active"
}
```

| Campo | Valores possíveis | Descrição |
|-------|------------------|-----------|
| `slug` | string | Identificador único; deve ser igual ao nome do repo |
| `name` | string | Nome exibido no card |
| `description` | string | Descrição curta (1-2 frases) |
| `status` | `active`, `wip`, `soon` | `active` é clicável; `wip` e `soon` aparecem desabilitados |

### 2. Configure o GitHub Pages no projeto

Em **Settings → Pages → Source**, selecione **GitHub Actions**. O projeto será acessível em `docs.techgears.app/nome-do-projeto/` automaticamente.

### 3. Adicione o workflow de deploy ao projeto

Copie o arquivo `.github/workflows/deploy-docs.yml` do repositório [programmable-ecu](https://github.com/TechGearsInteli/programmable-ecu/blob/main/.github/workflows/deploy-docs.yml) e ajuste o `baseUrl` em `docusaurus.config.ts` para `/nome-do-projeto/`.

Inclua o passo de notificação ao portal no final do job `deploy`:

```yaml
- name: Notify docs portal
  continue-on-error: true
  env:
    GH_TOKEN: ${{ secrets.PORTAL_TOKEN }}
  run: |
    gh api repos/TechGearsInteli/TechGearsInteli.github.io/dispatches \
      --field event_type=docs-deployed \
      --field "client_payload[slug]=nome-do-projeto"
```

### 4. Configure o org secret `PORTAL_TOKEN`

O secret precisa ser configurado **uma única vez** em nível de organização para que todos os repositórios o herdem automaticamente:

1. Crie um PAT em [github.com/settings/tokens](https://github.com/settings/tokens) com escopo `repo`
2. Acesse [github.com/organizations/TechGearsInteli/settings/secrets/actions](https://github.com/organizations/TechGearsInteli/settings/secrets/actions)
3. Clique em **New organization secret**, nomeie como `PORTAL_TOKEN`, selecione **All repositories** e salve

---

## Rodando localmente

```bash
npm install
npm run start
```

O portal abre em `http://localhost:3000/`.

Para simular a lista de projetos localmente, edite `src/data/projects.json` diretamente.

---

## Padrão de documentação

O guia completo está em [docs.techgears.app/guia](https://docs.techgears.app/guia). Resumo das regras obrigatórias para páginas `.md` dentro de `docs/`:

- Frontmatter com `title`, `slug` e `sidebar_position`
- Conteúdo dentro de `<div style={{textAlign: 'justify'}}>`
- Parágrafos iniciando com `&emsp;`
- Imagens dentro de `<div align="center">` com **Figura X** e fonte
- Tabelas dentro de `<div align="center">` com **Quadro X** e fonte
- Linguagem formal e impessoal

O lint é executado automaticamente no CI de cada projeto ao abrir um PR.

---

## Licença

Distribuído sob a licença [MIT](https://opensource.org/licenses/MIT).

Copyright © 2026 TechGears Inteli.
