/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
  modulePathIgnorePatterns: [
    '<rootDir>/AI Image_Video Generator',
    '<rootDir>/FigmaMockup',
    '<rootDir>/.next'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/AI Image_Video Generator/',
    '<rootDir>/FigmaMockup/',
    '<rootDir>/.next/',
    '<rootDir>/tests/e2e/' // E2E tests should be run with Playwright, not Jest
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  passWithNoTests: true
};

export default config;

