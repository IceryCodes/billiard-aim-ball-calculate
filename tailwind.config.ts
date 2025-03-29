import type { Config } from 'tailwindcss';

export const headerHeight: number = 60;

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/global-components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        backgroundLight: 'var(--backgroundLight)',
        foreground: 'var(--foreground)',
        link: 'var(--link)',
      },
      height: {
        header: `${headerHeight}px`,
        content: `calc(100vh - ${headerHeight}px)`,
      },
      inset: {
        header: `${headerHeight}px`,
      },
      maxHeight: {
        content: `calc(100vh - ${headerHeight}px)`,
      },
      margin: {
        header: `${headerHeight}px`,
      },
    },
  },
  plugins: [],
};
export default config;
