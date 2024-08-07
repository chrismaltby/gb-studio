module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/test"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["jest-extended", "./test/setup.ts"],
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"],
  transform: {
    "\\.[jt]sx?$": "ts-jest",
  },
  moduleNameMapper: {
    // Mocks
    "^!!raw-loader!(.*)\\.css$": "<rootDir>/test/__mocks__/styleMock.js",
    "^renderer/lib/api": "<rootDir>/test/__mocks__/apiMock.ts",
    // Event imports
    "^../helpers/l10n$": "<rootDir>/src/shared/lib/lang/l10n.ts",
    // Path aliases
    consts: "<rootDir>/src/consts.ts",
    "^store/(.*)$": "<rootDir>/src/store/$1",
    "^components/(.*)$": "<rootDir>/src/components/$1",
    "^lang/(.*)$": "<rootDir>/src/lang/$1",
    "^lib/(.*)$": "<rootDir>/src/lib/$1",
    "^ui(.*)$": "<rootDir>/src/components/ui/$1",
    "^renderer(.*)$": "<rootDir>/src/renderer/$1",
    "^shared(.*)$": "<rootDir>/src/shared/$1",
    "patrons.json": "<rootDir>/patrons.json",
  },
};
