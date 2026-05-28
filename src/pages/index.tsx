import {useState, useRef, useEffect, type ReactNode} from 'react';
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
  const href  = url ?? `/${slug}/`;
  const label = STATUS_LABEL[status] ?? STATUS_LABEL.soon;
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

function SearchDropdownItem({project}: {project: Project}) {
  const href  = project.url ?? `/${project.slug}/`;
  const label = STATUS_LABEL[project.status] ?? STATUS_LABEL.soon;
  const active = project.status === 'active';

  return (
    <a
      className={`${styles.dropdownItem} ${!active ? styles.dropdownItemDisabled : ''}`}
      href={active ? href : undefined}
      target="_self"
    >
      <div className={styles.dropdownItemContent}>
        <span className={styles.dropdownItemName}>{project.name}</span>
        <span className={`${styles.dropdownTag} ${label.cls}`}>{label.text}</span>
      </div>
      <p className={styles.dropdownItemDesc}>{project.description}</p>
    </a>
  );
}

export default function Home(): ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const allProjects: Project[] = require('../data/projects.json');

  const [query, setQuery]       = useState('');
  const [open, setOpen]         = useState(false);
  const wrapperRef              = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? allProjects.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <Layout title="Projetos" description="Portal de documentação técnica dos projetos da TechGears.">
      <main className={styles.main}>

        {/* Hero with search */}
        <div className={styles.hero}>
          <h1 className={styles.heading}>
            Tech<span className={styles.accent}>Gears</span>
          </h1>
          <p className={styles.subtitle}>
            Portal de documentação técnica dos projetos da TechGears.
          </p>

          <div className={styles.searchWrapper} ref={wrapperRef}>
            <div className={styles.searchForm}>
              <input
                className={styles.searchInput}
                type="search"
                placeholder="Pesquisar projetos..."
                value={query}
                autoComplete="off"
                onChange={e => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
              />
            </div>

            {open && query.trim() && (
              <div className={styles.dropdown}>
                {filtered.length > 0
                  ? filtered.map(p => <SearchDropdownItem key={p.slug} project={p} />)
                  : <p className={styles.dropdownEmpty}>Nenhum projeto encontrado para "{query}"</p>
                }
              </div>
            )}
          </div>
        </div>

        {/* Projects grid — visible on scroll */}
        <div className={styles.projectsSection}>
          <p className={styles.sectionTitle}>Todos os projetos</p>
          <div className={styles.grid}>
            {allProjects.map(p => <ProjectCard key={p.slug} {...p} />)}
            {allProjects.length === 0 && (
              <p className={styles.empty}>Nenhum projeto encontrado.</p>
            )}
          </div>
        </div>

      </main>
    </Layout>
  );
}
