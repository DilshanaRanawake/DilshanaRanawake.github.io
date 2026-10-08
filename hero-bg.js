(function () {
  const canvas = document.getElementById('hero-bg-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LINK = 130;          // max distance for a connecting line (px)
  let W = 0, H = 0, pts = [], mx = -1e4, my = -1e4;
  let raf = 0, prev = 0;

  function build() {
    const n = Math.max(22, Math.min(64, Math.round(W * H / 17000)));
    pts = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 0.006 + Math.random() * 0.014;       // px per ms: slow drift
      pts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        r: 1 + Math.random() * 1.4,
        ph: Math.random() * Math.PI * 2
      });
    }
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    if (still) draw(0);
  }

  function step(dt) {
    pts.forEach(p => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      // soft push away from the cursor
      const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
      if (d < 120 && d > 0.1) {
        const f = (1 - d / 120) * 0.04 * dt;
        p.x += (dx / d) * f; p.y += (dy / d) * f;
      }
    });
  }

  function draw(t) {
    if (!W || !H) return;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--main-color').trim() || '#2dd4bf';
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1;

    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.globalAlpha = (1 - d / LINK) * 0.35;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    pts.forEach(p => {
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 0.0012 + p.ph);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    const dt = prev ? Math.min(t - prev, 50) : 16;
    prev = t;
    step(dt); draw(t);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf) { prev = 0; raf = requestAnimationFrame(loop); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  new ResizeObserver(resize).observe(canvas);
  if (!still) {
    hero.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('mouseleave', () => { mx = my = -1e4; });
    new IntersectionObserver(e => (e[0].isIntersecting ? start() : stop())).observe(canvas);
  }
})();