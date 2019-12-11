module.exports = {
  roots: ["<rootDir>/src", "<rootDir>/test"],
  transform: {
    "\\.(ts|js)x?$": ["./test/custom-transformer"]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["jest-extended"],
  collectCoverageFrom: ["src/**/*.{js,jsx,ts,tsx}", "!src/**/*.d.ts"]
};
