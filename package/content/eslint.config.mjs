import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/__test__/**/*.spec.ts', '**/__test__/**/*.test.ts'],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];
