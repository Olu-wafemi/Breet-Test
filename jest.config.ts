import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.{test,spec}.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['./tests/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'process.env.NODE_ENV': 'test'
  },
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 }
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}],
  },
  maxWorkers: 1,
  testTimeout: 30000
};

export default config; 