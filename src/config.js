function normalizeRoute(route) {
  return String(route || 'bb/').replace(/^\/+/, '').replace(/\/?$/, '/');
}

function normalizeApiBase(apiBase) {
  return String(apiBase || '').replace(/\/+$/, '');
}

function resolveConfig(hexo = {}) {
  const raw = (hexo.config && hexo.config.bb_channel) || {};
  return {
    enable: raw.enable !== false,
    mode: raw.mode || 'client',
    route: normalizeRoute(raw.route),
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'moments',
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    apiBase: normalizeApiBase(raw.api_base || raw.apiBase),
    pageSize: Number(raw.page_size || raw.pageSize || 20),
  };
}

module.exports = {
  normalizeRoute,
  resolveConfig,
};
