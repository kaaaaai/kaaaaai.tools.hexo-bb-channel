function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeHtml(html) {
  return html.trim().replace(/^[ \t]+/gm, '');
}

function renderClientScript() {
  return `
    <script data-pjax>
      (() => {
        window.initBbChannel = window.initBbChannel || (() => {
          const root = document.querySelector('[data-bb-channel-root]');
          if (!root || root.dataset.bbChannelReady === 'true') return;
          root.dataset.bbChannelReady = 'true';
          const apiBase = root.dataset.apiBase;
          const pageSize = root.dataset.pageSize || '20';
          const feed = root.querySelector('[data-bb-channel-feed]');
          const pager = root.querySelector('[data-bb-channel-pagination]');
          const status = root.querySelector('[data-bb-channel-status]');

        const escapeHtml = (value = '') => String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

        const formatDate = (value) => new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date(value));

        const renderCard = (post) => {
          const media = (post.media || [])
            .filter((item) => item.type === 'image')
            .map((item) => '<img src="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.alt || '') + '" loading="lazy" decoding="async">')
            .join('');
          const tags = (post.tags || []).map((tag) => '<span>#' + escapeHtml(tag) + '</span>').join('');
          return '<section class="bb-channel-card" id="bb-' + escapeHtml(post.id) + '">' +
            '<span class="bb-channel-card-placeholder" aria-hidden="true"></span>' +
            '<div class="bb-channel-card-surface">' +
              '<header class="bb-channel-meta">' +
                '<span class="bb-channel-dot" aria-hidden="true"></span>' +
                '<a class="bb-channel-time" href="' + escapeHtml(post.source && post.source.telegramUrl || '#') + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(formatDate(post.datetime)) + '</a>' +
                '<span class="bb-channel-card-more" aria-hidden="true">...</span>' +
              '</header>' +
              '<div class="bb-channel-body">' +
                (post.html || '') +
                (media ? '<div class="bb-channel-media">' + media + '</div>' : '') +
                (tags ? '<footer class="bb-channel-tags">' + tags + '</footer>' : '') +
              '</div>' +
            '</div>' +
          '</section>';
        };

        const loadPage = async (page = 1) => {
          if (!apiBase) {
            status.textContent = 'Missing bb_channel.api_base';
            return;
          }
          status.textContent = 'Loading...';
          const url = new URL('/api/posts', apiBase);
          url.searchParams.set('page', page);
          url.searchParams.set('page_size', pageSize);
          const response = await fetch(url.toString());
          if (!response.ok) throw new Error('API responded ' + response.status);
          const data = await response.json();
          feed.innerHTML = (data.posts || []).map(renderCard).join('');
          status.textContent = '';
          pager.innerHTML = '';
          if (data.pagination && data.pagination.total > 1) {
            const prev = data.pagination.hasPrev ? '<button data-page="' + (data.pagination.page - 1) + '">上一页</button>' : '';
            const next = data.pagination.hasNext ? '<button data-page="' + (data.pagination.page + 1) + '">下一页</button>' : '';
            pager.innerHTML = prev + '<span>' + data.pagination.page + ' / ' + data.pagination.total + '</span>' + next;
          }
        };

        pager.addEventListener('click', (event) => {
          const button = event.target.closest('button[data-page]');
          if (button) loadPage(button.dataset.page).catch((error) => { status.textContent = error.message; });
          });
          loadPage().catch((error) => { status.textContent = error.message; });
        });
        window.initBbChannel();
        document.addEventListener('DOMContentLoaded', window.initBbChannel, { once: true });
        document.addEventListener('pjax:success', window.initBbChannel);
      })();
    </script>
  `;
}

function renderClientContent(config) {
  return normalizeHtml(`
    <style>
      .post-block:has(.bb-channel-portable) .post-title,.post-block:has(.bb-channel-portable) .post-meta-container,body:has(.bb-channel-portable) .post-toc-wrap{display:none}
      .bb-channel-portable{max-width:100%;margin:0 auto;color:#333}
      .bb-channel-portable .bb-channel-intro{position:relative;margin:0 0 1rem;padding:0;border-bottom:0}
      .bb-channel-portable .bb-channel-title{margin:0 0 .35rem;color:#222;font-family:inherit;font-size:1.65rem;font-weight:700;line-height:1.25}
      .bb-channel-portable .bb-channel-intro-text{margin:0;color:#777;font-size:1rem;line-height:1.65;text-align:left}
      .bb-channel-portable .bb-channel-status{min-height:1.5rem;margin:.8rem 0;color:#999}
      .bb-channel-portable .bb-channel-feed{display:flex;flex-direction:column;gap:1.2rem}
      .bb-channel-portable .bb-channel-card{position:relative;border-radius:16px}
      .bb-channel-portable .bb-channel-card-placeholder{pointer-events:none;position:absolute;inset:0;border:1px dashed #ddd;border-radius:16px;background:rgba(255,255,255,.18);opacity:0;transition:opacity 360ms cubic-bezier(0.37,0,0.63,1)}
      .bb-channel-portable .bb-channel-card-surface{position:relative;z-index:1;min-height:8.75rem;border:1px dashed #ddd;border-radius:16px;background:rgba(255,255,255,.54);padding:1.55rem 2rem;box-shadow:none;transition:border-color 360ms cubic-bezier(0.37,0,0.63,1),background-color 360ms cubic-bezier(0.37,0,0.63,1),box-shadow 360ms cubic-bezier(0.37,0,0.63,1),transform 360ms cubic-bezier(0.37,0,0.63,1)}
      .bb-channel-portable .bb-channel-card:hover .bb-channel-card-placeholder{opacity:1}
      .bb-channel-portable .bb-channel-card:hover .bb-channel-card-surface{transform:translate(6px,-6px);border-style:solid;border-color:rgba(122,36,48,.18);background:rgba(255,255,255,.82);box-shadow:0 14px 34px -30px rgba(225,106,15,.28),0 8px 24px -22px rgba(15,23,42,.18)}
      .bb-channel-portable .bb-channel-dot{width:.6rem;height:.6rem;border-radius:999px;background:#df7a16;box-shadow:0 0 0 .32rem rgba(223,122,22,.12)}
      .bb-channel-portable .bb-channel-meta{display:flex;align-items:center;gap:.8rem;margin:0 0 1.2rem;color:#777;font-weight:500}
      .bb-channel-portable .bb-channel-time{color:inherit;text-decoration:none;border-bottom:0;font-size:.93rem}
      .bb-channel-portable .bb-channel-card-more{margin-left:auto;color:#777;font-size:1.15rem;font-weight:700;line-height:1;letter-spacing:.08em}
      .bb-channel-portable .bb-channel-content{font-size:1rem;line-height:1.9}
      .bb-channel-portable .bb-channel-content p{margin:0 0 1.15em}
      .bb-channel-portable .bb-channel-media{margin-top:1rem}
      .bb-channel-portable .bb-channel-media img{display:block;max-width:100%;border:1px solid #ddd;border-radius:10px}
      .bb-channel-portable .bb-channel-tags{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:1rem;color:#777;font-size:.88rem}
      .bb-channel-portable .bb-channel-tags span{border-bottom:1px dotted #aaa}
      .bb-channel-portable .bb-channel-pagination{display:flex;align-items:center;justify-content:center;gap:3rem;margin-top:1.8rem}
      .bb-channel-portable .bb-channel-pagination button,.bb-channel-portable .bb-channel-pagination span{display:inline-flex;min-width:3.4rem;height:2.15rem;align-items:center;justify-content:center;border:1px solid #e8e8e8;border-radius:7px;color:#777;background:#fff}
      .bb-channel-portable .bb-channel-pagination span{min-width:2.15rem;background:#333;color:#fff;border-color:#333}
      @media(max-width:640px){.bb-channel-portable .bb-channel-card-surface{padding:1.15rem}.bb-channel-portable .bb-channel-card:hover .bb-channel-card-surface{transform:translate(3px,-4px)}.bb-channel-portable .bb-channel-title{font-size:1.45rem}}
      @media(prefers-reduced-motion:reduce){.bb-channel-portable .bb-channel-card-placeholder,.bb-channel-portable .bb-channel-card-surface{transition:none}.bb-channel-portable .bb-channel-card:hover .bb-channel-card-surface{transform:none}}
    </style>
    <div class="bb-channel-portable" data-bb-channel-root data-api-base="${escapeHtml(config.apiBase)}" data-page-size="${escapeHtml(config.pageSize)}">
      <header class="bb-channel-intro">
        <div class="bb-channel-title" role="heading" aria-level="1">${escapeHtml(config.title)}</div>
        <p class="bb-channel-intro-text">${escapeHtml(config.description)}</p>
      </header>
      <div class="bb-channel-status" data-bb-channel-status aria-live="polite"></div>
      <article class="bb-channel-feed" data-bb-channel-feed aria-label="Telegram microblog timeline"></article>
      <nav class="bb-channel-pagination" data-bb-channel-pagination aria-label="BB pagination"></nav>
    </div>
    ${renderClientScript()}
  `);
}

module.exports = {
  renderClientContent,
};
