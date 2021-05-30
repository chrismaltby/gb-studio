const tsJest = require('ts-jest');

module.exports = {
  process(src, filename, ...rest) {
    const transformedContent = src
        .replace(/__non_webpack_require__/g, "require");
    return tsJest.process(transformedContent, filename, ...rest);
  },
};
