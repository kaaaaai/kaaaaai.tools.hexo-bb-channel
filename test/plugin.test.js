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
  assert.match(html, /data-pjax/);
  assert.match(html, /window\.initBbChannel/);
  assert.match(html, /bb-channel-attachments/);
  assert.match(html, /bb-channel-attachment-title/);
  assert.match(html, /bb-channel-lucide-file/);
  assert.match(html, /bb-channel-media-rail/);
  assert.match(html, /bb-channel-image-viewer/);
  assert.match(html, /bb-channel-image-track/);
  assert.match(html, /bb-channel-image-slide/);
  assert.match(html, /bb-channel-image-skeleton/);
  assert.match(html, /data-bb-image-url/);
  assert.match(html, /bb-channel-image-large/);
  assert.match(html, /font-family:var\(--bb-channel-title-font,inherit\)/);
  assert.match(html, /font-size:1\.72rem/);
  assert.doesNotMatch(html, /font-size:clamp\(2rem,4\.8vw,3\.5rem\)/);
  assert.match(html, /font-family:var\(--bb-channel-content-font,inherit\)/);
  assert.match(html, /letter-spacing:0/);
  assert.match(html, /letter-spacing:\.01em/);
  assert.match(html, /text-rendering:optimizeLegibility/);
  assert.match(html, /closest\('\.bb-channel-image-large'\)/);
  assert.match(html, /data-bb-viewer-open/);
  assert.match(html, /data-bb-viewer-closing/);
  assert.match(html, /bbViewerClosing/);
  assert.match(html, /preserveCardViewportPosition/);
  assert.match(html, /focus\(\{ preventScroll: true \}\)/);
  assert.match(html, /positionImageTrack/);
  assert.match(html, /useSmoothScroll/);
  assert.match(html, /behavior: useSmoothScroll \? 'smooth' : 'auto'/);
  assert.match(html, /setupMobileActiveCard/);
  assert.match(html, /IntersectionObserver/);
  assert.match(html, /calculateCardVisibleArea/);
  assert.match(html, /calculateCardVisibleRatio/);
  assert.match(html, /calculateCardActiveDistance/);
  assert.match(html, /viewportActiveLine/);
  assert.match(html, /getBoundingClientRect\(\)/);
  assert.match(html, /window\.addEventListener\('scroll', scheduleMobileActiveCardUpdate/);
  assert.match(html, /window\.addEventListener\('resize', scheduleMobileActiveCardUpdate/);
  assert.doesNotMatch(html, /activeArea/);
  assert.match(html, /data-bb-card-active/);
  assert.match(html, /matchMedia\('\(max-width: 640px\)'\)/);
  assert.match(html, /data-bb-media-index/);
  assert.match(html, /hydrateImages/);
  assert.match(html, /track\.scrollTo/);
  assert.doesNotMatch(html, /scrollIntoView/);
  assert.match(html, /scroll-snap-type:x mandatory/);
  assert.match(html, /object-fit:contain/);
  assert.match(html, /border:1px dashed #d9d9d9/);
  assert.match(html, /aspect-ratio:16\/10/);
  assert.match(html, /cursor:zoom-out/);
  assert.match(html, /max-height:0/);
  assert.match(html, /max-height:calc\(68vh \+ 4rem\)/);
  assert.match(html, /overflow:hidden/);
  assert.match(html, /transform:translateY\(14px\)/);
  assert.match(html, /transition:max-height 420ms cubic-bezier\(\.22,1,\.36,1\),opacity 420ms cubic-bezier\(\.22,1,\.36,1\),transform 420ms cubic-bezier\(\.22,1,\.36,1\)/);
  assert.match(html, /data-bb-viewer-open="true"\] \.bb-channel-media-rail\{max-height:0;opacity:0/);
  assert.match(html, /data-bb-viewer-open="true"\] \.bb-channel-image-viewer\{margin-top:\.7rem/);
  assert.match(html, /@media\(max-width:640px\)/);
  assert.match(html, /data-bb-card-active="true"\]\{transform:translate\(4px,-5px\)/);
  assert.match(html, /data-bb-viewer-open="true"\]\{transform:none/);
  assert.match(html, /justify-self:center/);
  assert.match(html, /bb-channel-feed::before/);
  assert.match(html, /bb-channel-tags span/);
  assert.match(html, /bb-channel-card-placeholder/);
  assert.doesNotMatch(html, /data-bb-viewer-open="true"\] \.bb-channel-media-rail\{display:none\}/);
  assert.doesNotMatch(html, /<h1 class="bb-channel-title"/);
  assert.doesNotMatch(html, /bb-channel-attachment-icon::after/);
  assert.doesNotMatch(html, /bb-channel-attachment-open/);
  assert.doesNotMatch(html, /bb-channel-card-more/);
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
  assert.equal(pages[0].layout, 'page');
  assert.equal(pages[0].data.title, 'moments');
  assert.equal(pages[0].data.comments, true);
  assert.match(pages[0].data.content, /bb-channel-root/);
});
