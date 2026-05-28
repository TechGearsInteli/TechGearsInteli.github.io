import type {ReactNode} from 'react';
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
    >
      <span className={`${styles.tag} ${label.cls}`}>{label.text}</span>
      <h2 className={styles.cardTitle}>{name}</h2>
      <p className={styles.cardDesc}>{description}</p>
    </a>
  );
}

export default function Home(): ReactNode {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const projects: Project[] = require('../data/projects.json');

  return (
    <Layout title="Projetos" description="Portal de documentação técnica dos projetos da TechGears.">
      <main className={styles.main}>
        <h1 className={styles.heading}>
          Tech<span className={styles.accent}>Gears</span>
        </h1>
        <p className={styles.subtitle}>
          Portal de documentação técnica dos projetos da TechGears.
        </p>
        <div className={styles.grid}>
          {projects.map(p => <ProjectCard key={p.slug} {...p} />)}
          {projects.length === 0 && (
            <p className={styles.empty}>Nenhum projeto encontrado.</p>
          )}
        </div>
      </main>
    </Layout>
  );
}
