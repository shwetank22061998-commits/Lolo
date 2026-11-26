(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const PALETTE = ['#f4a23a', '#ffcb47', '#e8c56f', '#ec8aa6', '#f7c6cf', '#fbf0dc', '#e57a1e', '#9cb86a'];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  /* ---------------- Toran (marigold garland) ---------------- */
  function buildToran() {
    const toran = $('#toran');
    toran.innerHTML = '';
    const count = Math.max(9, Math.round(window.innerWidth / 38));
    const tall = window.innerHeight > 520;
    for (let i = 0; i < count; i++) {
      const strand = document.createElement('div');
      strand.className = 'strand';
      strand.style.setProperty('--sw', `${rand(3.6, 6).toFixed(2)}s`);
      strand.style.setProperty('--swd', `${(-rand(0, 5)).toFixed(2)}s`);
      const long = i % 2 === 0;
      const blooms = (long ? 6 : 4) - (tall ? 0 : 2);
      const size = window.innerWidth < 520 ? 12 : 15;
      for (let b = 0; b < blooms; b++) {
        const bloom = document.createElement('span');
        bloom.className = 'bloom' + (b % 3 === 1 ? ' alt' : '') + (b === blooms - 1 && i % 4 === 0 ? ' rose' : '');
        bloom.style.setProperty('--b', `${size}px`);
        strand.appendChild(bloom);
      }
      const end = document.createElement('span');
      end.className = i % 4 === 2 ? 'bell' : 'leaf';
      strand.appendChild(end);
      toran.appendChild(strand);
    }
  }

  /* ---------------- Falling petals ---------------- */
  function buildPetals() {
    if (reduceMotion) return;
    const host = $('#petals');
    const n = window.innerWidth < 600 ? 12 : 20;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      p.style.left = `${rand(0, 100)}%`;
      p.style.setProperty('--s', `${rand(8, 15).toFixed(1)}px`);
      p.style.setProperty('--t', `${rand(11, 22).toFixed(1)}s`);
      p.style.setProperty('--delay', `${(-rand(0, 22)).toFixed(1)}s`);
      p.style.setProperty('--drift', `${rand(-80, 80).toFixed(0)}px`);
      p.style.setProperty('--c', pick(['#ec8aa6', '#f4a23a', '#ffcb47', '#f7c6cf', '#e57a1e']));
      host.appendChild(p);
    }
  }

  /* ---------------- FX canvas: confetti + fireworks ---------------- */
  const canvas = $('#fx');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  const particles = [];
  let running = false;

  function resizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= 1;
      if (p.type === 'rocket') {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12;
        ctx.fillStyle = '#ffe9b0';
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill();
        if (Math.random() < 0.7) particles.push({ type: 'spark', x: p.x, y: p.y, vx: rand(-.4, .4), vy: rand(.3, 1), life: 22, max: 22, size: 1.4, color: '#f4a23a', drag: .96, g: .02 });
        if (p.vy >= -1 || p.y <= p.ty) { particles.splice(i, 1); explode(p.x, p.y); continue; }
      } else if (p.type === 'confetti') {
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
        p.x += p.vx + Math.sin((p.life + p.seed) / 9) * .6; p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 40);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(p.life / 6 + p.seed));
        ctx.fillStyle = p.color;
        if (p.shape === 'petal') {
          ctx.beginPath(); ctx.ellipse(0, 0, p.size * .55, p.size, 0, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      } else {
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
        p.x += p.vx; p.y += p.vy;
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }
      if (p.life <= 0 || p.y > H + 40) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    if (particles.length) requestAnimationFrame(loop);
    else { running = false; ctx.clearRect(0, 0, W, H); }
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(loop); } }

  function confetti(x, y, count = 110, { spread = Math.PI * 2, angle = -Math.PI / 2, power = 11, petals = false } = {}) {
    const n = reduceMotion ? Math.round(count / 4) : count;
    for (let i = 0; i < n; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = rand(power * .35, power);
      particles.push({
        type: 'confetti', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        g: .22, drag: .965, life: rand(110, 170) | 0, size: rand(6, 11),
        rot: rand(0, 6.28), vr: rand(-.2, .2), seed: rand(0, 100),
        color: pick(PALETTE), shape: petals || Math.random() < .35 ? 'petal' : 'rect'
      });
    }
    kick();
  }

  function explode(x, y) {
    const base = pick(PALETTE), accent = pick(PALETTE);
    const n = reduceMotion ? 24 : 80;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-.05, .05);
      const v = rand(2.2, 5.6);
      const life = rand(55, 85) | 0;
      particles.push({ type: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .045, drag: .975, life, max: life, size: rand(1.4, 2.6), color: Math.random() < .7 ? base : accent });
    }
    kick();
  }

  function firework(tx, ty) {
    if (reduceMotion) { explode(tx, ty); return; }
    const sx = tx + rand(-60, 60);
    const sy = H + 10;
    const vy = -Math.sqrt(2 * .12 * (sy - ty)) * 1.02;
    const t = -vy / .12;
    particles.push({ type: 'rocket', x: sx, y: sy, vx: (tx - sx) / t, vy, ty, life: 400 });
    kick();
  }

  function fireworkShow(times = 5) {
    for (let i = 0; i < times; i++) {
      setTimeout(() => firework(rand(W * .15, W * .85), rand(H * .14, H * .42)), i * 420 + rand(0, 200));
    }
  }

  /* ---------------- Slides & navigation ---------------- */
  const slides = $$('.slide');
  const dotsHost = $('#dots');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const count = $('#dockCount');
  const envelope = $('#envelope');
  const pages = slides.length - 1; // the cover isn't counted as a page
  let index = 0;
  let busy = false;

  slides.slice(1).forEach((slide, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Go to page ${i + 1}: ${slide.dataset.label}`);
    b.innerHTML = `<span>${slide.dataset.label}</span>`;
    b.addEventListener('click', () => go(i + 1));
    li.appendChild(b);
    dotsHost.appendChild(li);
  });
  const dotBtns = $$('button', dotsHost);

  function setInert() {
    slides.forEach((s, k) => {
      const active = k === index;
      s.classList.toggle('is-active', active);
      s.classList.toggle('is-past', k < index);
      s.inert = !active;
      s.setAttribute('aria-hidden', String(!active));
    });
  }

  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === index || busy) return;
    busy = true;
    setTimeout(() => { busy = false; }, 650);
    index = i;
    setInert();
    document.body.classList.toggle('on-cover', index === 0);
    dotBtns.forEach((b, k) => {
      if (k + 1 === index) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      if (k + 1 < index) b.classList.add('seen');
    });
    prevBtn.disabled = index <= 1;
    nextBtn.disabled = index >= slides.length - 1;
    count.textContent = `${String(index).padStart(2, '0')} / ${String(pages).padStart(2, '0')}`;
    const s = slides[index];
    s.focus({ preventScroll: true });
    onEnter(s);
  }

  const next = () => go(index + 1);
  const prev = () => { if (index > 1) go(index - 1); };

  function onEnter(slide) {
    if (slide.classList.contains('slide-names')) {
      setTimeout(() => {
        confetti(W * .1, H * .9, 70, { angle: -Math.PI / 3, spread: .8, power: 17 });
        confetti(W * .9, H * .9, 70, { angle: -Math.PI * 2 / 3, spread: .8, power: 17 });
      }, 550);
    }
    if (slide.classList.contains('slide-final')) setTimeout(() => fireworkShow(6), 500);
  }

  setInert();

  $$('[data-next]').forEach(b => b.addEventListener('click', next));
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); index === 0 ? openEnvelope() : next(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  });

  // Horizontal swipe on touch screens (vertical gestures do nothing — there's no scrolling)
  let tx = 0, ty = 0, tt = 0;
  const stage = $('#stage');
  stage.addEventListener('touchstart', e => { const t = e.changedTouches[0]; tx = t.clientX; ty = t.clientY; tt = Date.now(); }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (index === 0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - tx, dy = t.clientY - ty;
    if (Date.now() - tt < 700 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : prev();
  }, { passive: true });
  // Block any wheel / touch scrolling of the page itself
  document.addEventListener('wheel', e => e.preventDefault(), { passive: false });
  document.addEventListener('touchmove', e => { if (e.touches.length === 1) e.preventDefault(); }, { passive: false });

  /* ---------------- Cover: open the envelope ---------------- */
  function openEnvelope() {
    if (envelope.classList.contains('is-open')) return;
    envelope.classList.add('is-open');
    const r = $('#openSeal').getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, 160, { power: 14 });
    setTimeout(() => go(1), reduceMotion ? 200 : 1250);
  }
  $('#openSeal').addEventListener('click', openEnvelope);

  /* ---------------- Names: petal shower ---------------- */
  function petalShower() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => confetti(rand(0, W), -20, 26, { angle: Math.PI / 2, spread: 1.2, power: 4, petals: true }), i * 140);
    }
  }
  $('#throwPetals').addEventListener('click', petalShower);
  $('#namesBurst').addEventListener('click', e => confetti(e.clientX, e.clientY, 60, { power: 9 }));

  /* ---------------- Date: countdown ---------------- */
  const EVENT_START = new Date('2026-12-13T18:30:00+05:30').getTime();
  const units = Object.fromEntries($$('[data-unit]').map(el => [el.dataset.unit, el]));
  const note = $('#countdownNote');
  function tickCountdown() {
    let diff = Math.max(0, EVENT_START - Date.now());
    const vals = {
      days: Math.floor(diff / 864e5),
      hours: Math.floor(diff / 36e5) % 24,
      minutes: Math.floor(diff / 6e4) % 60,
      seconds: Math.floor(diff / 1e3) % 60
    };
    for (const [k, el] of Object.entries(units)) {
      const v = String(vals[k]).padStart(2, '0');
      if (el.textContent !== v) {
        el.textContent = v;
        if (slides[index].classList.contains('slide-date')) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
      }
    }
    if (diff === 0) note.textContent = 'it’s happening — the dhol has started!';
  }
  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ---------------- Time: light the diya ---------------- */
  const diya = $('#diya');
  const timeWrap = $('#timeWrap');
  diya.addEventListener('click', () => {
    if (diya.classList.contains('is-lit')) {
      const r = diya.getBoundingClientRect();
      explode(r.left + r.width / 2, r.top + r.height * .15);
      return;
    }
    diya.classList.add('is-lit');
    diya.setAttribute('aria-pressed', 'true');
    diya.setAttribute('aria-label', 'The diya is lit');
    timeWrap.classList.add('is-lit');
    const r = diya.getBoundingClientRect();
    setTimeout(() => {
      const x = r.left + r.width / 2, y = r.top + r.height * .2;
      for (let i = 0; i < 40; i++) {
        const a = rand(-Math.PI, 0), v = rand(1, 4.5), life = rand(40, 70) | 0;
        particles.push({ type: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .03, drag: .97, life, max: life, size: rand(1, 2.2), color: pick(['#ffe07a', '#f4a23a', '#fffbe8']) });
      }
      kick();
    }, 350);
  });

  /* ---------------- Note: flip card ---------------- */
  const flip = $('#flipCard');
  flip.addEventListener('click', () => {
    const open = flip.classList.toggle('is-open');
    flip.setAttribute('aria-pressed', String(open));
    flip.setAttribute('aria-label', open ? 'Our note to you. Tap to close' : 'Open our note');
    if (open) {
      const r = flip.getBoundingClientRect();
      setTimeout(() => confetti(r.left + r.width / 2, r.top + 10, 50, { angle: -Math.PI / 2, spread: 1.6, power: 9, petals: true }), 450);
    }
  });

  /* ---------------- Finale: fireworks, calendar, share ---------------- */
  const finale = $('.slide-final');
  finale.addEventListener('click', e => {
    if (e.target.closest('button,a')) return;
    firework(e.clientX, e.clientY);
  });

  $('#addCal').addEventListener('click', () => {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Shwetank and Sheetal//Wedding//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:shwetank-sheetal-wedding-20261213@invite',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
      'DTSTART:20261213T130000Z',
      'DTEND:20261213T183000Z',
      'SUMMARY:Shwetank & Sheetal’s Wedding',
      'LOCATION:Ghotra Palace\\, Kamptee Road\\, Beside Kesar Gateway Society Road\\, Nagpur 441001\\, India',
      'DESCRIPTION:Come for the vows\\, stay for the joy\\, the hugs\\, the photos and the dance floor!',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Shwetank & Sheetal’s wedding is tomorrow!', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'shwetank-sheetal-wedding.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });

  const shareBtn = $('#shareInvite');
  const shareLabel = shareBtn.innerHTML;
  const shareData = {
    title: 'Shwetank & Sheetal — Wedding Invitation',
    text: 'Save the date! Shwetank & Sheetal are getting married on Sunday, 13 December 2026 at 6:30 PM, Ghotra Palace, Nagpur. Come celebrate with us!'
  };
  const flash = msg => { shareBtn.textContent = msg; setTimeout(() => { shareBtn.innerHTML = shareLabel; }, 2600); };
  shareBtn.addEventListener('click', async () => {
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) { await navigator.share({ ...shareData, url }); flash('Thank you for sharing ♡'); }
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(`${shareData.text} ${url}`); flash('Invite link copied ✓'); }
      else window.prompt('Copy your invitation link:', url);
      const r = shareBtn.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top, 60, { spread: 1.4, power: 12 });
    } catch (e) {
      if (e.name !== 'AbortError') flash('Please copy the link');
    }
  });

  $('#restart').addEventListener('click', () => {
    diya.classList.remove('is-lit'); timeWrap.classList.remove('is-lit');
    diya.setAttribute('aria-pressed', 'false'); diya.setAttribute('aria-label', 'Light the diya to reveal the time');
    flip.classList.remove('is-open'); flip.setAttribute('aria-pressed', 'false'); flip.setAttribute('aria-label', 'Open our note');
    go(1);
  });

  /* ---------------- Init ---------------- */
  let rt;
  window.addEventListener('resize', () => { resizeCanvas(); clearTimeout(rt); rt = setTimeout(buildToran, 150); });
  resizeCanvas();
  buildToran();
  buildPetals();
  prevBtn.disabled = true;
})();
