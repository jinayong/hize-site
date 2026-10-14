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
      return 'https://www.youtube-nocookie.com/embed/' + v.id + '?' + q;
    }
    var p = 'autoplay=1&dnt=1' + (v.h ? '&h=' + v.h : '');
    if (bg) p += '&background=1';
    return 'https://player.vimeo.com/video/' + v.id + '?' + p;
  }
  function thumbFor(el, frame){
    var t = el.getAttribute('data-thumb');
    var v = parse(el.getAttribute('data-video'));
    if (!t && v && v.kind === 'yt') t = 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg';
    if (t && frame) { frame.style.backgroundImage = 'url("' + t + '")'; frame.classList.add('has-thumb'); }
  }

  /* player */
  var player = document.getElementById('player'), screen = document.getElementById('screen'), lastFocus = null;
  function openPlayer(url, title, vertical){
    var v = parse(url); if (!v) return;
    lastFocus = document.activeElement;
    screen.innerHTML = '';
    var f = document.createElement('iframe');
    f.src = embed(v, false);
    f.allow = 'autoplay; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    f.title = title || 'video';
    screen.appendChild(f);
    document.getElementById('player-title').textContent = title || '';
    document.getElementById('player-link').href = v.url;
    player.classList.toggle('v', !!vertical);
    player.hidden = false;
    document.getElementById('player-x').focus();
  }
  function closePlayer(){ player.hidden = true; screen.innerHTML = ''; if (lastFocus) lastFocus.focus(); }
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
    var iK = col('구분'), iN = col('이름'), iT = col('작업명'), iV = col('영상 링크'), iM = col('메인 노출'), iC = col('분류');
    if (iK < 0) return;
    var get = function(r, i){ return i < 0 ? '' : (r[i] || '').trim(); };
    var items = rows.filter(function(r){ return get(r, iK); }).map(function(r){
      return { kind: get(r, iK).toLowerCase(), name: get(r, iN), title: get(r, iT), video: get(r, iV), main: /^y/i.test(get(r, iM)), cat: get(r, iC) };
    });
    var com = items.filter(function(x){ return x.kind === 'commercial'; });
    var con = items.filter(function(x){ return x.kind === 'contents' || x.kind === 'content'; });
    var first = function(k){ return items.filter(function(x){ return x.kind === k; })[0]; };
    var setting = function(k){ var x = first(k); return x ? (x.video || x.title || x.name) : ''; };

    var reelEl = document.getElementById('reel'), reelRow = first('쇼릴');
    if (reelEl && reelRow && reelRow.video) reelEl.setAttribute('data-video', reelRow.video);

    var stack = document.querySelector('.stack');
    var feat = com.filter(function(x){ return x.main; }).concat(con.filter(function(x){ return x.main; }));
    if (stack && feat.length) {
      stack.innerHTML = feat.map(function(x, i){
        var where = con.indexOf(x) >= 0 ? 'Contents' : 'Work';
        return '<article class="item" data-video="' + esc(x.video) + '">' +
          '<div class="frame ' + (i === 0 ? 'scope' : 'hd') + '"><span class="mono ph">' + esc(x.name) + '</span><span class="play mono"><span>Play ▶</span></span></div>' +
          '<div class="meta"><span class="t">' + esc(x.name) + '</span><span class="mono mute">' + esc([x.title, where].filter(Boolean).join(' · ')) + '</span></div></article>';
      }).join('');
    }
    var list = document.querySelector('.index');
    if (list && com.length) {
      list.innerHTML = com.map(function(x){
        return '<li><button class="row" type="button" data-video="' + esc(x.video) + '"><span class="client">' + esc(x.name) + '</span>' +
          '<span class="title mono mute">' + esc(x.title) + '</span><span class="cat mono mute">' + esc(x.cat) + '</span><span class="thumb" aria-hidden="true"></span></button></li>';
      }).join('');
    }
    var eps = document.querySelector('.eps');
    if (eps && con.length) {
      eps.innerHTML = con.map(function(x){
        var m = x.title.match(/^(EP\s*\d+)\s*(.*)$/i);
        var tag = m ? m[1].replace(/\s+/g, '') : '', t = m ? m[2] : x.title;
        return '<article class="ep" data-video="' + esc(x.video) + '" data-vertical="1"><div class="frame vert"><span class="mono ph">' + esc(tag || x.name) + '</span>' +
          (tag ? '<span class="mono tag">' + esc(tag) + '</span>' : '') + '<span class="play mono"><span>Play ▶</span></span></div><span class="t">' + esc(t || x.name) + '</span></article>';
      }).join('');
    }
    document.querySelectorAll('.folder').forEach(function(f){
      var n = f.querySelector('.f-n'); if (!n) return;
      var key = f.getAttribute('data-tab') || f.getAttribute('href') || '';
      n.textContent = two(/contents/.test(key) ? con.length : com.length);
    });
    var setText = function(id, v){ var el = document.getElementById(id); if (el && v) el.textContent = v; };
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
      var go = function(){ openPlayer(url, title, el.hasAttribute('data-vertical')); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', function(e){ if (el.tagName !== 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); } });
    });
  }

  /* reel: muted background + play with sound */
  function initReel(){
    var reel = document.getElementById('reel'), playBtn = document.getElementById('reel-play');
    if (!reel || !playBtn || reel.classList.contains('live')) return;
    var rv = parse(reel.getAttribute('data-video'));
    if (!rv) { playBtn.disabled = true; return; }
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
})();
