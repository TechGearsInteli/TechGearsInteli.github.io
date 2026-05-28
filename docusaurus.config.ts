import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'TechGears Docs',
  tagline: 'Documentação técnica dos projetos da TechGears',
  favicon: 'img/favicon.png',

  future: { v4: true },

  url: 'https://docs.techgears.app',
  baseUrl: '/',

  organizationName: 'TechGearsInteli',
  projectName: 'TechGearsInteli.github.io',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  markdown: { mermaid: true },
  themes: ['@docusaurus/theme-mermaid'],

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
      items: [],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Projetos',
          items: [
            {label: 'Programmable ECU', href: 'https://docs.techgears.app/programmable-ecu/'},
          ],
        },
        {
          title: 'TechGears',
          items: [
            {label: 'Site', href: 'https://techgears.app'},
            {label: 'GitHub', href: 'https://github.com/TechGearsInteli'},
            {label: 'Instagram', href: 'https://www.instagram.com/tech.gears01/'},
            {label: 'LinkedIn', href: 'https://www.linkedin.com/company/tech-gears01/'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TechGears Inteli. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
