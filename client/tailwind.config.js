/**
 * Tailwind CSS configuration
 * - Scans the specified content files for class usage
 * - Extends the theme with custom color tokens and shadows
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // CSS Variable-based colors for automotive theme
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          glow: 'hsl(var(--primary-glow))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        // Legacy colors for backward compatibility
        bg: '#0b1020',
        surface: '#10182a',
        glass: 'rgba(255, 255, 255, 0.06)',
        accent2: '#38e8fc',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(2, 6, 23, 0.7)',
        glass: '0 6px 18px rgba(2, 6, 23, 0.5)',
        glow: 'var(--shadow-glow)',
        automotive: 'var(--shadow-automotive)',
      },
      backgroundImage: {
        'automotive-gradient': 'var(--gradient-primary)',
        'hero-gradient': 'var(--gradient-hero)',
      },
      animation: {
        'engine-pulse': 'engine-pulse 2s ease-in-out infinite',
        'gear-rotate': 'gear-rotate 8s linear infinite',
      },
      keyframes: {
        'engine-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'gear-rotate': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};