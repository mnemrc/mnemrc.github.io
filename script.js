const canvas = document.querySelector("#signal-field");
const ctx = canvas.getContext("2d");
const intensityInput = document.querySelector("#intensity");
const pulseValue = document.querySelector("#pulse-value");
const shuffleButton = document.querySelector("#shuffle");
const meter = document.querySelector(".signal-meter span");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  width: 0,
  height: 0,
  intensity: Number(intensityInput.value),
  hueShift: 0,
  pointer: {
    x: 0,
    y: 0,
    active: false,
  },
  nodes: [],
};

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  seedNodes();
  requestStaticRender();
}

function seedNodes() {
  const area = state.width * state.height;
  const count = Math.max(44, Math.min(118, Math.floor(area / 15000)));

  state.nodes = Array.from({ length: count }, (_, index) => {
    const orbit = index / count;
    return {
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      vx: (Math.random() - 0.5) * 0.34,
      vy: (Math.random() - 0.5) * 0.34,
      r: 1.2 + Math.random() * 2.8,
      orbit,
      color: index % 3,
    };
  });
}

function drawBackground(time) {
  ctx.clearRect(0, 0, state.width, state.height);

  const glow = ctx.createRadialGradient(
    state.width * 0.5,
    state.height * 0.34,
    0,
    state.width * 0.5,
    state.height * 0.34,
    Math.max(state.width, state.height) * 0.72
  );
  glow.addColorStop(0, `hsla(${188 + state.hueShift}, 78%, 58%, 0.16)`);
  glow.addColorStop(0.42, "rgba(255, 122, 168, 0.08)");
  glow.addColorStop(0.72, "rgba(255, 200, 87, 0.05)");
  glow.addColorStop(1, "rgba(9, 13, 13, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.translate(state.width * 0.5, state.height * 0.42);
  ctx.rotate(Math.sin(time * 0.00016) * 0.08);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.075)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 220 + i * 95, 82 + i * 36, i * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function updateNodes(time) {
  const pull = state.intensity / 100;
  const centerX = state.width * 0.5;
  const centerY = state.height * 0.4;

  for (const node of state.nodes) {
    const drift = Math.sin(time * 0.00035 + node.orbit * Math.PI * 2) * 0.025;
    node.vx += (centerX - node.x) * 0.000005 * pull + drift;
    node.vy += (centerY - node.y) * 0.000004 * pull;

    if (state.pointer.active) {
      const dx = state.pointer.x - node.x;
      const dy = state.pointer.y - node.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < 260) {
        const force = (1 - distance / 260) * 0.028 * pull;
        node.vx += (dx / distance) * force;
        node.vy += (dy / distance) * force;
      }
    }

    node.vx *= 0.986;
    node.vy *= 0.986;
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < -40) node.x = state.width + 40;
    if (node.x > state.width + 40) node.x = -40;
    if (node.y < -40) node.y = state.height + 40;
    if (node.y > state.height + 40) node.y = -40;
  }
}

function colorFor(node, alpha) {
  const hues = [186 + state.hueShift, 137 + state.hueShift, 338 + state.hueShift];
  return `hsla(${hues[node.color]}, 88%, 66%, ${alpha})`;
}

function drawConnections() {
  const maxDistance = 132 + state.intensity * 1.2;

  for (let i = 0; i < state.nodes.length; i += 1) {
    for (let j = i + 1; j < state.nodes.length; j += 1) {
      const a = state.nodes[i];
      const b = state.nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);

      if (distance < maxDistance) {
        const alpha = (1 - distance / maxDistance) * 0.32;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(210, 244, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

function drawNodes() {
  for (const node of state.nodes) {
    ctx.beginPath();
    ctx.fillStyle = colorFor(node, 0.9);
    ctx.shadowBlur = 22;
    ctx.shadowColor = colorFor(node, 0.78);
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawPointer() {
  if (!state.pointer.active) return;

  const radius = 46 + state.intensity * 0.9;
  const ring = ctx.createRadialGradient(
    state.pointer.x,
    state.pointer.y,
    0,
    state.pointer.x,
    state.pointer.y,
    radius
  );
  ring.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  ring.addColorStop(0.45, "rgba(56, 220, 232, 0.12)");
  ring.addColorStop(1, "rgba(56, 220, 232, 0)");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(state.pointer.x, state.pointer.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawFrame(time) {
  drawBackground(time);
  if (!prefersReducedMotion.matches) {
    updateNodes(time);
  }
  drawConnections();
  drawPointer();
  drawNodes();
}

function render(time) {
  drawFrame(time);
  if (!prefersReducedMotion.matches) {
    window.requestAnimationFrame(render);
  }
}

function requestStaticRender() {
  if (prefersReducedMotion.matches) {
    window.requestAnimationFrame(drawFrame);
  }
}

function updateIntensity(value) {
  state.intensity = Number(value);
  pulseValue.textContent = `${state.intensity}%`;
  meter.style.setProperty("--level", `${state.intensity}%`);
}

window.addEventListener("resize", resize);

window.addEventListener("pointermove", (event) => {
  state.pointer.x = event.clientX;
  state.pointer.y = event.clientY;
  state.pointer.active = true;
  requestStaticRender();
});

window.addEventListener("pointerleave", () => {
  state.pointer.active = false;
  requestStaticRender();
});

intensityInput.addEventListener("input", (event) => {
  updateIntensity(event.target.value);
  requestStaticRender();
});

shuffleButton.addEventListener("click", () => {
  state.hueShift = (state.hueShift + 42) % 360;
  seedNodes();
  requestStaticRender();
});

if (typeof prefersReducedMotion.addEventListener === "function") {
  prefersReducedMotion.addEventListener("change", () => {
    window.requestAnimationFrame(render);
  });
} else if (typeof prefersReducedMotion.addListener === "function") {
  prefersReducedMotion.addListener(() => {
    window.requestAnimationFrame(render);
  });
}

resize();
updateIntensity(state.intensity);
window.requestAnimationFrame(render);
