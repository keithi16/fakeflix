export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/e2e/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/../src/$1',
  },
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};
