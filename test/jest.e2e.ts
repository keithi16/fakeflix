import config from './jest.shared';

export default {
  ...config,
  rootDir: '..',
  testMatch: ['<rootDir>/src/**/__test__/e2e/**/*.spec.ts'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
};
