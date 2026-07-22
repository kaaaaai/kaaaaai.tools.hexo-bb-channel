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

function createDeepLinkController(browser, options) {
  let activeCard = null;
  let activeCardHadTabindex = false;
  let activeCardTabindex = null;
  let focusAttempts = 0;
  let focusRetryTimer = 0;
  let highlightTimer = 0;
  let lastLocationKey = '';
  let navigationId = 0;
  let pendingFocus = null;
  let started = false;

  const motionBehavior = () => {
    const query = browser.matchMedia && browser.matchMedia('(prefers-reduced-motion: reduce)');
    return query && query.matches ? 'auto' : 'smooth';
  };

  const clearHighlight = () => {
    if (pendingFocus) {
      browser.removeEventListener('load', pendingFocus);
      pendingFocus = null;
    }
    if (focusRetryTimer) {
      browser.clearTimeout(focusRetryTimer);
      focusRetryTimer = 0;
    }
    if (highlightTimer) {
      browser.clearTimeout(highlightTimer);
      highlightTimer = 0;
    }
    if (!activeCard) return;
    activeCard.removeAttribute('data-bb-deep-link-active');
    if (activeCardHadTabindex) {
      activeCard.setAttribute('tabindex', activeCardTabindex);
    } else {
      activeCard.removeAttribute('tabindex');
    }
    activeCard = null;
    activeCardHadTabindex = false;
    activeCardTabindex = null;
  };

  const revealTarget = (targetId) => {
    clearHighlight();
    const card = browser.document.getElementById(targetId);
    if (!card || !options.feed.contains(card)) return false;

    activeCard = card;
    activeCardHadTabindex = card.hasAttribute('tabindex');
    activeCardTabindex = card.getAttribute('tabindex');
    card.setAttribute('data-bb-deep-link-active', 'true');
    card.setAttribute('tabindex', '-1');
    card.scrollIntoView({ behavior: motionBehavior(), block: 'center' });
    focusAttempts = 0;
    const focusTarget = () => {
      pendingFocus = null;
      focusRetryTimer = 0;
      if (activeCard !== card) return;
      const style = browser.getComputedStyle && browser.getComputedStyle(card);
      if (style && style.visibility === 'hidden' && focusAttempts < 40) {
        focusAttempts += 1;
        focusRetryTimer = browser.setTimeout(focusTarget, 50);
        return;
      }
      try {
        card.focus({ preventScroll: true });
      } catch {
        card.focus();
      }
      highlightTimer = browser.setTimeout(clearHighlight, options.highlightDuration || 2400);
    };
    if (browser.document.readyState === 'loading') {
      pendingFocus = focusTarget;
      browser.addEventListener('load', focusTarget, { once: true });
    } else {
      focusTarget();
    }
    return true;
  };

  const renderLocation = async ({ scrollRoot = false } = {}) => {
    const currentId = ++navigationId;
    const state = readDeepLink(browser.location);
    const isCurrent = () => currentId === navigationId;
    const loaded = await options.loadPage(state.page, isCurrent);
    if (loaded === false || !isCurrent()) return false;
    if (scrollRoot) {
      options.root.scrollIntoView({ behavior: motionBehavior(), block: 'start' });
    }
    if (state.targetId) revealTarget(state.targetId);
    return true;
  };

  const restore = ({ force = false, scrollRoot = false } = {}) => {
    const locationKey = browser.location.href;
    if (!force && locationKey === lastLocationKey) return Promise.resolve(false);
    lastLocationKey = locationKey;
    return renderLocation({ scrollRoot }).catch(error => {
      if (lastLocationKey === locationKey) lastLocationKey = '';
      throw error;
    });
  };
  const handleLocationChange = () => {
    return restore().catch(error => {
      if (typeof options.onError === 'function') options.onError(error);
    });
  };

  const start = () => {
    if (!started) {
      browser.addEventListener('popstate', handleLocationChange);
      browser.addEventListener('hashchange', handleLocationChange);
      started = true;
    }
    return restore({ force: true });
  };

  const goToPage = (page) => {
    const url = new URL(browser.location.href);
    url.searchParams.set('page', String(normalizePage(page)));
    url.hash = '';
    browser.history.pushState({}, '', url.pathname + url.search);
    return restore({ scrollRoot: true });
  };

  const destroy = () => {
    navigationId += 1;
    lastLocationKey = '';
    clearHighlight();
    if (!started) return;
    browser.removeEventListener('popstate', handleLocationChange);
    browser.removeEventListener('hashchange', handleLocationChange);
    started = false;
  };

  return {
    destroy,
    goToPage,
    restore,
    start,
  };
}

module.exports = {
  createDeepLinkController,
  normalizePage,
  readDeepLink,
};
