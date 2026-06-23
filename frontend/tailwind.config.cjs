module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F6F8FF',
          100: '#E9EEFF',
          300: '#9FB4FF',
          500: '#6366F1',
          700: '#4F46E5'
        },
        secondary: {
          50: '#FFF8F6',
          100: '#FFEFE9',
          300: '#FFB6A2',
          500: '#FF6B4A'
        },
        success: { 500: '#10B981' },
        warning: { 500: '#F59E0B' },
        error: { 500: '#EF4444' }
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px'
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '28px',
        '2xl': '32px',
        pill: '9999px'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      fontSize: {
        h1: ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        h2: ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        h3: ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
        body: ['1rem', { lineHeight: '1.6' }],
        caption: ['0.875rem', { lineHeight: '1.5' }]
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)'
      },
      transitionDuration: {
        xs: '80ms',
        sm: '150ms',
        md: '320ms',
        lg: '500ms'
      },
      boxShadow: {
        'elev-1': '0 1px 2px rgba(12,15,23,0.04), 0 1px 3px rgba(12,15,23,0.06)',
        'elev-2': '0 6px 18px rgba(12,15,23,0.06)',
        'elev-3': '0 20px 40px rgba(12,15,23,0.08)'
      }
    }
  },
  plugins: []
};
