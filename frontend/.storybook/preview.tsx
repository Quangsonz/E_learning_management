import React from 'react';
import '../src/styles/tokens.css';
import '../src/styles/components.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' }
};

export const decorators = [
  (Story) => (
    <div style={{ padding: 20, background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Story />
    </div>
  )
];
