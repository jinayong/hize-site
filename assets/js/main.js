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

  /* clickable works */
  document.querySelectorAll('[data-video]').forEach(function(el){
    if (el.id === 'reel') return;
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

  /* reel: muted background + play with sound */
  var reel = document.getElementById('reel'), rv = reel && parse(reel.getAttribute('data-video'));
  var playBtn = document.getElementById('reel-play');
  if (rv) {
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
  } else if (playBtn) {
    playBtn.disabled = true;
  }

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
    document.getElementById('enter').addEventListener('click', closeCover);
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
