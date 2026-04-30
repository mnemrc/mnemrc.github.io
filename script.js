const canvas = document.querySelector("#signal-field");
const ctx = canvas.getContext("2d");
const intensityInput = document.querySelector("#intensity");
const pulseValue = document.querySelector("#pulse-value");
const profileValue = document.querySelector("#profile-value");
const modeValue = document.querySelector("#mode-value");
const shuffleButton = document.querySelector("#shuffle");
const meter = document.querySelector(".signal-meter span");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const profiles = [
  { label: "ADS-B receiver", mode: "Radar feed", hueShift: 0, drift: 0.026, sweep: 1 },
  { label: "Network edge", mode: "Gateway watch", hueShift: 38, drift: 0.034, sweep: 1.25 },
  { label: "Stats uplink", mode: "Telemetry flow", hueShift: 74, drift: 0.02, sweep: 0.78 },
  { label: "Flight tracks", mode: "Range scan", hueShift: 112, drift: 0.03, sweep: 1.08 },
];

const state = {
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  width: 0,
  height: 0,
  intensity: Number(intensityInput.value),
  hueShift: 0,
  profileIndex: 0,
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
      heading: Math.random() * Math.PI * 2,
      kind: index % 7 === 0 ? "aircraft" : index % 5 === 0 ? "relay" : "packet",
    };
  });
}

function drawBackground(time) {
  ctx.clearRect(0, 0, state.width, state.height);

  const profile = profiles[state.profileIndex];
  const centerX = state.width * 0.58;
  const centerY = state.height * 0.4;
  const range = Math.max(state.width, state.height) * 0.68;
  const sweepAngle = (time * 0.00072 * profile.sweep) % (Math.PI * 2);

  const glow = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    range
  );
  glow.addColorStop(0, `hsla(${154 + state.hueShift}, 84%, 58%, 0.2)`);
  glow.addColorStop(0.38, "rgba(56, 220, 232, 0.1)");
  glow.addColorStop(0.76, "rgba(255, 200, 87, 0.045)");
  glow.addColorStop(1, "rgba(9, 13, 13, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.strokeStyle = "rgba(136, 240, 166, 0.15)";
  ctx.lineWidth = 1;

  for (let i = 1; i <= 5; i += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, (range / 6) * i, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 8; i += 1) {
    const bearing = (Math.PI * 2 * i) / 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(bearing) * range, Math.sin(bearing) * range);
    ctx.strokeStyle = i % 2 === 0 ? "rgba(56, 220, 232, 0.15)" : "rgba(255, 255, 255, 0.06)";
    ctx.stroke();
  }

  ctx.rotate(sweepAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, range, -0.38, 0.03);
  ctx.closePath();
  ctx.fillStyle = "rgba(136, 240, 166, 0.105)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(range, 0);
  ctx.strokeStyle = "rgba(136, 240, 166, 0.62)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 24;
  ctx.shadowColor = "rgba(136, 240, 166, 0.8)";
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function updateNodes(time) {
  const pull = state.intensity / 100;
  const profile = profiles[state.profileIndex];
  const centerX = state.width * 0.5;
  const centerY = state.height * 0.4;

  for (const node of state.nodes) {
    const drift = Math.sin(time * 0.00035 + node.orbit * Math.PI * 2) * profile.drift;
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
    if (Math.abs(node.vx) + Math.abs(node.vy) > 0.02) {
      node.heading = Math.atan2(node.vy, node.vx);
    }

    if (node.x < -40) node.x = state.width + 40;
    if (node.x > state.width + 40) node.x = -40;
    if (node.y < -40) node.y = state.height + 40;
    if (node.y > state.height + 40) node.y = -40;
  }
}

function colorFor(node, alpha) {
  const hues = [154 + state.hueShift, 186 + state.hueShift, 43 + state.hueShift];
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
        const alpha = (1 - distance / maxDistance) * 0.28;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(151, 255, 202, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

function drawNodes() {
  for (const node of state.nodes) {
    ctx.shadowBlur = node.kind === "aircraft" ? 28 : 18;
    ctx.shadowColor = colorFor(node, 0.7);
    ctx.fillStyle = colorFor(node, 0.92);

    if (node.kind === "aircraft") {
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(node.heading + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(4.8, 6);
      ctx.lineTo(0, 3.8);
      ctx.lineTo(-4.8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      continue;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.kind === "relay" ? node.r + 1.3 : node.r, 0, Math.PI * 2);
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
  ring.addColorStop(0.45, "rgba(136, 240, 166, 0.16)");
  ring.addColorStop(1, "rgba(136, 240, 166, 0)");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(state.pointer.x, state.pointer.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.pointer.x, state.pointer.y, radius * 0.48, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(136, 240, 166, 0.46)";
  ctx.lineWidth = 1;
  ctx.stroke();
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

function updateProfile() {
  const profile = profiles[state.profileIndex];
  state.hueShift = profile.hueShift;
  profileValue.textContent = profile.label;
  modeValue.textContent = profile.mode;
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
  state.profileIndex = (state.profileIndex + 1) % profiles.length;
  updateProfile();
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
updateProfile();
window.requestAnimationFrame(render);
