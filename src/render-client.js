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
          const images = (post.media || []).filter((item) => item.type === 'image');
          const media = images.map((item, index) =>
            '<button class="bb-channel-media-thumb" type="button" data-bb-media-index="' + index + '" aria-label="View image ' + (index + 1) + '">' +
              '<span class="bb-channel-image-skeleton" aria-hidden="true"></span>' +
              '<img class="bb-channel-media-img" data-bb-image-url="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.alt || '') + '" loading="lazy" decoding="async">' +
            '</button>'
          ).join('');
          const viewerImages = images.map((item) =>
            '<figure class="bb-channel-image-slide" data-bb-image-slide>' +
              '<span class="bb-channel-image-skeleton" aria-hidden="true"></span>' +
              '<img class="bb-channel-image-large" data-bb-image-url="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.alt || '') + '" loading="lazy" decoding="async">' +
            '</figure>'
          ).join('');
          const carousel = images.length > 1;
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
              '<div class="bb-channel-body' + (media ? ' bb-channel-body-with-media' : '') + '">' +
                '<div class="bb-channel-main">' +
                  (post.html || '') +
                  (attachments ? '<div class="bb-channel-attachments">' + attachments + '</div>' : '') +
                  (tags ? '<footer class="bb-channel-tags">' + tags + '</footer>' : '') +
                '</div>' +
                (media ? '<div class="bb-channel-media-rail" data-bb-media-rail>' + media + '</div>' : '') +
              '</div>' +
              (media ? '<div class="bb-channel-image-viewer" data-bb-image-viewer hidden>' +
                (carousel ? '<div class="bb-channel-image-viewer-bar"><div class="bb-channel-image-count" data-bb-image-count></div></div>' : '') +
                (carousel ? '<button class="bb-channel-image-nav bb-channel-image-prev" type="button" data-bb-image-prev aria-label="Previous image">‹</button>' : '') +
                '<div class="bb-channel-image-track" data-bb-image-track tabindex="0" aria-label="Image carousel">' + viewerImages + '</div>' +
                (carousel ? '<button class="bb-channel-image-nav bb-channel-image-next" type="button" data-bb-image-next aria-label="Next image">›</button>' : '') +
              '</div>' : '') +
            '</div>' +
          '</section>';
        };

        const openImageViewer = (card, index) => {
          const viewer = card.querySelector('[data-bb-image-viewer]');
          const track = card.querySelector('[data-bb-image-track]');
          const slides = [...card.querySelectorAll('[data-bb-image-slide]')];
          const count = card.querySelector('[data-bb-image-count]');
          if (!viewer || !track || !slides.length) return;
          const safeIndex = (Number(index) + slides.length) % slides.length;
          card.dataset.bbImageIndex = String(safeIndex);
          if (count) count.textContent = slides.length > 1 ? (safeIndex + 1) + ' / ' + slides.length : '';
          window.clearTimeout(card.bbViewerCloseTimer);
          delete card.dataset.bbViewerClosing;
          viewer.hidden = false;
          hydrateImages(slides[safeIndex]);
          requestAnimationFrame(() => {
            card.dataset.bbViewerOpen = 'true';
            track.scrollTo({ left: track.clientWidth * safeIndex, behavior: 'smooth' });
          });
        };

        const closeImageViewer = (card) => {
          const viewer = card.querySelector('[data-bb-image-viewer]');
          if (!viewer || viewer.hidden || card.dataset.bbViewerClosing === 'true') return;
          card.dataset.bbViewerClosing = 'true';
          delete card.dataset.bbViewerOpen;
          window.clearTimeout(card.bbViewerCloseTimer);
          const finishClose = () => {
            if (card.dataset.bbViewerClosing !== 'true' || card.dataset.bbViewerOpen === 'true') return;
            viewer.hidden = true;
            delete card.dataset.bbViewerClosing;
          };
          card.bbViewerCloseTimer = window.setTimeout(finishClose, 460);
        };

        const moveImageViewer = (card, delta) => {
          const current = Number(card.dataset.bbImageIndex || 0);
          openImageViewer(card, current + delta);
        };

        const syncImageViewerIndex = (track) => {
          const card = track.closest('.bb-channel-card');
          const slides = [...card.querySelectorAll('[data-bb-image-slide]')];
          const count = card.querySelector('[data-bb-image-count]');
          if (!slides.length) return;
          const nextIndex = Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / Math.max(1, track.clientWidth))));
          card.dataset.bbImageIndex = String(nextIndex);
          if (count) count.textContent = slides.length > 1 ? (nextIndex + 1) + ' / ' + slides.length : '';
        };

        const hydrateImages = (scope) => {
          scope.querySelectorAll('img[data-bb-image-url]').forEach((img) => {
            if (img.dataset.bbHydrated === 'true') return;
            const holder = img.closest('.bb-channel-media-thumb,.bb-channel-image-slide');
            img.dataset.bbHydrated = 'true';
            img.addEventListener('load', () => {
              if (holder) holder.dataset.bbLoaded = 'true';
            }, { once: true });
            img.addEventListener('error', () => {
              if (holder) holder.dataset.bbLoaded = 'error';
            }, { once: true });
            img.src = img.dataset.bbImageUrl;
            if (img.complete && holder) holder.dataset.bbLoaded = 'true';
          });
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
          hydrateImages(feed);
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
          feed.addEventListener('click', (event) => {
            const thumb = event.target.closest('[data-bb-media-index]');
            const prev = event.target.closest('[data-bb-image-prev]');
            const next = event.target.closest('[data-bb-image-next]');
            const large = event.target.closest('.bb-channel-image-large');
            const card = event.target.closest('.bb-channel-card');
            if (!card) return;
            if (large) {
              event.preventDefault();
              closeImageViewer(card);
              return;
            }
            if (thumb) {
              openImageViewer(card, thumb.dataset.bbMediaIndex);
              return;
            }
            if (prev) {
              event.preventDefault();
              moveImageViewer(card, -1);
              return;
            }
            if (next) {
              event.preventDefault();
              moveImageViewer(card, 1);
            }
          });
          feed.addEventListener('keydown', (event) => {
            const card = event.target.closest('.bb-channel-card');
            if (!card || !card.querySelector('[data-bb-image-viewer]:not([hidden])')) return;
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              moveImageViewer(card, -1);
            }
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              moveImageViewer(card, 1);
            }
          });
          feed.addEventListener('scroll', (event) => {
            const track = event.target.closest && event.target.closest('[data-bb-image-track]');
            if (track) syncImageViewerIndex(track);
          }, { passive: true, capture: true });
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
      .bb-channel-portable *{box-sizing:border-box}
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
      .bb-channel-portable .bb-channel-body-with-media{display:grid;grid-template-columns:minmax(0,1fr) minmax(10rem,13.5rem);gap:1.25rem;align-items:start}
      .bb-channel-portable .bb-channel-main{min-width:0}
      .bb-channel-portable .bb-channel-content{font-size:1rem;line-height:1.78;overflow-wrap:anywhere}
      .bb-channel-portable .bb-channel-content p{margin:0 0 .9em}
      .bb-channel-portable .bb-channel-content a{color:#e46f0a;border-bottom:1px solid rgba(228,111,10,.35);text-decoration:none}
      .bb-channel-portable .bb-channel-media-rail{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.32rem;justify-self:end;width:min(13.5rem,100%);opacity:1;transform:translateY(0);filter:blur(0);transition:opacity 420ms cubic-bezier(.22,1,.36,1),transform 420ms cubic-bezier(.22,1,.36,1),filter 420ms cubic-bezier(.22,1,.36,1);will-change:opacity,transform}
      .bb-channel-portable .bb-channel-media-thumb{position:relative;display:grid;min-height:0;aspect-ratio:1/1;place-items:center;border:1px solid #e7e7e7;border-radius:8px;background:#f8f8f8;padding:0;overflow:hidden;cursor:pointer}
      .bb-channel-portable .bb-channel-media-thumb:focus-visible,.bb-channel-portable .bb-channel-image-nav:focus-visible,.bb-channel-portable .bb-channel-image-track:focus-visible{outline:2px solid rgba(255,121,0,.46);outline-offset:3px}
      .bb-channel-portable .bb-channel-media-thumb:only-child{aspect-ratio:16/10;grid-column:1/-1}
      .bb-channel-portable .bb-channel-media-img{position:relative;z-index:1;display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;margin:0!important;object-fit:contain!important;opacity:0;transition:opacity 180ms ease}
      .bb-channel-portable [data-bb-loaded="true"]>.bb-channel-media-img,.bb-channel-portable [data-bb-loaded="true"]>.bb-channel-image-large{opacity:1}
      .bb-channel-portable .bb-channel-image-skeleton{position:absolute;inset:0;display:block;border-radius:inherit;background:linear-gradient(100deg,rgba(245,245,245,.78) 0%,rgba(233,233,233,.94) 45%,rgba(247,247,247,.8) 80%);background-size:220% 100%;animation:bb-channel-shimmer 1.15s ease-in-out infinite}
      .bb-channel-portable [data-bb-loaded="true"]>.bb-channel-image-skeleton{display:none}
      .bb-channel-portable [data-bb-loaded="error"]>.bb-channel-image-skeleton{background:#f4eeee}
      .bb-channel-portable .bb-channel-card[data-bb-viewer-open="true"] .bb-channel-media-rail{opacity:0;transform:translateY(14px);filter:blur(2px);pointer-events:none}
      .bb-channel-portable .bb-channel-image-viewer{position:relative;margin-top:0;max-width:100%;max-height:0;overflow:hidden;opacity:0;transform:translateY(-14px);touch-action:pan-y;transition:max-height 420ms cubic-bezier(.22,1,.36,1),margin-top 420ms cubic-bezier(.22,1,.36,1),opacity 420ms cubic-bezier(.22,1,.36,1),transform 420ms cubic-bezier(.22,1,.36,1);will-change:max-height,opacity,transform}
      .bb-channel-portable .bb-channel-image-viewer[hidden]{display:none}
      .bb-channel-portable .bb-channel-card[data-bb-viewer-open="true"] .bb-channel-image-viewer{margin-top:1.1rem;max-height:calc(68vh + 4rem);opacity:1;transform:translateY(0)}
      .bb-channel-portable .bb-channel-card[data-bb-viewer-closing="true"] .bb-channel-image-viewer{margin-top:0;max-height:0;opacity:0;transform:translateY(14px);pointer-events:none}
      .bb-channel-portable .bb-channel-image-viewer-bar{display:flex;align-items:center;justify-content:flex-end;gap:.75rem;margin-bottom:.55rem}
      .bb-channel-portable .bb-channel-image-track{display:flex;gap:.75rem;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:thin}
      .bb-channel-portable .bb-channel-image-slide{position:relative;display:flex;min-width:100%;max-width:100%;min-height:12rem;align-items:flex-start;justify-content:flex-start;margin:0;scroll-snap-align:start;scroll-snap-stop:always}
      .bb-channel-portable .bb-channel-image-slide>.bb-channel-image-skeleton{position:relative;inset:auto;width:min(100%,34rem);aspect-ratio:4/3;border:1px solid #eee;border-radius:10px;flex:0 0 auto}
      .bb-channel-portable .bb-channel-image-large{position:relative;z-index:1;display:block!important;width:auto!important;height:auto!important;max-width:min(100%,34rem)!important;max-height:68vh!important;margin:0!important;border:1px solid #e5e5e5;border-radius:10px;background:#fafafa;object-fit:contain!important;opacity:0;cursor:zoom-out;transition:opacity 420ms cubic-bezier(.22,1,.36,1)}
      .bb-channel-portable .bb-channel-image-nav{position:absolute;top:50%;display:grid;width:2.75rem;height:2.75rem;place-items:center;transform:translateY(-50%);border:1px solid #e1e1e1;border-radius:999px;background:rgba(255,255,255,.82);color:#555;cursor:pointer}
      .bb-channel-portable .bb-channel-image-prev{left:.65rem}
      .bb-channel-portable .bb-channel-image-next{right:.65rem}
      .bb-channel-portable .bb-channel-image-count{margin-top:.45rem;color:#888;font-size:.82rem}
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
      @media(max-width:720px){.bb-channel-portable .bb-channel-body-with-media{grid-template-columns:1fr}.bb-channel-portable .bb-channel-media-rail{justify-self:start;width:min(18rem,100%)}}
      @keyframes bb-channel-shimmer{0%{background-position:180% 0}100%{background-position:-80% 0}}
      @media(max-width:640px){.bb-channel-portable .bb-channel-intro{margin-bottom:1.2rem}.bb-channel-portable .bb-channel-title{font-size:1.45rem}.bb-channel-portable .bb-channel-intro-text{font-size:.94rem}.bb-channel-portable .bb-channel-feed{gap:.9rem;padding-left:1.15rem}.bb-channel-portable .bb-channel-feed::before{left:.06rem}.bb-channel-portable .bb-channel-dot{left:-1.32rem;top:1.42rem}.bb-channel-portable .bb-channel-card-surface{padding:1.05rem .95rem;border-radius:12px}.bb-channel-portable .bb-channel-card-placeholder{border-radius:12px}.bb-channel-portable .bb-channel-card:hover .bb-channel-card-surface{transform:none}.bb-channel-portable .bb-channel-meta{margin-bottom:.85rem}.bb-channel-portable .bb-channel-content{font-size:.96rem;line-height:1.72}.bb-channel-portable .bb-channel-media-rail{width:100%;max-width:20rem;grid-template-columns:repeat(3,minmax(0,1fr));justify-self:center;margin-top:.15rem}.bb-channel-portable .bb-channel-media-thumb{min-height:4.1rem}.bb-channel-portable .bb-channel-image-viewer{margin-top:.95rem;max-width:100%}.bb-channel-portable .bb-channel-image-slide{min-height:10rem}.bb-channel-portable .bb-channel-image-large{max-width:100%!important;max-height:68vh!important}.bb-channel-portable .bb-channel-image-nav{width:2.55rem;height:2.55rem}.bb-channel-portable .bb-channel-image-prev{left:.45rem}.bb-channel-portable .bb-channel-image-next{right:.45rem}.bb-channel-portable .bb-channel-attachment{align-items:flex-start;padding:.78rem .82rem}.bb-channel-portable .bb-channel-attachment-title{white-space:normal;overflow-wrap:anywhere}.bb-channel-portable .bb-channel-tags{gap:.42rem}.bb-channel-portable .bb-channel-pagination{gap:1rem}}
      @media(prefers-reduced-motion:reduce){.bb-channel-portable .bb-channel-card-placeholder,.bb-channel-portable .bb-channel-card-surface,.bb-channel-portable .bb-channel-media-rail,.bb-channel-portable .bb-channel-image-viewer,.bb-channel-portable .bb-channel-image-large,.bb-channel-portable .bb-channel-attachment{transition:none}.bb-channel-portable .bb-channel-card:hover .bb-channel-card-surface{transform:none}}
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
