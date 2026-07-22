# BB Deep Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add asynchronous `?page=N#bb-ID` navigation to `hexo-bb-channel`, then make the Blog homepage random-BB entry consume that explicit protocol.

**Architecture:** A browser-compatible controller in `src/deep-link.js` owns parsing, history, navigation sequencing, focus, scrolling, and temporary selected-card state. `src/render-client.js` embeds it and connects it to the existing renderer. The Blog only constructs the destination URL.

**Tech Stack:** Node.js CommonJS, Node test runner, generated browser JavaScript, History API, Hexo 7, NexT 8.

## Global Constraints

- Canonical links use `/bb/?page=N#bb-ID`; invalid pages resolve to page 1.
- Unknown targets stay silent and never trigger cross-page searching.
- Deep-link highlighting reuses the current selected-card treatment for 2.4 seconds.
- Pagination updates history; Back and Forward restore timeline state.
- Reduced motion keeps the visible treatment but disables smooth movement.
- No new runtime dependency and no TODO/design content in the Blog repository.

---

### Task 1: Browser-compatible deep-link controller

**Files:**
- Create: `src/deep-link.js`
- Create: `test/deep-link.test.js`

**Interfaces:**
- Produces: `normalizePage(value): number`.
- Produces: `readDeepLink(location): { page: number, targetId: string }`.
- Produces: `createDeepLinkController(browser, options)` with `start()`, `goToPage(page)`, `restore()`, and `destroy()`.
- Consumes: `options.loadPage(page): Promise<void>`, `options.root`, `options.feed`, and `options.highlightDuration`.

- [ ] **Step 1: Write failing parsing tests**

```js
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { normalizePage, readDeepLink } = require('../src/deep-link');

test('normalizes pages and reads BB targets', () => {
  assert.equal(normalizePage('3'), 3);
  for (const value of [undefined, '', '0', '-2', '1.5', 'nope']) {
    assert.equal(normalizePage(value), 1);
  }
  assert.deepEqual(readDeepLink({ search: '?page=4', hash: '#bb-42' }), {
    page: 4,
    targetId: 'bb-42',
  });
  assert.equal(readDeepLink({ search: '', hash: '#comments' }).targetId, '');
});
```

- [ ] **Step 2: Run `node --test test/deep-link.test.js` and verify RED**

Expected: FAIL because `../src/deep-link` does not exist.

- [ ] **Step 3: Implement URL parsing**

```js
function normalizePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function readDeepLink(location = {}) {
  const params = new URLSearchParams(location.search || '');
  const rawHash = String(location.hash || '').replace(/^#/, '');
  let hash = rawHash;
  try {
    hash = decodeURIComponent(rawHash);
  } catch {}
  return {
    page: normalizePage(params.get('page')),
    targetId: hash.startsWith('bb-') ? hash : '',
  };
}
```

- [ ] **Step 4: Add failing controller behavior tests**

Create a fake browser/root/feed/card harness and assert these behaviors using real controller calls:

```js
test('loads then reveals and clears the URL target', async () => {
  const harness = createHarness('/bb/?page=2#bb-42');
  const controller = createDeepLinkController(harness.browser, harness.options);
  await controller.start();
  assert.deepEqual(harness.loadedPages, [2]);
  assert.deepEqual(harness.card.scrollOptions, { behavior: 'smooth', block: 'center' });
  assert.equal(harness.card.attributes['data-bb-deep-link-active'], 'true');
  assert.deepEqual(harness.card.focusOptions, { preventScroll: true });
  harness.runTimers();
  assert.equal(harness.card.attributes['data-bb-deep-link-active'], undefined);
});

test('pushes page history without an old hash', async () => {
  const harness = createHarness('/bb/?page=2#bb-42');
  await createDeepLinkController(harness.browser, harness.options).goToPage(3);
  assert.equal(harness.pushedUrl, '/bb/?page=3');
  assert.deepEqual(harness.loadedPages, [3]);
  assert.equal(harness.rootScrolled, true);
});
```

Also test: `popstate` restoration; hash-only restoration; missing targets; reduced-motion `behavior: 'auto'`; and two deferred loads completing out of order, where only the newest navigation may reveal a card.

- [ ] **Step 5: Run the controller test and verify RED**

Expected: parsing passes; behavior tests FAIL because the controller is not exported.

- [ ] **Step 6: Implement the minimal controller**

Use a monotonically increasing `navigationId`. Each `renderLocation()` reads the URL, awaits `options.loadPage(page)`, and aborts post-render work if its ID is stale. `revealTarget()` uses `browser.document.getElementById(targetId)` plus `feed.contains(card)` for exact, selector-safe lookup; it applies `data-bb-deep-link-active`, temporarily adds `tabindex="-1"`, scrolls, focuses with `preventScroll`, and cleans up after `highlightDuration || 2400`.

`goToPage()` preserves unrelated query parameters, sets `page`, clears the hash, calls `history.pushState`, and renders with the timeline root scroll enabled. `start()` registers `popstate` and `hashchange`; `destroy()` removes them and clears the highlight timer.

- [ ] **Step 7: Run `npm test` and commit**

Expected: every plugin test passes.

```bash
git add src/deep-link.js test/deep-link.test.js
git commit -m "feat: add BB deep-link controller"
```

---

### Task 2: Connect the controller to generated plugin output

**Files:**
- Modify: `src/render-client.js`
- Modify: `test/plugin.test.js`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: `normalizePage`, `readDeepLink`, and `createDeepLinkController` from `src/deep-link.js`, embedded with `toString()` so the browser factory has all of its module-scope dependencies.
- Produces: pagination routed through `deepLinkController.goToPage(page)`.

- [ ] **Step 1: Add failing generated-client assertions**

```js
assert.match(html, /createDeepLinkController/);
assert.match(html, /data-bb-deep-link-active/);
assert.match(html, /deepLinkController\.goToPage/);
assert.match(html, /popstate/);
assert.doesNotMatch(html, /loadPage\(\)\.catch/);
```

- [ ] **Step 2: Run `node --test test/plugin.test.js` and verify RED**

Expected: FAIL on missing controller output.

- [ ] **Step 3: Embed and connect the controller**

Import all three deep-link functions at module scope. Embed and instantiate them after `loadPage` is defined:

```js
const normalizePage = ${normalizePage.toString()};
const readDeepLink = ${readDeepLink.toString()};
const createDeepLinkController = ${createDeepLinkController.toString()};
const deepLinkController = createDeepLinkController(window, {
  root,
  feed,
  loadPage,
  highlightDuration: 2400,
});
```

Route pager clicks to `goToPage`, replace the unconditional initial `loadPage()` with `start()`, and retain existing status error reporting.

Add `data-bb-deep-link-active="true"` beside both `data-bb-card-active="true"` selectors for placeholder and surface styles. Add it to the reduced-motion transform rule too, so the exact visual treatment is shared.

- [ ] **Step 4: Document the URL contract**

In both READMEs document `/bb/?page=2#bb-123`, history behavior, async positioning, and silent missing targets. Add an Unreleased changelog entry.

- [ ] **Step 5: Run `npm test && git diff --check` and commit**

```bash
git add src/render-client.js test/plugin.test.js README.md README.zh-CN.md CHANGELOG.md
git commit -m "feat: support BB deep links"
```

---

### Task 3: Formalize the Blog consumer

**Files:**
- Modify: `/Users/kaaaaai/Documents/KaiLab/worktrees/blog-bb-home-random/source/js/home-bb-random.js`
- Modify: `/Users/kaaaaai/Documents/KaiLab/worktrees/blog-bb-home-random/test/home-bb-random.test.js`

**Interfaces:**
- Consumes: `/bb/?page=N#bb-ID`.
- Produces: `buildBbDeepLink(bbPath, id, page = 1)`.

- [ ] **Step 1: Extend the Blog test first**

```js
test('buildBbDeepLink serializes the plugin page contract', () => {
  assert.equal(homeBbRandom.buildBbDeepLink('/bb/', '17', 2), '/bb/?page=2#bb-17');
  assert.equal(homeBbRandom.buildBbDeepLink('/moments/', 'a/b', 0), '/moments/?page=1#bb-a%2Fb');
});
```

- [ ] **Step 2: Run `npm run test:home-bb` and verify RED**

Expected: FAIL because the page argument is ignored.

- [ ] **Step 3: Generalize the builder**

```js
function buildBbDeepLink(bbPath, id, page = 1) {
  const value = Number(page);
  const normalizedPage = Number.isInteger(value) && value > 0 ? value : 1;
  return String(bbPath || '/bb/').replace(/[?#].*$/, '')
    + '?page=' + normalizedPage + '#bb-' + encodeURIComponent(id);
}
```

Call the builder explicitly with page 1 from `initHomeBbRandom`; the random API currently samples only its first page.

- [ ] **Step 4: Run `npm run test:home-bb && git diff --check` and commit**

```bash
git add source/js/home-bb-random.js test/home-bb-random.test.js
git commit -m "Refine random BB deep links"
```

---

### Task 4: Local integration and final verification

**Files:**
- Modify temporarily: Blog `node_modules/hexo-bb-channel` via a local `--no-save` install.
- Modify: `/Users/kaaaaai/Documents/KaiLab/BB-TODO.md`

**Interfaces:**
- Consumes: completed plugin and Blog branches.
- Produces: verified generated `/bb/` and completed deep-link TODO.

- [ ] **Step 1: Install the plugin worktree without saving**

Run from Blog worktree:

```bash
npm install --no-save /Users/kaaaaai/Documents/KaiLab/worktrees/hexo-bb-channel-deep-links
```

Verify package manifests and lockfiles remain unchanged.

- [ ] **Step 2: Run Blog clean-build verification**

```bash
npm run test:home-bb
npm run clean
npm run build
```

Expected: tests and build pass; generated `/bb/index.html` contains the controller and root `/index.html` contains the random-BB bootstrap.

- [ ] **Step 3: Run browser integration checks**

Verify initial page/hash loading, exact target focus, shared selected-card appearance, 2.4-second cleanup, pagination URL updates, Back restoration, reduced motion, unknown targets, and homepage-to-BB navigation.

- [ ] **Step 4: Mark only the deep-link item complete in `BB-TODO.md`**

Change the first checkbox to `[x]`; leave theming consolidation unchecked.

- [ ] **Step 5: Restore normal dependencies and run fresh final verification**

Plugin worktree:

```bash
npm test
git diff --check
test -z "$(git status --short)"
```

Blog worktree:

```bash
npm run test:home-bb
npm run clean
npm run build
git diff --check
```

Expected: all tests and clean Hexo build pass; no local file dependency is committed.
