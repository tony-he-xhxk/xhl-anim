(function () {
  'use strict';

  var data = window.SITE_DATA || { site: {}, projects: [] };
  var site = data.site || {};
  var projects = Array.isArray(data.projects) ? data.projects : [];

  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // 页脚图标（16×16 viewBox，填色跟随链接文字颜色）
  var ICONS = {
    github: 'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49' +
      '-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82' +
      '.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15' +
      '-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82' +
      '.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48' +
      ' 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z'
  };

  function makeIcon(name) {
    var d = ICONS[name];
    if (!d) return null;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'footer-icon');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
    return svg;
  }

  function setText(node, text) {
    if (node && typeof text === 'string' && text) node.textContent = text;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  function externalize(anchor) {
    if (/^https?:/i.test(anchor.getAttribute('href') || '')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener';
    }
  }

  setText($('siteTitle'), site.title);
  setText($('siteSubtitle'), site.subtitle);
  if (site.title) document.title = site.title + ' · animation.xingheling.cn';

  var footer = site.footer || {};
  var copy = (footer.copy || '© {year} xingheling.cn').replace('{year}', String(new Date().getFullYear()));
  setText($('footerCopy'), copy);

  var linksWrap = $('footerLinks');
  if (linksWrap && Array.isArray(footer.links)) {
    footer.links.forEach(function (link) {
      if (!link || !link.label) return;
      var a = el('a', 'footer-link', link.label);
      a.href = link.href || '#';
      externalize(a);
      var icon = link.icon ? makeIcon(link.icon) : null;
      if (icon) a.insertBefore(icon, a.firstChild);
      linksWrap.appendChild(a);
    });
  }

  var countEl = $('siteCount');
  if (countEl && projects.length) {
    countEl.textContent = '已收录 ' + projects.length + ' 个动效';
  }

  function buildCard(project, index) {
    var li = el('li', 'card');
    li.style.setProperty('--accent', project.accent || '#a855f7');
    li.style.setProperty('--accent-alt', project.accentAlt || '#22d3ee');
    li.style.setProperty('--i', String(index));

    var a = el('a', 'card-link');
    a.href = project.href || '#';
    if (project.title) a.setAttribute('aria-label', project.title + ' — 打开动效');

    var media = el('div', 'card-media');
    if (project.cover) {
      var img = document.createElement('img');
      img.className = 'card-img';
      img.src = project.cover;
      img.alt = (project.title || '动效') + ' 预览封面';
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);
    }
    var sheen = el('span', 'card-sheen');
    sheen.setAttribute('aria-hidden', 'true');
    media.appendChild(sheen);
    a.appendChild(media);

    var body = el('div', 'card-body');
    body.appendChild(el('h2', 'card-title', project.title || '未命名动效'));
    if (project.subtitle) body.appendChild(el('p', 'card-sub', project.subtitle));
    if (project.description) body.appendChild(el('p', 'card-desc', project.description));

    if (Array.isArray(project.tags) && project.tags.length) {
      var ul = el('ul', 'tags');
      project.tags.forEach(function (tag) {
        ul.appendChild(el('li', 'tag', tag));
      });
      body.appendChild(ul);
    }

    var cta = el('span', 'card-cta');
    cta.appendChild(document.createTextNode('查看动效'));
    var arrow = el('span', 'card-cta-arrow', '→');
    arrow.setAttribute('aria-hidden', 'true');
    cta.appendChild(arrow);
    body.appendChild(cta);

    a.appendChild(body);
    li.appendChild(a);

    if (!reduceMotion) li.classList.add('card--enter');
    return li;
  }

  var grid = $('grid');
  if (grid) {
    if (!projects.length) {
      grid.hidden = true;
      var fallback = $('fallback');
      if (fallback) fallback.hidden = false;
    } else {
      var fragment = document.createDocumentFragment();
      projects.forEach(function (project, index) {
        fragment.appendChild(buildCard(project, index));
      });
      grid.appendChild(fragment);

      // 兜底：即使入场动画没有执行，也确保卡片最终可见
      if (!reduceMotion) {
        window.setTimeout(function () {
          Array.prototype.forEach.call(grid.querySelectorAll('.card--enter'), function (card) {
            card.classList.remove('card--enter');
          });
        }, 2200);
      }
    }
  }

  // 指针跟随光晕（仅桌面端精细指针）
  if (finePointer && grid) {
    grid.addEventListener('pointermove', function (event) {
      var card = event.target.closest ? event.target.closest('.card') : null;
      if (!card) return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((event.clientX - rect.left) / rect.width * 100).toFixed(2) + '%');
      card.style.setProperty('--my', ((event.clientY - rect.top) / rect.height * 100).toFixed(2) + '%');
    });
    grid.addEventListener('pointerleave', function () {
      Array.prototype.forEach.call(grid.querySelectorAll('.card'), function (card) {
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      });
    });
  }
})();
