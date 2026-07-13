const { renderClientContent } = require('./render-client');

function createBbPages(config) {
  if (config.enable === false || (config.mode || 'client') !== 'client') return [];
  return [{
    path: `${config.route}index.html`,
    layout: 'page',
    data: {
      title: config.title,
      description: config.description,
      comments: true,
      content: renderClientContent(config),
    },
  }];
}

function registerGenerator(hexo, config) {
  hexo.extend.generator.register('bb-channel', () => createBbPages(config));
}

module.exports = {
  createBbPages,
  registerGenerator,
};
