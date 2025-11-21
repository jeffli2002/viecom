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
    '<rootDir>/.next/'
  ],
  passWithNoTests: true
};

export default config;

