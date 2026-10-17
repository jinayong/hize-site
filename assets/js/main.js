/* hize. — site script: video links, showreel, player, timecode, cover, copy */
(function(){
  /* ---------- video links (YouTube / Vimeo) ---------- */
  function parse(url){
    if (!url) return null;
    var m;
    if ((m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/))) return { kind:'yt', id:m[1], url:url };
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/))) return { kind:'vm', id:m[1], h:m[2] || '', url:url };
    return null;
  }
  function embed(v, bg){
    if (v.kind === 'yt') {
      var q = 'autoplay=1&playsinline=1&rel=0&modestbranding=1';
      if (bg) q += '&mute=1&loop=1&controls=0&playlist=' + v.id;
      else q += '&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
      return 'https://www.youtube-nocookie.com/embed/' + v.id + '?' + q;
    }
    var p = 'autoplay=1&dnt=1' + (v.h ? '&h=' + v.h : '');
    if (bg) p += '&background=1';
    return 'https://player.vimeo.com/video/' + v.id + '?' + p;
  }
  // 프로듀싱작은 공개 목록에서 숨김. 주소 뒤에 ?all 을 붙이면 본인만 전체를 볼 수 있어요.
  var SHOW_ALL = /[?&]all\b/.test(location.search);
  if (SHOW_ALL) document.documentElement.classList.add('show-all');
  function isHidden(el){ return !SHOW_ALL && el.getAttribute('data-role') === 'producer'; }
  var ASSET_BASE = (function(){
    var l = document.querySelector('link[href*="assets/css/style.css"]');
    return l ? l.getAttribute('href').replace('assets/css/style.css', '') : '';
  })();
  function asset(u){ return (!u || /^(https?:|\/|data:|blob:)/.test(u)) ? u : ASSET_BASE + u; }
  function thumbFor(el, frame){
    var t = asset(el.getAttribute('data-thumb'));
    var v = parse(el.getAttribute('data-video'));
    if (!t && v && v.kind === 'yt') t = 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg';
    if (t && frame) { frame.style.backgroundImage = 'url("' + t + '")'; frame.classList.add('has-thumb'); }
  }

  /* player */
  var player = document.getElementById('player'), screen = document.getElementById('screen'), lastFocus = null;
  var pushedUrl = false, curSrc = null, navIdle = null;
  // 팝업 안에서 이전/다음 작품으로 넘기기: 같은 목록(Work 그리드, Latest, 시리즈)의 순서를 따릅니다
  function siblings(){
    if (!curSrc || !curSrc.isConnected) return [];
    var box = curSrc.closest('.wgrid, .stack, .series-list') || document;
    return Array.prototype.filter.call(box.querySelectorAll('[data-video]'), function(el){ return el.id !== 'reel' && !isHidden(el) && !!parse(el.getAttribute('data-video')); });
  }
  function neighbor(d){
    var l = siblings(), i = l.indexOf(curSrc);
    if (i < 0 || l.length < 2) return null;
    return l[(i + d + l.length) % l.length];
  }
  function titleOf(el){ return ((el.querySelector('.t, .client') || {}).textContent || '').trim(); }
  function step(d){
    var n = neighbor(d); if (!n) return;
    openPlayer(n.getAttribute('data-video'), titleOf(n), n.hasAttribute('data-vertical'), n);
  }
  var navPrev = document.createElement('button'), navNext = document.createElement('button');
  [[navPrev, 'prev', -1, '이전 작품'], [navNext, 'next', 1, '다음 작품']].forEach(function(c){
    c[0].type = 'button'; c[0].className = 'pnav ' + c[1]; c[0].setAttribute('aria-label', c[3]);
    c[0].innerHTML = '<svg viewBox="0 0 24 48" aria-hidden="true"><path d="' + (c[2] < 0 ? 'M18 4 6 24l12 20' : 'M6 4l12 20L6 44') + '" fill="none" stroke="currentColor" stroke-width="1.2"/></svg><span class="mono"></span>';
    c[0].addEventListener('click', function(e){ e.stopPropagation(); step(c[2]); });
  });
  function updateNav(){
    var p = neighbor(-1), n = neighbor(1);
    navPrev.hidden = !p; navNext.hidden = !n;
    if (p) navPrev.querySelector('span').textContent = titleOf(p);
    if (n) navNext.querySelector('span').textContent = titleOf(n);
  }
  function openPlayer(url, title, vertical, src){
    var v = parse(url); if (!v) return;
    if (player.hidden) lastFocus = document.activeElement;
    curSrc = src || null;
    screen.innerHTML = '';
    var f = document.createElement('iframe');
    f.src = embed(v, false);
    f.allow = 'autoplay; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    f.title = title || 'video';
    screen.appendChild(f);
    if (v.kind === 'yt') f.addEventListener('load', function(){
      try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) {}
    });
    screen.dataset.url = v.url;
    document.getElementById('player-title').textContent = title || '';
    document.getElementById('player-link').href = v.url;
    // credits under the video + a shareable URL for this work
    var cred = document.getElementById('player-cred');
    if (!cred) { cred = document.createElement('div'); cred.id = 'player-cred'; cred.className = 'pcred'; player.appendChild(cred); }
    cred.innerHTML = '';
    if (src && src.getAttribute('data-client')) {
      (src.getAttribute('data-role') === 'producer'
        ? [['Client', src.getAttribute('data-client')], ['Agency', src.getAttribute('data-agency')], ['Producer', 'Park jinyong']]
        : [['Client', src.getAttribute('data-client')], ['Agency', src.getAttribute('data-agency')], ['Production', 'hize'], ['Director', 'Park jinyong']])
       .concat([['Model', src.getAttribute('data-model')], ['Awards', src.getAttribute('data-awards')]]).forEach(function(r){
        if (!r[1]) return;
        var d = document.createElement('div'), k = document.createElement('span'), v = document.createElement('span');
        k.className = 'mono mute'; k.textContent = r[0];
        if (r[0] === 'Awards') {
          d.className = 'awrow'; v.className = 'aws';
          // ■ 2024  상 이름 / (같은 해면 연도 생략) 상 이름 — 점은 맨 앞에 하나만
          var prevY = '';
          r[1].split('|').forEach(function(a, n){
            var m = a.match(/^(\d{4})\s+(.*)$/), y = m ? m[1] : '', t = m ? m[2] : a;
            var dot = document.createElement('i'), yy = document.createElement('span'), tt = document.createElement('span');
            dot.className = n ? 'awd off' : 'awd'; yy.className = 'awy mono'; yy.textContent = y !== prevY ? y : ''; tt.textContent = t;
            v.appendChild(dot); v.appendChild(yy); v.appendChild(tt); prevY = y;
          });
        } else v.textContent = r[1];
        d.appendChild(k); d.appendChild(v); cred.appendChild(d);
      });
    }
    cred.hidden = !cred.children.length;
    var slug = src && src.getAttribute('data-slug');
    if (slug && history.pushState && document.querySelector('link[href*="assets/css/style.css"]')) {
      try {
        var wurl = new URL(ASSET_BASE + 'work/' + slug + '/', location.href).pathname;
        if (pushedUrl) history.replaceState({ hizePlayer: 1 }, '', wurl); else history.pushState({ hizePlayer: 1 }, '', wurl);
        pushedUrl = true;
      } catch (e) {}
    }
    player.classList.toggle('v', !!vertical);
    updateNav();
    player.hidden = false;
    document.getElementById('player-x').focus();
  }
  // 영상 주인이 외부 사이트 재생을 막아둔 경우: 빈 화면 대신 유튜브 바로가기 안내
  window.addEventListener('message', function(e){
    if (!/youtube(-nocookie)?\.com$/.test((e.origin || '').replace(/^https?:\/\//, ''))) return;
    var d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
    if (!d || d.event !== 'onError' || player.hidden) return;
    var url = screen.dataset.url || '#';
    screen.innerHTML = '<div class="blocked"><p>이 영상은 YouTube에서 재생할 수 있어요.</p><a class="btn" href="' + url + '" target="_blank" rel="noopener">YouTube에서 보기 ↗</a></div>';
  });
  function hidePlayer(){ curSrc = null; player.hidden = true; screen.innerHTML = ''; if (lastFocus) lastFocus.focus(); }
  function closePlayer(){ if (pushedUrl) { pushedUrl = false; history.back(); } hidePlayer(); }
  window.addEventListener('popstate', function(){ if (!player.hidden) { pushedUrl = false; hidePlayer(); } });
  player.appendChild(navPrev); player.appendChild(navNext);
  player.addEventListener('mousemove', function(){
    player.classList.add('ui'); clearTimeout(navIdle);
    navIdle = setTimeout(function(){ player.classList.remove('ui'); }, 2200);
  });
  document.addEventListener('keydown', function(e){
    if (player.hidden) return;
    if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1);
  });
  document.getElementById('player-x').addEventListener('click', closePlayer);
  player.addEventListener('click', function(e){ if (e.target === player) closePlayer(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !player.hidden) closePlayer(); });

  /* ---------- content from the Google Sheet "hize 사이트 관리" ---------- */
  // 시트에서 링크·작업명·연락처를 바꾸면 사이트를 새로고침할 때 바로 반영됩니다.
  // (시트 공유 설정: 링크가 있는 모든 사용자 — 뷰어)
  var SHEET_ID = '1dkXuqqjRYJ231Z9CRyqh72LDErF-WWRnnwaqgdhG5g0';
  var SHEET_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&headers=1';

  function csvRows(text){
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  function esc(s){ return String(s || '').replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function two(n){ return (n < 10 ? '0' : '') + n; }

  function applySheet(rows){
    if (!rows.length) return;
    var head = rows.shift().map(function(h){ return h.trim(); });
    var col = function(name){ return head.indexOf(name); };
    var iK = col('구분'), iN = col('이름'), iT = col('작업명'), iV = col('영상 링크'), iM = col('메인 노출'), iC = col('분류'), iTh = col('썸네일');
    // 작업 목록은 '썸네일' 칸이 있는 시트일 때만 시트 내용으로 바꿉니다(그 전에는 사이트에 든 목록을 그대로 씀).
    var full = iTh >= 0;
    if (iK < 0) return;
    var get = function(r, i){ return i < 0 ? '' : (r[i] || '').trim(); };
    var items = rows.filter(function(r){ return get(r, iK); }).map(function(r){
      return { kind: get(r, iK).toLowerCase(), name: get(r, iN), title: get(r, iT), video: get(r, iV), main: /^y/i.test(get(r, iM)), cat: get(r, iC), thumb: get(r, iTh) };
    });
    var com = items.filter(function(x){ return x.kind === 'commercial'; });
    var con = items.filter(function(x){ return x.kind === 'contents' || x.kind === 'content' || x.kind === 'originals' || x.kind === 'original'; });
    var first = function(k){ return items.filter(function(x){ return x.kind === k; })[0]; };
    var setting = function(k){ var x = first(k); return x ? (x.video || x.title || x.name) : ''; };

    var reelEl = document.getElementById('reel'), reelRow = first('쇼릴');
    if (reelEl && reelRow && reelRow.video) reelEl.setAttribute('data-video', reelRow.video);

    var stack = document.querySelector('.stack');
    var feat = com.filter(function(x){ return x.main; }).concat(con.filter(function(x){ return x.main; })).slice(0, 4);
    // 빌드 때 넣어둔 크레딧·작품 페이지 링크를 시트로 다시 그린 카드에도 그대로 옮깁니다
    var meta = {};
    document.querySelectorAll('[data-slug]').forEach(function(el){
      var a = '';
      ['data-slug', 'data-client', 'data-agency', 'data-model', 'data-awards', 'data-role'].forEach(function(n){ a += ' ' + n + '="' + esc(el.getAttribute(n)) + '"'; });
      var t = el.querySelector('a.t'), rec = { a: a, href: t ? t.getAttribute('href') : '', aw: !!el.getAttribute('data-awards') };
      var th = (el.getAttribute('data-thumb') || '').split('/').pop(), v = el.getAttribute('data-video');
      if (th) meta[th] = rec; if (v) meta[v] = rec;
    });
    var cardHtml = function(x, cls){
      var m = meta[(x.thumb || '').split('/').pop()] || meta[x.video] || { a: '', href: '' };
      var tt = m.href ? '<a class="t" href="' + esc(m.href) + '">' + esc(x.name) + '</a>' : '<span class="t">' + esc(x.name) + '</span>';
      return '<article class="' + cls + '"' + m.a + ' data-video="' + esc(x.video) + '"' + ta(x) + '><div class="frame hd">' + '<span class="mono ph">' + esc(x.name) + '</span><span class="play mono"><span>Play ▶</span></span></div>' +
        '<div class="card-meta">' + tt + '<span class="mono mute">' + esc(x.title) + '</span></div></article>';
    };
    var ta = function(x){ return x.thumb ? ' data-thumb="' + esc(/[\/:]/.test(x.thumb) ? x.thumb : 'assets/img/work/' + x.thumb) + '"' : ''; };
    if (full && stack && feat.length) {
      stack.innerHTML = feat.map(function(x, i){
        var where = con.indexOf(x) >= 0 ? 'Originals' : 'Work';
        return cardHtml(x, 'item');
      }).join('');
    }
    var list = document.querySelector('.wgrid');
    if (full && list && com.length) {
      // 순서는 사이트에 정해둔 순서를 따르고, 시트에만 있는 새 작품은 뒤에 붙입니다
      var orderOf = {};
      Array.prototype.forEach.call(list.querySelectorAll('[data-thumb]'), function(el, k){ orderOf[(el.getAttribute('data-thumb') || '').split('/').pop()] = k; });
      com = com.map(function(x, k){ return { x: x, k: k }; }).sort(function(a, b){
        var oa = orderOf[(a.x.thumb || '').split('/').pop()], ob = orderOf[(b.x.thumb || '').split('/').pop()];
        oa = oa === undefined ? 1e4 + a.k : oa; ob = ob === undefined ? 1e4 + b.k : ob; return oa - ob;
      }).map(function(o){ return o.x; });
      list.innerHTML = com.map(function(x){ return cardHtml(x, 'card'); }).join('');
    }
    var slist = document.querySelector('.series-list');
    if (full && slist && con.length) {
      var groups = [], byName = {};
      con.forEach(function(x){
        var key = x.cat || x.name || 'Series';
        if (!byName[key]) { byName[key] = { name: key, items: [] }; groups.push(byName[key]); }
        byName[key].items.push(x);
      });
      slist.innerHTML = groups.map(function(g, gi){
        var epsHtml = g.items.map(function(x){
          var m = x.title.match(/^(EP\s*\d+)\s*(.*)$/i);
          var tag = m ? m[1].replace(/\s+/g, '') : '', t = m ? m[2] : x.title;
          return '<article class="ep" data-video="' + esc(x.video) + '"' + ta(x) + '><div class="frame hd"><span class="mono ph">' + esc(tag || x.name) + '</span>' +
            (tag ? '<span class="mono tag">' + esc(tag) + '</span>' : '') + '<span class="play mono"><span>Play ▶</span></span></div><span class="t">' + esc(t || x.name) + '</span></article>';
        }).join('');
        return '<section class="series"><div class="series-head"><div class="series-info"><span class="mono mute">Series ' + two(gi + 1) + '</span><h2>' + esc(g.name) + '</h2></div>' +
          '<div class="series-desc"><p></p><span class="mono mute n">' + g.items.length + ' EP</span></div></div><div class="eps">' + epsHtml + '</div></section>';
      }).join('');
    }
    document.querySelectorAll('.folder').forEach(function(f){
      var n = f.querySelector('.f-n'); if (!n || !full) return;
      var key = f.getAttribute('data-tab') || f.getAttribute('href') || '';
      var vis = Array.prototype.filter.call(document.querySelectorAll('.wgrid article'), function(a){ return !isHidden(a); }).length;
      n.textContent = two(/contents|originals/.test(key) ? con.length : (vis || +n.getAttribute('data-pub') || com.length));
    });
    var setText = function(id, v){
      var el = document.getElementById(id); if (!el || !v || /^\[|0000/.test(v)) return;
      el.textContent = v;
      if (id === 'email') el.setAttribute('href', 'mailto:' + v + '?subject=' + encodeURIComponent('[hize] 프로젝트 문의'));
      if (id === 'phone') el.setAttribute('href', 'tel:' + v.replace(/[^\d+]/g, ''));
    };
    setText('email', setting('이메일')); setText('phone', setting('전화')); setText('insta', setting('인스타'));
  }

  /* clickable works */
  function bindWorks(){
    document.querySelectorAll('[data-video]').forEach(function(el){
      if (el.id === 'reel' || el.dataset.bound) return;
      el.dataset.bound = '1';
      var frame = el.querySelector('.frame') || el.querySelector('.thumb');
      thumbFor(el, frame);
      var url = el.getAttribute('data-video');
      if (!parse(url)) return;
      if (el.tagName !== 'BUTTON') { el.tabIndex = 0; el.setAttribute('role','button'); }
      var title = (el.querySelector('.t, .client') || {}).textContent;
      var go = function(){ openPlayer(url, title, el.hasAttribute('data-vertical'), el); };
      el.addEventListener('click', function(ev){ if (ev.target.closest && ev.target.closest('a[href]')) return; go(); });
      el.addEventListener('keydown', function(e){ if (el.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } });
    });
  }

  /* reel: muted background + play with sound */
  /* reel stills: crossfade until a showreel link is set */
  var slideTimer = null;
  function startSlides(){
    var box = document.getElementById('slides'); if (!box || slideTimer) return;
    var list = box.querySelectorAll('.slide'), label = document.getElementById('slide-label'), i = 0;
    if (list.length < 2) return;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    slideTimer = setInterval(function(){
      if (document.hidden) return;
      var prev = list[i];
      prev.classList.remove('on');
      setTimeout(function(){ if (!prev.classList.contains('on')) prev.classList.remove('zoom'); }, 1800);
      i = (i + 1) % list.length;
      var cur = list[i];
      cur.classList.remove('zoom'); void cur.offsetWidth;
      cur.classList.add('zoom', 'on');
      if (label) label.textContent = cur.getAttribute('data-label');
    }, still ? 5500 : 6000);
  }
  function initReel(){
    var reel = document.getElementById('reel'), playBtn = document.getElementById('reel-play');
    if (!reel || !playBtn || reel.classList.contains('live')) return;
    var rv = parse(reel.getAttribute('data-video'));
    if (!rv) { playBtn.disabled = true; startSlides(); return; }
    playBtn.disabled = false;
    var bg = document.createElement('iframe');
    bg.className = 'bg'; bg.src = embed(rv, true); bg.allow = 'autoplay; fullscreen'; bg.title = 'showreel'; bg.tabIndex = -1;
    reel.insertBefore(bg, reel.firstChild);
    reel.classList.add('live');
    var fit = function(){
      var w = reel.clientWidth, h = reel.clientHeight;
      if (w / h > 16 / 9) { bg.style.width = w + 'px'; bg.style.height = (w * 9 / 16) + 'px'; }
      else { bg.style.height = h + 'px'; bg.style.width = (h * 16 / 9) + 'px'; }
    };
    fit(); window.addEventListener('resize', fit);
    playBtn.addEventListener('click', function(){ openPlayer(reel.getAttribute('data-video'), 'hize. Showreel'); });
  }

  function boot(){ bindWorks(); initReel(); }   // safe to call more than once
  try {
    fetch(SHEET_URL).then(function(r){ if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function(t){ try { applySheet(csvRows(t)); } catch (e) {} boot(); })
      .catch(boot);
  } catch (e) { boot(); }
  setTimeout(boot, 4000);

  /* timecode */
  var t0 = performance.now(), tcs = document.querySelectorAll('.tc-val');
  var p2 = function(n){ return (n < 10 ? '0' : '') + n; };
  if (tcs.length) (function tick(){
    var f = Math.floor((performance.now() - t0) / (1000 / 24));
    var txt = p2(Math.floor(f / 86400) % 24) + ':' + p2(Math.floor(f / 1440) % 60) + ':' + p2(Math.floor(f / 24) % 60) + ':' + p2(f % 24);
    tcs.forEach(function(el){ el.textContent = txt; });
    requestAnimationFrame(tick);
  })();

  /* cover: first screen on the home page */
  var ONCE_PER_SESSION = true;  // 표지는 같은 창에서 한 번만
  var cover = document.getElementById('cover');
  if (cover) {
    var closed = false;
    var skip = location.hash !== '' && location.hash !== '#cover' && location.hash !== '#home';
    if (location.hash === '#home') skip = true;
    if (ONCE_PER_SESSION) { try { if (sessionStorage.getItem('hize-cover') === '1') skip = true; } catch (e) {} }
    var closeCover = function(){
      if (closed) return; closed = true;
      if (ONCE_PER_SESSION) { try { sessionStorage.setItem('hize-cover', '1'); } catch (e) {} }
      cover.classList.add('out');
      setTimeout(function(){ cover.hidden = true; }, 700);
    };
    var openCover = function(){ closed = false; cover.hidden = false; cover.classList.remove('out'); };
    if (skip) cover.hidden = true;
    cover.addEventListener('click', closeCover);
    if (!skip) { try { cover.focus({ preventScroll: true }); } catch (e) {} }
    cover.addEventListener('wheel', function(e){ if (e.deltaY > 10) closeCover(); }, { passive: true });
    var ty = null;
    cover.addEventListener('touchstart', function(e){ ty = e.touches[0].clientY; }, { passive: true });
    cover.addEventListener('touchmove', function(e){ if (ty !== null && ty - e.touches[0].clientY > 40) { ty = null; closeCover(); } }, { passive: true });
    document.addEventListener('keydown', function(e){ if (!cover.hidden && !closed && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) { e.preventDefault(); closeCover(); } });
    window.addEventListener('hashchange', function(){ if (location.hash === '#cover') openCover(); else if (!closed) closeCover(); });
  }

  /* copy */
  document.querySelectorAll('.copy').forEach(function(btn){
    btn.addEventListener('click', function(){
      var el = document.getElementById(btn.dataset.target);
      var reset = function(){ setTimeout(function(){ btn.textContent = 'COPY'; }, 1600); };
      var fallback = function(){
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = 'SELECTED'; reset();
      };
      try { navigator.clipboard.writeText(el.textContent.trim()).then(function(){ btn.textContent = 'COPIED'; reset(); }, fallback); }
      catch (e) { fallback(); }
    });
  });

  /* v4: Work index view · cursor */
  (function(){
    var cssLink = document.querySelector('link[href*="assets/css/style.css"]');
    var BASE = cssLink ? cssLink.getAttribute('href').replace('assets/css/style.css', '') : '';
    var panel = document.getElementById('panel-commercial'), grid = panel && panel.querySelector('.wgrid');
    if (grid) {
      var note = panel.querySelector('.panel-note'), bar = document.createElement('div'); bar.className = 'viewbar';
      note.parentNode.insertBefore(bar, note); bar.appendChild(note);
      var tg = document.createElement('div'); tg.className = 'vtoggle mono';
      tg.innerHTML = '<button type="button" data-v="grid" aria-pressed="true">Grid</button><button type="button" data-v="index" aria-pressed="false">Index</button>';
      bar.appendChild(tg);
      var ul = document.createElement('ul'); ul.className = 'windex';
      var build = function(){
        ul.innerHTML = '';
        var cards = Array.prototype.filter.call(grid.querySelectorAll('.card'), function(c){ return !isHidden(c); });
        cards.forEach(function(card, i){
          var li = document.createElement('li'), t = card.querySelector('.t'), w = card.querySelector('.card-meta .mono');
          li.innerHTML = '<span class="n mono">' + (i < 9 ? '0' : '') + (i + 1) + '</span><span class="c"></span><span class="w"></span><span class="y mono mute">' + (card.getAttribute('data-video') ? 'Play' : '—') + '</span>';
          li.querySelector('.c').textContent = t ? t.textContent : '';
          li.querySelector('.w').textContent = w ? w.textContent : '';
          li.dataset.thumb = card.getAttribute('data-thumb') || '';
          li.addEventListener('click', function(){ card.click(); });
          ul.appendChild(li);
        });
      };
      build();
      grid.parentNode.insertBefore(ul, grid.nextSibling);
      new MutationObserver(build).observe(grid, { childList: true });
      var setView = function(v){
        tg.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x.getAttribute('data-v') === v); });
        panel.classList.toggle('as-index', v === 'index');
        try { localStorage.setItem('hize-view', v); } catch (e) {}
      };
      tg.addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) setView(b.getAttribute('data-v')); });
      try { if (localStorage.getItem('hize-view') === 'index') setView('index'); } catch (e) {}
      var peek = document.createElement('div'); peek.className = 'peek'; document.body.appendChild(peek);
      ul.addEventListener('mousemove', function(e){ peek.style.left = e.clientX + 'px'; peek.style.top = e.clientY + 'px'; });
      ul.addEventListener('mouseover', function(e){
        var li = e.target.closest('li'); if (!li) return;
        var th = li.dataset.thumb;
        if (th && !/^(https?:|\/)/.test(th)) th = BASE + th;
        peek.style.backgroundImage = th ? 'url("' + th + '")' : 'none';
        peek.classList.add('on');
      });
      ul.addEventListener('mouseleave', function(){ peek.classList.remove('on'); });
    }
    if (window.matchMedia && matchMedia('(pointer:fine)').matches) {
      var cu = document.createElement('div'); cu.className = 'cur'; cu.innerHTML = '<b>PLAY</b>'; document.body.appendChild(cu);
      document.addEventListener('mousemove', function(e){
        cu.style.opacity = 1;
        cu.style.left = e.clientX + 'px'; cu.style.top = e.clientY + 'px';
        var el = e.target.closest && e.target.closest('[data-video]:not([data-video=""]):not(#reel),.windex li');
        cu.classList.toggle('big', !!el);
      });
      document.documentElement.addEventListener('mouseleave', function(){ cu.style.opacity = 0; });
    }
  })();
})();
