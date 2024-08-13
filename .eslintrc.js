module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'no-relative-import-paths', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-relative-import-paths/no-relative-import-paths': [
      'warn',
      {
        allowSameFolder: true,
        prefix: '@src',
        rootDir: 'src',
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@nestjs/config',
            importNames: ['ConfigModule', 'ConfigService'],
            message: 'Please use classes from @src/shared/module/config instead',
          },
        ],
      },
    ],
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          { target: './src/shared', from: './src/module/content*' },
          { target: './src/shared', from: './src/module/identity' },
          { target: './src/shared', from: './src/module/billing' },
          { target: './src/module/content*', from: './src/module/billing' },
          { target: './src/module/content*', from: './src/module/identity' },
          { target: './src/module/billing', from: './src/module/content' },
          { target: './src/module/billing', from: './src/module/identity' },
          { target: './src/module/identity', from: './src/module/content' },
          { target: './src/module/identity', from: './src/module/billing' },
        ],
      },
    ],
  },
};
