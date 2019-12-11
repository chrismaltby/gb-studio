module.exports = {
  roots: ["test/"],
  transform: {
    "\\.(ts|js)x?$": ["./test/custom-transformer"],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["jest-extended"],
  verbose: true
};
