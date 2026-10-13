const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
module.exports = createJestConfig({
  // Node environment: the foundation tests render via react-dom/server and
  // test the API client with stubbed fetch — no DOM is required.
  testEnvironment: "node",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
});
