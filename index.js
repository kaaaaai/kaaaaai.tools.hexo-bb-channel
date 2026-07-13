const { resolveConfig } = require('./src/config');
const { registerGenerator } = require('./src/generator');

const config = resolveConfig(hexo);
registerGenerator(hexo, config);
