const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  createDeepLinkController,
  normalizePage,
  readDeepLink,
} = require('../src/deep-link');

function createElement() {
  const attributes = new Map();
  return {
    attributes,
    focusOptions: null,
    scrollOptions: null,
    contains(element) {
      return element === this.card;
    },
    focus(options) {
      this.focusOptions = options;
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    hasAttribute(name) {
      return attributes.has(name);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    scrollIntoView(options) {
      this.scrollOptions = options;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
  };
}

function createHarness(path = '/bb/') {
  const cards = new Map();
  const feed = createElement();
  const root = createElement();
  const listeners = new Map();
  const animationFrames = new Map();
  const timers = new Map();
  const loadedPages = [];
  let nextFrame = 1;
  let nextTimer = 1;
  let reducedMotion = false;
  let currentUrl = new URL(path, 'https://blog.example.com');
  let pushedUrl = '';

  const location = {};
  for (const key of ['href', 'pathname', 'search', 'hash']) {
    Object.defineProperty(location, key, { get: () => currentUrl[key] });
  }

  const browser = {
    document: {
      getElementById(id) {
        return cards.get(id) || null;
      },
    },
    history: {
      pushState(_state, _title, url) {
        pushedUrl = String(url);
        currentUrl = new URL(url, currentUrl);
      },
    },
    location,
    cancelAnimationFrame(id) {
      animationFrames.delete(id);
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    getComputedStyle(element) {
      return { visibility: element.visibility || 'visible' };
    },
    matchMedia() {
      return { matches: reducedMotion };
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    requestAnimationFrame(callback) {
      const id = nextFrame++;
      animationFrames.set(id, callback);
      return id;
    },
    setTimeout(callback) {
      const id = nextTimer++;
      timers.set(id, callback);
      return id;
    },
  };

  return {
    browser,
    feed,
    loadedPages,
    listeners,
    options: {
      feed,
      root,
      async loadPage(page, isCurrent) {
        loadedPages.push({ page, isCurrent });
        return isCurrent();
      },
    },
    root,
    addCard(id) {
      const card = createElement();
      cards.set(id, card);
      feed.card = card;
      return card;
    },
    get pushedUrl() {
      return pushedUrl;
    },
    runTimers() {
      [...timers.values()].forEach(callback => callback());
      timers.clear();
    },
    runAnimationFrames() {
      const callbacks = [...animationFrames.values()];
      animationFrames.clear();
      callbacks.forEach(callback => callback());
    },
    setLocation(nextPath) {
      currentUrl = new URL(nextPath, currentUrl);
    },
    setReducedMotion(value) {
      reducedMotion = value;
    },
  };
}

test('normalizes page numbers and reads BB targets', () => {
  assert.equal(normalizePage('3'), 3);
  for (const value of [undefined, '', '0', '-2', '1.5', 'nope']) {
    assert.equal(normalizePage(value), 1);
  }
  assert.deepEqual(readDeepLink({ search: '?page=4', hash: '#bb-42' }), {
    page: 4,
    targetId: 'bb-42',
  });
  assert.equal(readDeepLink({ search: '', hash: '#comments' }).targetId, '');
  assert.equal(readDeepLink({ search: '?page=2', hash: '#bb-%E0%A4%A' }).targetId, 'bb-%E0%A4%A');
});

test('loads the URL page then reveals and clears its target', async () => {
  const harness = createHarness('/bb/?page=2#bb-42');
  const card = harness.addCard('bb-42');
  const controller = createDeepLinkController(harness.browser, harness.options);

  await controller.start();

  assert.deepEqual(harness.loadedPages.map(item => item.page), [2]);
  assert.deepEqual(card.scrollOptions, { behavior: 'smooth', block: 'center' });
  assert.equal(card.attributes.get('data-bb-deep-link-active'), 'true');
  assert.deepEqual(card.focusOptions, { preventScroll: true });
  assert.equal(card.attributes.get('tabindex'), '-1');

  harness.runTimers();
  assert.equal(card.attributes.has('data-bb-deep-link-active'), false);
  assert.equal(card.attributes.has('tabindex'), false);
});

test('uses immediate scrolling when reduced motion is requested', async () => {
  const harness = createHarness('/bb/?page=1#bb-7');
  harness.setReducedMotion(true);
  const card = harness.addCard('bb-7');

  await createDeepLinkController(harness.browser, harness.options).start();

  assert.equal(card.scrollOptions.behavior, 'auto');
});

test('defers initial focus until the document finishes loading', async () => {
  const harness = createHarness('/bb/?page=1#bb-7');
  harness.browser.document.readyState = 'loading';
  const card = harness.addCard('bb-7');

  await createDeepLinkController(harness.browser, harness.options).start();

  assert.equal(card.focusOptions, null);
  harness.listeners.get('load')();
  assert.deepEqual(card.focusOptions, { preventScroll: true });
});

test('waits for a NexT motion-hidden card to become visible before focusing', async () => {
  const harness = createHarness('/bb/?page=1#bb-7');
  const card = harness.addCard('bb-7');
  card.visibility = 'hidden';

  await createDeepLinkController(harness.browser, harness.options).start();

  assert.equal(card.focusOptions, null);
  card.visibility = 'visible';
  harness.runAnimationFrames();
  assert.deepEqual(card.focusOptions, { preventScroll: true });
});

test('pushes pagination history without an old hash', async () => {
  const harness = createHarness('/bb/?filter=notes&page=2#bb-42');
  const controller = createDeepLinkController(harness.browser, harness.options);

  await controller.goToPage(3);

  assert.equal(harness.pushedUrl, '/bb/?filter=notes&page=3');
  assert.deepEqual(harness.loadedPages.map(item => item.page), [3]);
  assert.deepEqual(harness.root.scrollOptions, { behavior: 'smooth', block: 'start' });
});

test('registers history listeners and restores the latest navigation only', async () => {
  const harness = createHarness('/bb/?page=1#bb-1');
  const pending = [];
  harness.options.loadPage = (page, isCurrent) => new Promise(resolve => {
    pending.push({ page, isCurrent, resolve });
  });
  const firstCard = harness.addCard('bb-1');
  const controller = createDeepLinkController(harness.browser, harness.options);

  const first = controller.start();
  assert.equal(typeof harness.listeners.get('popstate'), 'function');
  assert.equal(typeof harness.listeners.get('hashchange'), 'function');

  harness.setLocation('/bb/?page=2#bb-2');
  const secondCard = harness.addCard('bb-2');
  const second = controller.restore();

  assert.equal(pending[0].isCurrent(), false);
  assert.equal(pending[1].isCurrent(), true);
  pending[1].resolve(true);
  await second;
  pending[0].resolve(false);
  await first;

  assert.equal(secondCard.attributes.get('data-bb-deep-link-active'), 'true');
  assert.equal(firstCard.attributes.has('data-bb-deep-link-active'), false);
});

test('missing targets stay silent and destroy removes listeners', async () => {
  const harness = createHarness('/bb/?page=5#bb-missing');
  const controller = createDeepLinkController(harness.browser, harness.options);

  await controller.start();
  controller.destroy();

  assert.deepEqual(harness.loadedPages.map(item => item.page), [5]);
  assert.equal(harness.listeners.size, 0);
});
