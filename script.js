const canvas = document.querySelector("#signal-field");
const ctx = canvas.getContext("2d");
const intensityInput = document.querySelector("#intensity");
const pulseValue = document.querySelector("#pulse-value");
const profileValue = document.querySelector("#profile-value");
const modeValue = document.querySelector("#mode-value");
const shuffleButton = document.querySelector("#shuffle");
const meter = document.querySelector(".signal-meter span");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const TAU = Math.PI * 2;

const profiles = [
  { label: "ADS-B live scope", mode: "Radar sweep", hueShift: 0, drift: 1, sweep: 1, rangeNm: 120 },
  { label: "North sector", mode: "CTR overlay", hueShift: 12, drift: 0.72, sweep: 0.82, rangeNm: 90 },
  { label: "Approach feed", mode: "Terminal scan", hueShift: -8, drift: 1.18, sweep: 1.28, rangeNm: 60 },
  { label: "High airway", mode: "En-route watch", hueShift: 20, drift: 0.9, sweep: 0.96, rangeNm: 180 },
];

const airlinePrefixes = [
  "ITY",
  "RYR",
  "EZY",
  "DLH",
  "AFR",
  "WZZ",
  "SWR",
  "VLG",
  "UAE",
  "QTR",
  "BAW",
  "KLM",
  "EJU",
  "VOE",
  "SAS",
  "THY",
  "IBE",
  "TAP",
  "EIN",
  "LOT",
  "AUA",
  "FIN",
  "NAX",
  "TUI",
  "BEL",
  "TRA",
  "CFG",
  "PGT",
  "ELY",
  "MSR",
  "SVA",
  "NJE",
];

const aircraftTypes = ["A320", "A21N", "B738", "B38M", "E195", "A359", "B789", "B77W", "AT76", "C56X"];
const suffixes = ["", "A", "B", "KM", "TH", "CN", "PE", "HZ", "EV", "LX"];

const state = {
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  width: 0,
  height: 0,
  targetCount: Number(intensityInput.value),
  hueShift: 0,
  profileIndex: 0,
  sweepAngle: 0,
  nextTrackId: 0,
  lastTime: 0,
  pointer: {
    x: 0,
    y: 0,
    active: false,
  },
  targets: [],
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function normalizeAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

function angleDistance(a, b) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, TAU - diff);
}

function makeSquawk(seed) {
  let squawk = "";
  for (let i = 0; i < 4; i += 1) {
    squawk += String((seed + i * 3 + randomInt(0, 7)) % 8);
  }
  return squawk;
}

function makeCallsign(id) {
  const prefix = airlinePrefixes[id % airlinePrefixes.length];
  const flightNumber = 100 + ((id * 73 + randomInt(0, 480)) % 8800);
  const suffix = suffixes[(id + randomInt(0, suffixes.length - 1)) % suffixes.length];
  return `${prefix}${flightNumber}${suffix}`;
}

function createTarget() {
  const id = state.nextTrackId;
  state.nextTrackId += 1;

  const flightLevel = Math.round(randomBetween(45, 410) / 10) * 10;
  const bearing = randomBetween(0, TAU);

  return {
    id,
    callsign: makeCallsign(id),
    type: aircraftTypes[id % aircraftTypes.length],
    squawk: makeSquawk(id),
    altitude: `FL${String(flightLevel).padStart(3, "0")}`,
    speed: randomInt(145, 486),
    bearing,
    distance: Math.sqrt(randomBetween(0.03, 0.96)),
    heading: normalizeAngle(bearing + randomBetween(-1.1, 1.1)),
    angularVelocity: randomBetween(-0.000012, 0.000012),
    radialVelocity: randomBetween(-0.000006, 0.000006),
    priority: Math.random(),
  };
}

function syncTargetCount() {
  while (state.targets.length < state.targetCount) {
    state.targets.push(createTarget());
  }

  if (state.targets.length > state.targetCount) {
    state.targets.length = state.targetCount;
  }
}

function resize() {
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  syncTargetCount();
  requestStaticRender();
}

function getRadarGeometry() {
  const compact = state.width < 760;
  const centerX = compact ? state.width * 0.52 : state.width * 0.64;
  const centerY = compact ? state.height * 0.45 : state.height * 0.46;
  const radius = compact
    ? Math.min(state.width * 0.62, state.height * 0.46)
    : Math.min(state.width * 0.58, state.height * 0.78);

  return { centerX, centerY, radius };
}

function projectTarget(target, radar) {
  return {
    x: radar.centerX + Math.sin(target.bearing) * radar.radius * target.distance,
    y: radar.centerY - Math.cos(target.bearing) * radar.radius * target.distance,
  };
}

function roundedRectPath(x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  ctx.moveTo(x + corner, y);
  ctx.lineTo(x + width - corner, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + corner);
  ctx.lineTo(x + width, y + height - corner);
  ctx.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  ctx.lineTo(x + corner, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - corner);
  ctx.lineTo(x, y + corner);
  ctx.quadraticCurveTo(x, y, x + corner, y);
}

function drawRadarBase(time, radar) {
  const profile = profiles[state.profileIndex];
  state.sweepAngle = (time * 0.00056 * profile.sweep) % TAU;

  ctx.clearRect(0, 0, state.width, state.height);

  const glow = ctx.createRadialGradient(
    radar.centerX,
    radar.centerY,
    0,
    radar.centerX,
    radar.centerY,
    radar.radius * 1.35
  );
  glow.addColorStop(0, "rgba(47, 143, 255, 0.23)");
  glow.addColorStop(0.42, "rgba(20, 76, 172, 0.11)");
  glow.addColorStop(1, "rgba(0, 4, 12, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.save();
  ctx.translate(radar.centerX, radar.centerY);

  const scope = ctx.createRadialGradient(0, 0, 0, 0, 0, radar.radius);
  scope.addColorStop(0, "rgba(13, 52, 104, 0.25)");
  scope.addColorStop(0.74, "rgba(4, 15, 36, 0.11)");
  scope.addColorStop(1, "rgba(1, 5, 13, 0)");
  ctx.fillStyle = scope;
  ctx.beginPath();
  ctx.arc(0, 0, radar.radius, 0, TAU);
  ctx.fill();

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(91, 171, 255, 0.22)";

  for (let i = 1; i <= 5; i += 1) {
    const ringRadius = (radar.radius / 5) * i;
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = "rgba(156, 205, 255, 0.45)";
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${Math.round((profile.rangeNm / 5) * i)} NM`, ringRadius + 6, -6);
  }

  for (let degree = 0; degree < 360; degree += 30) {
    const bearing = (degree / 360) * TAU;
    const x = Math.sin(bearing) * radar.radius;
    const y = -Math.cos(bearing) * radar.radius;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x, y);
    ctx.strokeStyle = degree % 90 === 0 ? "rgba(96, 186, 255, 0.28)" : "rgba(86, 150, 230, 0.12)";
    ctx.stroke();
  }

  for (let degree = 0; degree < 360; degree += 10) {
    const bearing = (degree / 360) * TAU;
    const tickOuter = radar.radius;
    const tickInner = radar.radius - (degree % 30 === 0 ? 12 : 6);
    ctx.beginPath();
    ctx.moveTo(Math.sin(bearing) * tickInner, -Math.cos(bearing) * tickInner);
    ctx.lineTo(Math.sin(bearing) * tickOuter, -Math.cos(bearing) * tickOuter);
    ctx.strokeStyle = "rgba(132, 197, 255, 0.28)";
    ctx.stroke();
  }

  const labels = [
    ["N", 0],
    ["030", 30],
    ["060", 60],
    ["E", 90],
    ["120", 120],
    ["150", 150],
    ["S", 180],
    ["210", 210],
    ["240", 240],
    ["W", 270],
    ["300", 300],
    ["330", 330],
  ];

  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(186, 222, 255, 0.56)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [label, degree] of labels) {
    const bearing = (degree / 360) * TAU;
    ctx.fillText(label, Math.sin(bearing) * (radar.radius + 20), -Math.cos(bearing) * (radar.radius + 20));
  }

  for (let i = 0; i < 14; i += 1) {
    const start = state.sweepAngle - Math.PI / 2 - i * 0.033;
    const end = state.sweepAngle - Math.PI / 2 - (i + 1) * 0.033;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radar.radius, start, end, true);
    ctx.closePath();
    ctx.fillStyle = `rgba(${62 + profile.hueShift}, ${170 + profile.hueShift}, 255, ${0.074 - i * 0.004})`;
    ctx.fill();
  }

  const sweepX = Math.sin(state.sweepAngle) * radar.radius;
  const sweepY = -Math.cos(state.sweepAngle) * radar.radius;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(sweepX, sweepY);
  ctx.strokeStyle = "rgba(102, 199, 255, 0.82)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 22;
  ctx.shadowColor = "rgba(54, 217, 255, 0.78)";
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, TAU);
  ctx.fillStyle = "rgba(198, 232, 255, 0.92)";
  ctx.fill();

  ctx.restore();
}

function updateTargets(time) {
  const profile = profiles[state.profileIndex];
  const elapsed = state.lastTime ? Math.min(48, time - state.lastTime) : 16;
  state.lastTime = time;

  for (const target of state.targets) {
    target.bearing = normalizeAngle(target.bearing + target.angularVelocity * elapsed * profile.drift);
    target.distance += target.radialVelocity * elapsed * profile.drift;
    target.heading = normalizeAngle(target.heading + Math.sin(time * 0.00032 + target.id) * 0.00042 * elapsed);

    if (target.distance > 0.98 || target.distance < 0.08) {
      target.radialVelocity *= -1;
      target.distance = Math.max(0.08, Math.min(0.98, target.distance));
    }
  }
}

function shouldDrawLabel(target, count, sweepLift) {
  if (count <= 42) return true;
  if (sweepLift > 0.62) return true;
  return target.priority > 0.58;
}

function drawTargetLabel(target, point, radar, alpha) {
  const side = point.x >= radar.centerX ? 1 : -1;
  const labelX = point.x + side * 12;
  const labelY = point.y - 16;
  const lines = [`${target.callsign} ${target.altitude}`, `${target.type} ${target.speed}KT SQ${target.squawk}`];

  ctx.save();
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.textAlign = side > 0 ? "left" : "right";
  ctx.textBaseline = "top";

  const width = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const rectX = side > 0 ? labelX - 5 : labelX - width - 5;
  const rectY = labelY - 4;

  ctx.fillStyle = `rgba(1, 7, 18, ${0.44 * alpha})`;
  ctx.strokeStyle = `rgba(91, 185, 255, ${0.28 * alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  roundedRectPath(rectX, rectY, width + 10, 31, 4);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(point.x, point.y);
  ctx.lineTo(labelX - side * 5, labelY + 6);
  ctx.strokeStyle = `rgba(109, 199, 255, ${0.34 * alpha})`;
  ctx.stroke();

  ctx.fillStyle = `rgba(218, 241, 255, ${0.86 * alpha})`;
  ctx.fillText(lines[0], labelX, labelY);
  ctx.fillStyle = `rgba(141, 191, 239, ${0.7 * alpha})`;
  ctx.fillText(lines[1], labelX, labelY + 14);
  ctx.restore();
}

function drawTargets(radar) {
  const count = state.targets.length;
  let labelsDrawn = 0;
  const maxLabels = count <= 42 ? count : 54;

  for (const target of state.targets) {
    const point = projectTarget(target, radar);
    const sweepLift = Math.max(0, 1 - angleDistance(target.bearing, state.sweepAngle) / 0.52);
    const alpha = 0.38 + sweepLift * 0.58;
    const size = 2.2 + sweepLift * 2.4 + target.priority * 1.1;

    ctx.save();
    ctx.shadowBlur = 8 + sweepLift * 22;
    ctx.shadowColor = "rgba(76, 183, 255, 0.82)";

    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, TAU);
    ctx.fillStyle = `rgba(131, 212, 255, ${alpha})`;
    ctx.fill();

    const vectorLength = 12 + Math.min(22, target.speed / 24);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(
      point.x + Math.sin(target.heading) * vectorLength,
      point.y - Math.cos(target.heading) * vectorLength
    );
    ctx.strokeStyle = `rgba(131, 212, 255, ${0.32 + sweepLift * 0.38})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (sweepLift > 0.48) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10 + sweepLift * 14, 0, TAU);
      ctx.strokeStyle = `rgba(99, 199, 255, ${0.3 * sweepLift})`;
      ctx.stroke();
    }

    ctx.restore();

    if (labelsDrawn < maxLabels && shouldDrawLabel(target, count, sweepLift)) {
      drawTargetLabel(target, point, radar, 0.68 + sweepLift * 0.32);
      labelsDrawn += 1;
    }
  }
}

function drawPointer(radar) {
  if (!state.pointer.active) return;

  const dx = state.pointer.x - radar.centerX;
  const dy = radar.centerY - state.pointer.y;
  const distance = Math.hypot(dx, dy);
  if (distance > radar.radius) return;

  const profile = profiles[state.profileIndex];
  const rangeNm = Math.round((distance / radar.radius) * profile.rangeNm);
  const bearing = normalizeAngle(Math.atan2(dx, dy));
  const bearingText = String(Math.round((bearing / TAU) * 360)).padStart(3, "0");

  ctx.save();
  ctx.beginPath();
  ctx.arc(state.pointer.x, state.pointer.y, 22, 0, TAU);
  ctx.strokeStyle = "rgba(139, 211, 255, 0.48)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(state.pointer.x - 12, state.pointer.y);
  ctx.lineTo(state.pointer.x + 12, state.pointer.y);
  ctx.moveTo(state.pointer.x, state.pointer.y - 12);
  ctx.lineTo(state.pointer.x, state.pointer.y + 12);
  ctx.strokeStyle = "rgba(139, 211, 255, 0.38)";
  ctx.stroke();

  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillStyle = "rgba(214, 239, 255, 0.78)";
  ctx.fillText(`${bearingText} / ${rangeNm}NM`, state.pointer.x + 14, state.pointer.y + 16);
  ctx.restore();
}

function drawFrame(time = performance.now()) {
  const radar = getRadarGeometry();
  drawRadarBase(time, radar);

  if (!prefersReducedMotion.matches) {
    updateTargets(time);
  }

  drawTargets(radar);
  drawPointer(radar);
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
  const min = Number(intensityInput.min);
  const max = Number(intensityInput.max);
  state.targetCount = Number(value);
  pulseValue.textContent = `${state.targetCount} tracks`;
  meter.style.setProperty("--level", `${((state.targetCount - min) / (max - min)) * 100}%`);
  syncTargetCount();
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
  state.targets = [];
  syncTargetCount();
  requestStaticRender();
});

if (typeof prefersReducedMotion.addEventListener === "function") {
  prefersReducedMotion.addEventListener("change", () => {
    state.lastTime = 0;
    window.requestAnimationFrame(render);
  });
} else if (typeof prefersReducedMotion.addListener === "function") {
  prefersReducedMotion.addListener(() => {
    state.lastTime = 0;
    window.requestAnimationFrame(render);
  });
}

resize();
updateIntensity(state.targetCount);
updateProfile();
window.requestAnimationFrame(render);
