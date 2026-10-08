(function () {
  const canvas = document.getElementById('hand-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // curl per finger: thumb, index, middle, ring, pinky (0 = straight, 1 = curled)
  const GESTURES = [
    { name: 'OPEN PALM',  curl: [0, 0, 0, 0, 0] },
    { name: 'FIST',       curl: [1, 1, 1, 1, 1] },
    { name: 'PEACE',      curl: [1, 0, 0, 1, 1] },
    { name: 'POINT',      curl: [1, 0, 1, 1, 1] },
    { name: 'THUMBS UP',  curl: [0, 1, 1, 1, 1] },
    { name: 'I LOVE YOU', curl: [0, 0, 1, 1, 0] }
  ];

  // base joint, spread angle, segment lengths, max bend per joint (units = palm length)
  const FINGERS = [
    { mcp: [-0.30, -0.25], base: -0.70, len: [0.38, 0.28, 0.24], bend: [0.55, 0.60, 0.50], thumb: true },
    { mcp: [-0.33, -0.95], base: -0.10, len: [0.42, 0.26, 0.20], bend: [1.35, 1.50, 0.90] },
    { mcp: [-0.11, -1.00], base: -0.02, len: [0.48, 0.30, 0.22], bend: [1.35, 1.50, 0.90] },
    { mcp: [ 0.11, -0.95], base:  0.06, len: [0.44, 0.28, 0.21], bend: [1.35, 1.50, 0.90] },
    { mcp: [ 0.32, -0.85], base:  0.16, len: [0.34, 0.20, 0.18], bend: [1.35, 1.50, 0.90] }
  ];

  // 21 landmarks in the same order as MediaPipe Hands
  function buildHand(curl) {
    const pts = [[0, 0]];
    FINGERS.forEach((f, i) => {
      let x = f.mcp[0], y = f.mcp[1];
      pts.push([x, y]);
      let ang = f.base, theta = 0;
      for (let k = 0; k < 3; k++) {
        if (f.thumb) {
          ang += curl[i] * f.bend[k];
          x += f.len[k] * Math.sin(ang);
          y -= f.len[k] * Math.cos(ang);
        } else {
          theta += curl[i] * f.bend[k];
          const p = f.len[k] * Math.cos(theta);   // foreshortened as the finger curls
          x += p * Math.sin(f.base);
          y -= p * Math.cos(f.base);
        }
        pts.push([x, y]);
      }
    });
    return pts;
  }

  const BONES = [];
  [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]
    .forEach(c => { for (let i = 0; i < 3; i++) BONES.push([c[i], c[i + 1]]); });
  [[0, 1], [0, 5], [5, 9], [9, 13], [13, 17], [0, 17]].forEach(b => BONES.push(b));

  let gi = still ? 2 : 0;
  const cur = GESTURES[gi].curl.slice();
  const box = { x0: 0, y0: 0, x1: 0, y1: 0, init: false };
  let W = 0, H = 0, tx = 0, ty = 0, mx = 0, my = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (still) draw(0, 16);
  }

  function draw(t, dt) {
    if (!W || !H) return;
    const cs = getComputedStyle(document.documentElement);
    const color = cs.getPropertyValue('--main-color').trim() || '#2dd4bf';
    const bg = cs.getPropertyValue('--bg-color').trim() || '#0b1220';
    ctx.clearRect(0, 0, W, H);

    const S = Math.min(W * 0.4, H * 0.36);          // palm length in pixels
    const rot = Math.sin(t * 0.0007) * 0.06 + mx * 0.22;
    const bob = Math.sin(t * 0.0012) * S * 0.03 + my * S * 0.06;
    const ox = W / 2, oy = H / 2 + S + bob;          // wrist position
    const cs_ = Math.cos(rot), sn = Math.sin(rot);
    const P = buildHand(cur).map(([x, y]) => [
      ox + (x * cs_ - y * sn) * S,
      oy + (x * sn + y * cs_) * S
    ]);

    // slow rotating dashed rings
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.strokeStyle = color; ctx.globalAlpha = 0.18; ctx.lineWidth = 1;
    ctx.setLineDash([4, 10]); ctx.rotate(t * 0.00015);
    ctx.beginPath(); ctx.arc(0, 0, Math.min(W, H) * 0.46, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([2, 14]); ctx.rotate(-t * 0.0003);
    ctx.beginPath(); ctx.arc(0, 0, Math.min(W, H) * 0.38, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // skeleton
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.lineWidth = Math.max(2, S * 0.018);
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    BONES.forEach(([a, b]) => { ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); });
    ctx.stroke();
    ctx.globalAlpha = 1;
    P.forEach(([x, y], i) => {
      const tip = i > 0 && i % 4 === 0;
      ctx.beginPath();
      ctx.arc(x, y, S * (i === 0 ? 0.035 : tip ? 0.032 : 0.022), 0, Math.PI * 2);
      ctx.fill();
    });

    // detection box that follows the hand
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    P.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    const pad = S * 0.18;
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
    if (!box.init) { box.x0 = x0; box.y0 = y0; box.x1 = x1; box.y1 = y1; box.init = true; }
    const k = 1 - Math.exp(-dt * 0.008);
    box.x0 += (x0 - box.x0) * k; box.y0 += (y0 - box.y0) * k;
    box.x1 += (x1 - box.x1) * k; box.y1 += (y1 - box.y1) * k;

    ctx.shadowBlur = 0; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
    const b = S * 0.16;
    ctx.beginPath();
    [[box.x0, box.y0, 1, 1], [box.x1, box.y0, -1, 1], [box.x0, box.y1, 1, -1], [box.x1, box.y1, -1, -1]]
      .forEach(([x, y, sx, sy]) => { ctx.moveTo(x + sx * b, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * b); });
    ctx.stroke();

    // label tab
    const fs = Math.max(11, S * 0.075);
    const label = 'gesture: ' + GESTURES[gi].name;
    ctx.font = '600 ' + fs + 'px ui-monospace, Menlo, Consolas, monospace';
    ctx.textBaseline = 'middle'; ctx.globalAlpha = 1;
    const tw = ctx.measureText(label).width + fs;
    ctx.fillStyle = color;
    ctx.fillRect(box.x0, box.y0 - fs * 1.9, tw, fs * 1.6);
    ctx.fillStyle = bg;
    ctx.fillText(label, box.x0 + fs / 2, box.y0 - fs * 1.1);
    ctx.restore();
  }

  let raf = 0, prev = 0, nextAt = 1800;
  function loop(t) {
    const dt = prev ? Math.min(t - prev, 50) : 16;
    prev = t;
    if (t > nextAt) { gi = (gi + 1) % GESTURES.length; nextAt = t + 2300; }
    const target = GESTURES[gi].curl;
    const k = 1 - Math.exp(-dt * 0.008);
    for (let i = 0; i < 5; i++) cur[i] += (target[i] - cur[i]) * k;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    draw(t, dt);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf) { prev = 0; raf = requestAnimationFrame(loop); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  new ResizeObserver(resize).observe(canvas);
  if (!still) {
    window.addEventListener('mousemove', e => {
      tx = (e.clientX / innerWidth - 0.5) * 2;
      ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
    new IntersectionObserver(e => (e[0].isIntersecting ? start() : stop())).observe(canvas);
  }
})();