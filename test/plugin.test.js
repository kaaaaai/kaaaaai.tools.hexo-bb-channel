const assert = require('node:assert/strict');
const { test } = require('node:test');

const { resolveConfig } = require('../src/config');
const { createBbPages } = require('../src/generator');
const { renderClientContent } = require('../src/render-client');

test('resolveConfig keeps Hexo integration dynamic by default', () => {
  const config = resolveConfig({
    config: {
      bb_channel: {
        route: '/moments',
        title: '闲言碎语',
        description: '这些片段可能来自于大脑皮层短暂兴奋后的捕捉 🤏',
        api_base: 'https://channel.example.com/',
        page_size: 12,
      },
    },
  });

  assert.equal(config.enable, true);
  assert.equal(config.mode, 'client');
  assert.equal(config.route, 'moments/');
  assert.equal(config.title, '闲言碎语');
  assert.equal(config.description, '这些片段可能来自于大脑皮层短暂兴奋后的捕捉 🤏');
  assert.equal(config.apiBase, 'https://channel.example.com');
  assert.equal(config.pageSize, 12);
});

test('renderClientContent outputs a scoped shell and client API fetcher', () => {
  const html = renderClientContent({
    route: 'bb/',
    title: 'moments',
    description: 'microblog',
    apiBase: 'https://channel.example.com',
    pageSize: 20,
  });

  assert.match(html, /class="bb-channel-portable"/);
  assert.match(html, /role="heading" aria-level="1">moments<\/div>/);
  assert.match(html, /data-api-base="https:\/\/channel\.example\.com"/);
  assert.match(html, /fetch\(url\.toString\(\)/);
  assert.match(html, /bb-channel-card-placeholder/);
  assert.doesNotMatch(html, /<h1 class="bb-channel-title"/);
});

test('createBbPages generates a single dynamic route page', () => {
  const pages = createBbPages({
    route: 'bb/',
    title: 'moments',
    description: 'microblog',
    apiBase: 'https://channel.example.com',
    pageSize: 20,
  });

  assert.equal(pages.length, 1);
  assert.equal(pages[0].path, 'bb/index.html');
  assert.equal(pages[0].data.layout, 'page');
  assert.equal(pages[0].data.title, 'moments');
  assert.match(pages[0].data.content, /bb-channel-root/);
});
