/* Charan Kandala portfolio: navigation, reveal, falling-code hero, project card tilt */
(() => {
  "use strict";
  const doc = document.documentElement;
  doc.classList.remove("no-js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ---------------------------------------------------------------- nav */
  const burger = document.getElementById("burger");
  const links = document.getElementById("navLinks");
  const setMenu = (open) => {
    links.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  burger.addEventListener("click", () => setMenu(!links.classList.contains("open")));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 860) setMenu(false); });

  // active link follows scroll position
  const navAnchors = [...document.querySelectorAll("[data-link]")];
  const sections = navAnchors.map((a) => document.getElementById(a.dataset.link)).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navAnchors.forEach((a) => a.classList.toggle("is-active", a.dataset.link === en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ------------------------------------------------------- falling code */
  const canvas = document.getElementById("codeRain");
  const hero = document.getElementById("home");
  const ctx = canvas.getContext("2d", { alpha: true });

  const COLORS = {
    kw: "#D83020",   // accent: keywords
    str: "#F5F1EE",  // warm off-white: strings and values
    pun: "#929788",  // muted sage: punctuation
    def: "#929788",  // muted sage: everything else
  };

  // Decorative snippets only. Nothing here runs.
  const SNIPPETS = [
    ["const createWebsite = () => {", '  return "Something amazing";', "};"],
    ["async def run_agent():", "    await workflow.execute()"],
    ["{", '  "status": "success",', '  "system": "active"', "}"],
    ['const response = await fetch("/api/projects");'],
    ["INITIALIZING SYSTEM...", "BUILD SUCCESSFUL", "WORKFLOW EXECUTED"],
    ["export default function Hero() {", "  return <Section id=\"home\" />;", "}"],
    ["GET /api/projects 200 OK", "POST /api/automations 201"],
    ["npm run build", "> compiled successfully"],
    ["const [open, setOpen] = useState(false);"],
    ["workflow.on(\"trigger\", async (e) => {", "  await agent.run(e.payload);", "});"],
    ['{ "route": "/about", "ok": true }'],
    ["import { motion } from \"framer\";"],
    ["def build_pipeline(steps):", "    for step in steps:", "        step.run()"],
    ["$ deploy --prod", "deployment ready"],
    ["<Route path=\"/work\" />"],
    ["return await db.projects.find();"],
    ["@media (max-width: 600px) {", "  .grid { gap: 12px; }", "}"],
    ["let ready = true;", "if (ready) launch();"],
  ];
  const SYMBOLS = ["{", "}", "(", ")", "[", "]", ";", "=>", "</>", "0", "1", "/", "*", "#", "$", "_", "&&", "||", "::", "<", ">", "=", "!", "?"];
  const KEYWORDS = /^(const|let|var|async|await|def|return|import|from|export|default|function|for|in|if|else|true|false|npm|run|deploy|GET|POST|INITIALIZING|SUCCESSFUL|EXECUTED|SYSTEM|BUILD|WORKFLOW|fetch|useState|compiled)$/;

  // split a line into coloured runs
  const tokenize = (line) => {
    const parts = line.match(/"[^"]*"|\w+|\s+|[^\w\s]/g) || [];
    return parts.map((t) => {
      let c = COLORS.def;
      if (t[0] === '"') c = COLORS.str;
      else if (KEYWORDS.test(t)) c = COLORS.kw;
      else if (/^[{}()[\];,.<>=:/*]+$/.test(t)) c = COLORS.pun;
      return { t, c };
    });
  };

  let W = 0, H = 0, dpr = 1;
  let streams = [];
  let running = false, visible = true, raf = 0, last = 0, frameGap = 0;

  const isSmall = () => window.innerWidth < 700;

  function layerConfig(small) {
    // size (px), speed (px/s), alpha, target stream count per 1000px of width
    const far  = { size: small ? 11 : 12, speed: 28, alpha: 0.7,  dens: small ? 4.5 : 3.4 };
    const mid  = { size: small ? 13 : 15, speed: 52, alpha: 0.92, dens: small ? 3.5 : 2.6 };
    const near = { size: 20,              speed: 86, alpha: 1,    dens: 2.0 };
    return small ? [far, mid] : [far, mid, near];
  }

  function build() {
    const rect = hero.getBoundingClientRect();
    const small = isSmall();
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = "top";

    frameGap = small ? 1000 / 30 : 0;
    streams = [];

    layerConfig(small).forEach((cfg, li) => {
      ctx.font = `${cfg.size}px ${mono()}`;
      const charW = ctx.measureText("M").width;
      const lineH = Math.round(cfg.size * 1.55);

      // code-block streams: lane-based so blocks in one layer never overlap sideways
      const laneW = Math.round(charW * 31);
      const laneCount = Math.max(1, Math.floor(W / laneW));
      const blocks = Math.min(laneCount, Math.max(1, Math.round((W / 1000) * cfg.dens)));
      const lanes = shuffle([...Array(laneCount).keys()]).slice(0, blocks);
      lanes.forEach((lane) => streams.push(makeBlock(cfg, li, lane, laneW, charW, lineH, true)));

      // symbol streams: narrow vertical columns of single characters
      const colW = Math.round(cfg.size * 1.9);
      const colCount = Math.floor(W / colW);
      const symN = Math.round((W / 1000) * cfg.dens * (small ? 2.2 : 3.4));
      shuffle([...Array(colCount).keys()]).slice(0, symN).forEach((c) => {
        streams.push(makeSymbols(cfg, li, c * colW + colW / 2, true));
      });
    });
  }

  function makeBlock(cfg, layer, lane, laneW, charW, lineH, initial) {
    const snip = SNIPPETS[(Math.random() * SNIPPETS.length) | 0];
    const lines = snip.map((l) => {
      const runs = tokenize(l);
      let x = 0;
      return runs.map((r) => { const o = { t: r.t, c: r.c, x }; x += r.t.length * charW; return o; });
    });
    const h = lines.length * lineH;
    return {
      kind: "block", cfg, layer, lane, laneW, lineH, lines, h,
      x: lane * laneW + Math.random() * 14,
      y: initial ? -h + Math.random() * (H + h) : -h - Math.random() * H * 0.5,
      v: cfg.speed * (0.8 + Math.random() * 0.45),
    };
  }

  function makeSymbols(cfg, layer, x, initial) {
    const n = 5 + ((Math.random() * 9) | 0);
    const lineH = Math.round(cfg.size * 1.5);
    return {
      kind: "sym", cfg, layer, x, n, lineH,
      chars: Array.from({ length: n }, () => SYMBOLS[(Math.random() * SYMBOLS.length) | 0]),
      h: n * lineH,
      y: initial ? -n * lineH + Math.random() * (H + n * lineH) : -n * lineH - Math.random() * H * 0.7,
      v: cfg.speed * (1.15 + Math.random() * 0.9),
      swap: 0,
    };
  }

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

  const mono = () => getComputedStyle(doc).getPropertyValue("--mono").trim() || "monospace";

  function draw() {
    ctx.clearRect(0, 0, W, H);
    let curSize = 0;
    for (const s of streams) {
      if (s.y > H || s.y + s.h < 0) continue;
      if (curSize !== s.cfg.size) { ctx.font = `${s.cfg.size}px ${mono()}`; curSize = s.cfg.size; }

      if (s.kind === "block") {
        const n = s.lines.length;
        for (let i = 0; i < n; i++) {
          const y = s.y + i * s.lineH;
          if (y < -s.lineH || y > H) continue;
          // the lowest line is the brightest, so the block reads as falling
          const trail = 0.38 + 0.62 * ((i + 1) / n);
          const edge = edgeFade(y);
          ctx.globalAlpha = s.cfg.alpha * trail * edge;
          for (const r of s.lines[i]) {
            ctx.fillStyle = r.c;
            ctx.fillText(r.t, s.x + r.x, y);
          }
        }
      } else {
        for (let i = 0; i < s.n; i++) {
          const y = s.y + i * s.lineH;
          if (y < -s.lineH || y > H) continue;
          const head = i === s.n - 1;
          const trail = head ? 1 : 0.12 + 0.7 * ((i + 1) / s.n);
          ctx.globalAlpha = s.cfg.alpha * trail * edgeFade(y);
          ctx.fillStyle = head ? COLORS.kw : i > s.n - 3 ? COLORS.str : COLORS.pun;
          ctx.fillText(s.chars[i], s.x, y);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  // soft fade in the top 10% and bottom 28% of the hero
  function edgeFade(y) {
    const t = y / H;
    if (t < 0.1) return Math.max(0, t / 0.1);
    if (t > 0.72) return Math.max(0, (1 - t) / 0.28);
    return 1;
  }

  function step(dt) {
    for (const s of streams) {
      s.y += s.v * dt;
      if (s.kind === "sym") {
        s.swap -= dt;
        if (s.swap <= 0) {
          s.swap = 0.12 + Math.random() * 0.35;
          s.chars[(Math.random() * s.n) | 0] = SYMBOLS[(Math.random() * SYMBOLS.length) | 0];
        }
      }
      if (s.y > H) {
        // respawn above the hero with a fresh snippet and speed
        if (s.kind === "block") {
          const charW = s.laneW / 31;
          Object.assign(s, makeBlock(s.cfg, s.layer, s.lane, s.laneW, charW, s.lineH, false));
        } else {
          Object.assign(s, makeSymbols(s.cfg, s.layer, s.x, false));
        }
      }
    }
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (frameGap && now - last < frameGap) return;
    const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
    last = now;
    step(dt);
    draw();
  }

  function start() {
    if (running || reduceMotion.matches || !visible || document.hidden) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function init() {
    stop();
    build();
    draw();                       // a first frame is always painted, even with reduced motion
    if (!reduceMotion.matches) start();
  }

  let resizeTimer;
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // ignore mobile address-bar height changes; only rebuild on real width changes
      if (window.innerWidth !== lastW || Math.abs(hero.offsetHeight - H) > 160) { lastW = window.innerWidth; init(); }
    }, 180);
  });
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0 }).observe(hero);
  }
  reduceMotion.addEventListener?.("change", init);
  init();

  /* --------------------------------------------- project card: cursor tilt */
  const MAX_TILT = 7; // degrees
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const cur = { rx: 0, ry: 0, lift: 0, glow: 0, px: 0, py: 0, mx: 50, my: 50 };
    const tgt = { rx: 0, ry: 0, lift: 0, glow: 0, px: 0, py: 0, mx: 50, my: 50 };
    let rect = null, ticking = false;

    const apply = () => {
      card.style.setProperty("--rx", cur.rx.toFixed(3) + "deg");
      card.style.setProperty("--ry", cur.ry.toFixed(3) + "deg");
      card.style.setProperty("--lift", cur.lift.toFixed(2) + "px");
      card.style.setProperty("--glow", cur.glow.toFixed(3));
      card.style.setProperty("--px", cur.px.toFixed(3));
      card.style.setProperty("--py", cur.py.toFixed(3));
      card.style.setProperty("--mx", cur.mx.toFixed(1) + "%");
      card.style.setProperty("--my", cur.my.toFixed(1) + "%");
    };

    // ease current values toward the target each frame: this is what makes it follow smoothly and reset without snapping
    const tick = () => {
      let moving = false;
      for (const k in cur) {
        const d = tgt[k] - cur[k];
        const rate = k === "mx" || k === "my" ? 0.35 : 0.14;
        if (Math.abs(d) > 0.002) { cur[k] += d * rate; moving = true; } else cur[k] = tgt[k];
      }
      apply();
      if (moving) requestAnimationFrame(tick); else ticking = false;
    };
    const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };

    const aim = (clientX, clientY) => {
      if (!rect) rect = card.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      tgt.mx = px * 100; tgt.my = py * 100;
      tgt.px = px - 0.5; tgt.py = py - 0.5;
      if (!reduceMotion.matches) {
        tgt.ry = (px - 0.5) * 2 * MAX_TILT;
        tgt.rx = (0.5 - py) * 2 * MAX_TILT;
        tgt.lift = -8;
      }
      tgt.glow = 1;
      kick();
    };

    const rest = () => {
      tgt.rx = 0; tgt.ry = 0; tgt.lift = 0; tgt.glow = 0; tgt.px = 0; tgt.py = 0;
      rect = null;
      kick();
    };

    card.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse" || !finePointer.matches) return;
      rect = card.getBoundingClientRect(); aim(e.clientX, e.clientY);
    });
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || !finePointer.matches) return;
      aim(e.clientX, e.clientY);
    });
    card.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") rest(); });
    window.addEventListener("scroll", () => { rect = null; }, { passive: true });
    window.addEventListener("resize", () => { rect = null; });

    // touch / pen: a tap gives a soft lit press instead of hover tilt
    card.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      card.classList.add("is-touch", "is-pressed");
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
      card.addEventListener(ev, (e) => { if (e.pointerType !== "mouse") card.classList.remove("is-pressed"); })
    );
  });
})();
