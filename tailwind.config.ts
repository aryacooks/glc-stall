import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F2EB',
        'canvas-card': '#FAF8F3',
        'canvas-hover': '#ECE8DE',
        ink: {
          900: '#151515',
          800: '#222222',
          700: '#3D3D3D',
          500: '#6B6B6B',
          400: '#9E9E9E',
          200: '#D9D5CC',
          100: '#ECE8DF',
        },
        terracotta: {
          DEFAULT: '#D96E3D',
          hover: '#C85E2F',
          light: '#F8E8DF',
          dark: '#B04B1F',
        },
        retroGreen: {
          DEFAULT: '#2F6B55',
          light: '#E1EFEA',
        }
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Fraunces', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #1A1A1A',
        'brutal': '3px 3px 0px #1A1A1A',
        'brutal-lg': '5px 5px 0px #1A1A1A',
        'brutal-pressed': '1px 1px 0px #1A1A1A',
      },
    },
  },
  plugins: [],
}
export default config
