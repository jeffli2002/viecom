/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
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

