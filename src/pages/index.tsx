import {useState, type ReactNode} from 'react';
import Layout from '@theme/Layout';
import styles from './index.module.css';

type Project = {
  slug: string;
  name: string;
  description: string;
  status: 'active' | 'wip' | 'soon';
  url?: string;
};

const STATUS_LABEL: Record<string, {text: string; cls: string}> = {
  active: {text: 'Ativo',             cls: styles.tagActive},
  wip:    {text: 'Em desenvolvimento', cls: styles.tagWip},
  soon:   {text: 'Em breve',           cls: styles.tagSoon},
};

function ProjectCard({slug, name, description, status = 'active', url}: Project) {
  const href   = url ?? `/${slug}/`;
  const label  = STATUS_LABEL[status] ?? STATUS_LABEL.soon;
  const active = status === 'active';

  return (
    <a
      className={`${styles.card} ${!active ? styles.cardDisabled : ''}`}
      href={active ? href : undefined}
      target="_self"
    >
      <span className={`${styles.tag} ${label.cls}`}>{label.text}</span>
      <h2 className={styles.cardTitle}>{name}</h2>
      <p className={styles.cardDesc}>{description}</p>
    </a>
  );
}

export default function Home(): ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const allProjects: Project[] = require('../data/projects.json');
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? allProjects.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      )
    : allProjects;

  const handleSearch = (e: {preventDefault: () => void}) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <Layout title="Projetos" description="Portal de documentação técnica dos projetos da TechGears.">
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heading}>
            Tech<span className={styles.accent}>Gears</span>
          </h1>
          <p className={styles.subtitle}>
            Portal de documentação técnica dos projetos da TechGears.
          </p>
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Pesquisar na documentação..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
            />
            <button className={styles.searchBtn} type="submit">
              Pesquisar
            </button>
          </form>
        </div>

        <div className={styles.projectsSection}>
          <h2 className={styles.sectionTitle}>Projetos</h2>
          <div className={styles.grid}>
            {filtered.map(p => <ProjectCard key={p.slug} {...p} />)}
            {filtered.length === 0 && (
              <p className={styles.empty}>Nenhum projeto encontrado.</p>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}
