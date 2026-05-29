import {themes as prismThemes} from 'prism-react-renderer';
import {existsSync} from 'fs';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import projects from './src/data/projects.json';

type Project = {slug: string; name: string; status?: string; url?: string; repoName?: string};

const projectNavItems = (projects as Project[])
  .filter(p => p.status === 'active' || p.status === 'wip' || !p.status)
  .map(p => ({
    label: p.name,
    to: `/${p.slug}/`,
  }));

const projectDocPlugins: Config['plugins'] = (projects as Project[])
  .filter(p => existsSync(`./project-docs/${p.slug}`))
  .map(p => [
    '@docusaurus/plugin-content-docs',
    {
      id: p.slug,
      path: `./project-docs/${p.slug}`,
      routeBasePath: `/${p.slug}`,
      sidebarPath: require.resolve('./sidebars-projects.ts'),
    },
  ]);

const config: Config = {
  title: 'TechGears Docs',
  tagline: 'Documentação técnica dos projetos da TechGears',
  favicon: 'img/favicon.png',

  future: { v4: true },

  storage: {
    namespace: 'tg-docs',
  },

  url: 'https://docs.techgears.app',
  baseUrl: '/',

  organizationName: 'TechGearsInteli',
  projectName: 'TechGearsInteli.github.io',
  trailingSlash: false,

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  markdown: { mermaid: true },

  plugins: projectDocPlugins,

  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['pt'],
        indexBlog: false,
        docsRouteBasePath: '/',
        searchResultLimits: 8,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/TechGearsInteli/TechGearsInteli.github.io/edit/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: '',
      style: 'dark',
      logo: {
        alt: 'TechGears',
        src: 'img/techgears-logo.png',
        href: 'https://techgears.app',
        target: '_blank',
      },
      items: [
        {
          to: '/',
          label: 'Home',
          position: 'left',
          exact: true,
        },
        {
          to: '/category/guia-de-uso',
          label: 'Guia',
          position: 'left',
        },
        ...(projectNavItems.length > 0 ? [{
          label: 'Projetos',
          position: 'left' as const,
          items: projectNavItems,
        }] : []),
      ],
    },
    footer: undefined,
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['bash', 'json', 'c', 'cpp'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
