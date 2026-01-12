import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
  // ESMモジュール（cheerio等）を変換対象に含める
  transformIgnorePatterns: [
    '/node_modules/(?!(cheerio|htmlparser2|dom-serializer|domutils|domhandler|entities|css-select|css-what|nth-check|boolbase)/)',
  ],
};

export default createJestConfig(config);
