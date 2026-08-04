import { createPreset } from 'fumadocs-ui/tailwind-plugin';

// Matches Omniplex's default look (src/app/globals.css): zinc neutrals with
// an indigo (#6366f1) brand accent, before any per-user accent/font
// customization. HSL triples, per fumadocs' preset format.
const omniplexPreset = {
  light: {
    background: '0 0% 100%',
    foreground: '240 10% 3.9%',
    muted: '240 5% 96%',
    'muted-foreground': '240 4% 46%',
    popover: '0 0% 100%',
    'popover-foreground': '240 10% 3.9%',
    card: '0 0% 100%',
    'card-foreground': '240 10% 3.9%',
    border: '240 6% 90%',
    primary: '239 84% 67%',
    'primary-foreground': '0 0% 100%',
    secondary: '240 5% 96%',
    'secondary-foreground': '240 10% 3.9%',
    accent: '240 6% 90%',
    'accent-foreground': '240 10% 3.9%',
    ring: '239 84% 67%',
  },
  dark: {
    background: '240 10% 3.9%',
    foreground: '0 0% 98%',
    muted: '240 6% 10%',
    'muted-foreground': '240 5% 65%',
    popover: '240 6% 10%',
    'popover-foreground': '0 0% 98%',
    card: '240 6% 10%',
    'card-foreground': '0 0% 98%',
    border: '240 4% 16%',
    primary: '239 84% 67%',
    'primary-foreground': '0 0% 100%',
    secondary: '240 4% 16%',
    'secondary-foreground': '0 0% 98%',
    accent: '240 4% 16%',
    'accent-foreground': '0 0% 98%',
    ring: '239 84% 67%',
  },
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
    './mdx-components.{ts,tsx}',
    './node_modules/fumadocs-ui/dist/**/*.js',
    './node_modules/fumadocs-openapi/dist/**/*.js',
  ],
  presets: [createPreset({ preset: omniplexPreset })],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
};
