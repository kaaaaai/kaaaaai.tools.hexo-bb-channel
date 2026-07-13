const { fileIcon } = require('./icons');

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
        const bbChannelFileIcon = ${JSON.stringify(fileIcon)};
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
          const attachments = (post.attachments || []).map((item) =>
            '<a class="bb-channel-attachment" href="' + escapeHtml(item.url || (post.source && post.source.telegramUrl) || '#') + '" target="_blank" rel="noopener noreferrer">' +
              '<span class="bb-channel-attachment-icon">' + bbChannelFileIcon + '</span>' +
              '<span class="bb-channel-attachment-main">' +
                '<span class="bb-channel-attachment-title">' + escapeHtml(item.title || 'Attachment') + '</span>' +
                (item.meta ? '<span class="bb-channel-attachment-meta">' + escapeHtml(item.meta) + '</span>' : '') +
              '</span>' +
            '</a>'
          ).join('');
          return '<section class="bb-channel-card" id="bb-' + escapeHtml(post.id) + '">' +
            '<span class="bb-channel-dot" aria-hidden="true"></span>' +
            '<span class="bb-channel-card-placeholder" aria-hidden="true"></span>' +
            '<div class="bb-channel-card-surface">' +
              '<header class="bb-channel-meta">' +
                '<a class="bb-channel-time" href="' + escapeHtml(post.source && post.source.telegramUrl || '#') + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(formatDate(post.datetime)) + '</a>' +
              '</header>' +
              '<div class="bb-channel-body">' +
                (post.html || '') +
                (attachments ? '<div class="bb-channel-attachments">' + attachments + '</div>' : '') +
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
      .bb-channel-portable{max-width:100%;margin:0 auto;color:#242424}
      .bb-channel-portable .bb-channel-intro{position:relative;margin:0 0 1.55rem;padding:0;border-bottom:0}
      .bb-channel-portable .bb-channel-title{margin:0 0 .45rem;color:#202020;font-family:inherit;font-size:1.72rem;font-weight:700;line-height:1.2;letter-spacing:-.02em}
      .bb-channel-portable .bb-channel-intro-text{margin:0;color:#777;font-size:1rem;line-height:1.6;text-align:left}
      .bb-channel-portable .bb-channel-status{min-height:1.2rem;margin:.4rem 0 .8rem;color:#999}
      .bb-channel-portable .bb-channel-feed{position:relative;display:flex;flex-direction:column;gap:1.05rem;padding-left:2.1rem}
      .bb-channel-portable .bb-channel-feed::before{content:"";position:absolute;left:.22rem;top:.25rem;bottom:.25rem;width:1px;background:linear-gradient(to bottom,rgba(226,226,226,0),#e2e2e2 1.2rem,#e2e2e2 calc(100% - 1.2rem),rgba(226,226,226,0))}
      .bb-channel-portable .bb-channel-card{position:relative;border-radius:14px}
      .bb-channel-portable .bb-channel-card-placeholder{pointer-events:none;position:absolute;inset:0;border:1px dashed #d9d9d9;border-radius:14px;background:rgba(255,255,255,.2);opacity:0;transition:opacity 320ms cubic-bezier(.22,1,.36,1)}
      .bb-channel-portable .bb-channel-card-surface{position:relative;z-index:1;border:1px dashed #d9d9d9;border-radius:14px;background:rgba(255,255,255,.66);padding:1.45rem 1.65rem;box-shadow:none;transition:border-color 320ms cubic-bezier(.22,1,.36,1),background-color 320ms cubic-bezier(.22,1,.36,1),box-shadow 320ms cubic-bezier(.22,1,.36,1),transform 320ms cubic-bezier(.22,1,.36,1)}
      .bb-channel-portable .bb-channel-card:hover .bb-channel-card-placeholder{opacity:1}
      .bb-channel-portable .bb-channel-card:hover .bb-channel-card-surface{transform:translate(6px,-6px);border-style:solid;border-color:#e7b99d;background:rgba(255,255,255,.86);box-shadow:0 14px 30px -28px rgba(15,23,42,.32)}
      .bb-channel-portable .bb-channel-dot{position:absolute;left:-2.16rem;top:1.7rem;z-index:2;width:.56rem;height:.56rem;border-radius:999px;background:#ff7900;box-shadow:0 0 0 .28rem rgba(255,121,0,.12)}
      .bb-channel-portable .bb-channel-meta{display:flex;align-items:center;gap:.7rem;margin:0 0 1.08rem;color:#737373;font-weight:500}
      .bb-channel-portable .bb-channel-time{color:inherit;text-decoration:none;border-bottom:0;font-size:.96rem;line-height:1.3}
      .bb-channel-portable .bb-channel-content{font-size:1rem;line-height:1.78}
      .bb-channel-portable .bb-channel-content p{margin:0 0 .9em}
      .bb-channel-portable .bb-channel-content a{color:#e46f0a;border-bottom:1px solid rgba(228,111,10,.35);text-decoration:none}
      .bb-channel-portable .bb-channel-media{margin-top:1rem}
      .bb-channel-portable .bb-channel-media img{display:block;max-width:100%;border:1px solid #e5e5e5;border-radius:10px}
      .bb-channel-portable .bb-channel-attachments{display:flex;flex-direction:column;gap:.65rem;margin-top:.9rem}
      .bb-channel-portable .bb-channel-attachment{display:flex;align-items:center;gap:.8rem;border:1px solid #e3ddd4;border-radius:10px;background:rgba(250,248,243,.58);padding:.82rem .95rem;color:#333;text-decoration:none;transition:border-color 220ms ease,background-color 220ms ease,box-shadow 220ms ease}
      .bb-channel-portable .bb-channel-attachment:hover{border-color:#d6cbbd;background:rgba(255,252,246,.9);box-shadow:0 8px 22px -20px rgba(15,23,42,.28)}
      .bb-channel-portable .bb-channel-attachment-icon{display:grid;width:2rem;height:2rem;place-items:center;flex:0 0 auto;border:1px solid rgba(214,203,189,.82);border-radius:9px;background:rgba(255,255,255,.56);color:#c96b18}
      .bb-channel-portable .bb-channel-lucide{display:block;width:1.08rem;height:1.08rem;stroke-width:1.9}
      .bb-channel-portable .bb-channel-attachment-main{display:flex;min-width:0;flex-direction:column;gap:.12rem}
      .bb-channel-portable .bb-channel-attachment-title{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.95rem;font-weight:600}
      .bb-channel-portable .bb-channel-attachment-meta{color:#888;font-size:.82rem}
      .bb-channel-portable .bb-channel-tags{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:.9rem;color:#676767;font-size:.86rem}
      .bb-channel-portable .bb-channel-tags span{display:inline-flex;align-items:center;border:0;border-radius:6px;background:#f3f3f3;padding:.18rem .5rem;line-height:1.5}
      .bb-channel-portable .bb-channel-pagination{display:flex;align-items:center;justify-content:center;gap:3rem;margin-top:1.8rem}
      .bb-channel-portable .bb-channel-pagination button,.bb-channel-portable .bb-channel-pagination span{display:inline-flex;min-width:3.4rem;height:2.15rem;align-items:center;justify-content:center;border:1px solid #e8e8e8;border-radius:7px;color:#777;background:#fff}
      .bb-channel-portable .bb-channel-pagination span{min-width:2.15rem;background:#333;color:#fff;border-color:#333}
      @media(max-width:640px){.bb-channel-portable .bb-channel-feed{padding-left:1.45rem}.bb-channel-portable .bb-channel-dot{left:-1.5rem}.bb-channel-portable .bb-channel-card-surface{padding:1.1rem 1.05rem}.bb-channel-portable .bb-channel-card:hover .bb-channel-card-surface{transform:translate(3px,-4px)}.bb-channel-portable .bb-channel-title{font-size:1.45rem}}
      @media(prefers-reduced-motion:reduce){.bb-channel-portable .bb-channel-card-placeholder,.bb-channel-portable .bb-channel-card-surface,.bb-channel-portable .bb-channel-attachment{transition:none}.bb-channel-portable .bb-channel-card:hover .bb-channel-card-surface{transform:none}}
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
