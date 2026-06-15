module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
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
        pill: '9999px'
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
