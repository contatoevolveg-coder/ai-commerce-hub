import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    '../../apps/web/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        app: '#0B1220',
        surface: '#111827',
        'surface-raised': '#161E2E',
        hover: '#1A2334',
        border: {
          subtle: '#1E293B',
          strong: '#334155',
        },
        primary: {
          text: '#F8FAFC',
          DEFAULT: '#3B82F6',
        },
        body: '#CBD5E1',
        muted: '#64748B',
        ai: '#8B5CF6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '4px': '4px',
        '8px': '8px',
        '12px': '12px',
        '16px': '16px',
        '24px': '24px',
        '32px': '32px',
        '48px': '48px',
        '64px': '64px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        full: '999px',
      },
    },
  },
  plugins: [],
};

export default config;
