(function () {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, nodes = [], layers = [], edges = [], pulses = [];
  let raf = 0, prev = 0, nextWave = 600;

  // build the layers, nodes and connections for the current size
  function build() {
    const cfg = W < 700 ? [3, 5, 5, 3] : [4, 7, 8, 7, 4];
    nodes = []; layers = []; edges = []; pulses = [];
    cfg.forEach((n, li) => {
      const col = [];
      for (let i = 0; i < n; i++) {
        const node = {
          l: li,
          bx: W * (0.05 + 0.90 * li / (cfg.length - 1)),
          by: H * (0.10 + 0.80 * (n === 1 ? 0.5 : i / (n - 1))),
          ph: Math.random() * Math.PI * 2,
          act: 0, x: 0, y: 0, out: []
        };
        col.push(node); nodes.push(node);
      }
      layers.push(col);
    });
    for (let l = 0; l < layers.length - 1; l++) {
      layers[l].forEach(a => layers[l + 1].forEach(b => {
        if (Math.random() < 0.8) {
          const e = { a, b };
          edges.push(e); a.out.push(e);
        }
      }));
    }
    updatePositions(0);
    if (still) nodes.forEach(n => { n.act = Math.random() < 0.3 ? 0.9 : 0.1; });
  }

  function updatePositions(t) {
    nodes.forEach(n => {
      n.x = n.bx + Math.sin(t * 0.0006 + n.ph) * 8;
      n.y = n.by + Math.cos(t * 0.0005 + n.ph) * 8;
    });
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

  function send(e) { pulses.push({ e, t: 0, v: 0.0012 + Math.random() * 0.0006 }); }

  function wave() {
    const inputs = layers[0].slice().sort(() => Math.random() - 0.5).slice(0, 2);
    inputs.forEach(n => { n.act = 1; n.out.forEach(send); });
  }

  function draw(t) {
    if (!W || !H) return;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--main-color').trim() || '#2dd4bf';
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.strokeStyle = color; ctx.fillStyle = color;

    // connections
    ctx.globalAlpha = 0.12; ctx.lineWidth = 1;
    ctx.beginPath();
    edges.forEach(({ a, b }) => { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); });
    ctx.stroke();

    // travelling pulses
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = 8;
    pulses.forEach(p => {
      const { a, b } = p.e;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * p.t, a.y + (b.y - a.y) * p.t, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // nodes
    ctx.save();
    ctx.shadowColor = color;
    nodes.forEach(n => {
      ctx.shadowBlur = 4 + n.act * 14;
      ctx.globalAlpha = 0.35 + n.act * 0.65;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 3 + n.act * 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    const dt = prev ? Math.min(t - prev, 50) : 16;
    prev = t;
    if (t > nextWave) { wave(); nextWave = t + 1800; }

    // advance pulses; on arrival light the node and pass the signal on
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += dt * p.v;
      if (p.t >= 1) {
        const n = p.e.b;
        n.act = 1;
        pulses.splice(i, 1);
        if (n.out.length) n.out.slice().sort(() => Math.random() - 0.5).slice(0, 3).forEach(send);
      }
    }
    nodes.forEach(n => { n.act = Math.max(0, n.act - dt * 0.0012); });
    updatePositions(t);
    draw(t);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf) { prev = 0; raf = requestAnimationFrame(loop); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  new ResizeObserver(resize).observe(canvas);
  if (!still) new IntersectionObserver(e => (e[0].isIntersecting ? start() : stop())).observe(canvas);
})();