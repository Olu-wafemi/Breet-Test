module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.{test,spec}.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['./tests/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'process.env.NODE_ENV': 'test',
  },
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 }
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true
    }]
  },
  maxWorkers: 1,
  testTimeout: 30000
};



