import { clamp01, journeyPose } from "./journey-path.mjs";

/** Scroll guides the camera; free exploration is an explicit, reversible choice. */
export function createPointJourney({
  THREE,
  root,
  stage,
  camera,
  controls,
  geometry,
  material,
  renderer,
  data,
  draw,
  on,
  reduce,
}) {
  const viewport = root.querySelector(".journey-viewport");
  const cards = [...root.querySelectorAll("[data-journey-copy]")];
  const steps = [...root.querySelectorAll("[data-journey-step]")];
  const colourButtons = [...root.querySelectorAll("[data-journey-colour]")];
  const hotspot = root.querySelector(".journey-hotspot");
  const progressBar = root.querySelector("[data-journey-meter]");
  const compact = matchMedia("(max-width: 900px)");
  const colours = new Float32Array(data.linearRGB.length);
  const mint = new THREE.Color("#a6d3bb");
  const neutral = new Float32Array(colours.length);
  const neutralRGB = new Uint8Array(colours.length);
  const srgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  for (let i = 0; i < colours.length; i += 3) {
    const luminance =
      data.linearRGB[i] * 0.2126 + data.linearRGB[i + 1] * 0.7152 + data.linearRGB[i + 2] * 0.0722;
    const height = clamp01((data.positions[i + 1] + 0.22) / 0.44);
    const shade = Math.min(0.96, 0.18 + Math.sqrt(luminance) * 0.7 + height * 0.18);
    neutral[i] = mint.r * shade;
    neutral[i + 1] = mint.g * shade;
    neutral[i + 2] = mint.b * shade;
    for (let c = 0; c < 3; c++) neutralRGB[i + c] = Math.round(srgb(neutral[i + c]) * 255);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  const radius = geometry.boundingSphere.radius;
  const pointStyle = { colour: 0, reveal: 1, size: 0.0078, geometryRGB: neutralRGB };
  renderer.cloudStyle = pointStyle;
  let desired = 0,
    current = 0,
    manualColour = null,
    colour = -1,
    active = false;
  let pointerX = 0,
    pointerY = 0,
    x = 0,
    y = 0,
    phase = -1,
    introStart = null;
  let lastProgress = -1,
    lastReveal = -1,
    disposed = false;
  const startPositions = [0, 0.5, 0.995];
  const pin = new THREE.Vector3(0.12, 0.04, 0.15);
  material.size = pointStyle.size;
  controls.autoRotate = false;
  controls.minDistance = radius * 0.6;
  controls.maxDistance = radius * 14;

  function updatePhase(next) {
    if (phase === next) return;
    phase = next;
    root.dataset.journeyPhase = String(phase);
    cards.forEach((card, i) => {
      card.setAttribute("aria-hidden", String(i !== phase));
      card.inert = i !== phase;
    });
    steps.forEach((button, i) => button.setAttribute("aria-pressed", String(i === phase)));
  }
  function readScroll() {
    if (reduce.matches) return;
    const top = parseFloat(getComputedStyle(viewport).top) || 0;
    const travel = Math.max(1, root.offsetHeight - viewport.offsetHeight);
    desired = clamp01((top - root.getBoundingClientRect().top) / travel);
    draw();
  }
  function goTo(value) {
    manualColour = null;
    if (reduce.matches) {
      desired = current = value;
      draw();
      return;
    }
    const top = parseFloat(getComputedStyle(viewport).top) || 0;
    const travel = Math.max(0, root.offsetHeight - viewport.offsetHeight);
    window.scrollTo({
      top: scrollY + root.getBoundingClientRect().top - top + travel * value,
      behavior: "smooth",
    });
  }
  function projectPin() {
    if (!hotspot) return;
    const projected = pin.clone().project(camera);
    const width = stage.clientWidth,
      height = stage.clientHeight;
    const left = (projected.x * 0.5 + 0.5) * width;
    const top = (0.5 - projected.y * 0.5) * height;
    hotspot.style.left = `${Math.max(20, Math.min(width - hotspot.offsetWidth - 20, left))}px`;
    hotspot.style.top = `${Math.max(compact.matches ? 280 : 100, Math.min(height - 150, top))}px`;
  }
  function setColour(next) {
    if (Math.abs(next - colour) < 0.001 && colour >= 0) return;
    colour = next;
    pointStyle.colour = next;
    const inverse = 1 - next;
    for (let i = 0; i < colours.length; i += 3) {
      colours[i] = data.linearRGB[i] * next + neutral[i] * inverse;
      colours[i + 1] = data.linearRGB[i + 1] * next + neutral[i + 1] * inverse;
      colours[i + 2] = data.linearRGB[i + 2] * next + neutral[i + 2] * inverse;
    }
    geometry.attributes.color.needsUpdate = true;
    root.dataset.journeyColour = next > 0.5 ? "rgb" : "geometry";
    colourButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String((button.dataset.journeyColour === "rgb") === next > 0.5),
      ),
    );
  }
  function applyPose() {
    const pose = journeyPose(current, camera.aspect, radius, {
      compact: compact.matches,
      parallaxX: x,
      parallaxY: y,
    });
    camera.fov = pose.fov;
    camera.updateProjectionMatrix();
    camera.position.fromArray(pose.position);
    controls.target.fromArray(pose.target);
    camera.lookAt(controls.target);
    camera.updateMatrixWorld();
    controls.update();
    updatePhase(pose.phase);
    projectPin();
    if (Math.abs(current - lastProgress) > 0.002) {
      lastProgress = current;
      root.style.setProperty("--journey-progress", String(current));
      root.dataset.journeyProgress = current.toFixed(3);
      progressBar?.setAttribute("aria-valuenow", String(Math.round(current * 100)));
    }
    return pose;
  }
  function update(time, delta) {
    if (disposed) return false;
    if (introStart === null) introStart = time;
    const intro = reduce.matches ? 1 : clamp01((time - introStart) / 1200);
    const reveal = 0.18 + 0.82 * (1 - Math.pow(1 - intro, 3));
    let revealed = false;
    if (Math.abs(reveal - lastReveal) > 0.001 || (intro === 1 && lastReveal !== 1)) {
      lastReveal = reveal;
      geometry.setDrawRange(0, Math.ceil(data.count * reveal));
      pointStyle.reveal = reveal;
      revealed = true;
    }
    const alpha = reduce.matches ? 1 : 1 - Math.exp(-delta * 9);
    let moving = intro < 1;
    if (!active) {
      current += (desired - current) * alpha;
      x += (pointerX - x) * alpha;
      y += (pointerY - y) * alpha;
      if (Math.abs(current - desired) < 0.0002) current = desired;
      const pose = applyPose();
      const targetColour = manualColour ?? pose.colour;
      const next = colour < 0 ? targetColour : colour + (targetColour - colour) * alpha;
      setColour(Math.abs(next - targetColour) < 0.002 ? targetColour : next);
      moving ||=
        Math.abs(current - desired) > 0.0002 ||
        Math.abs(x - pointerX) > 0.0003 ||
        Math.abs(y - pointerY) > 0.0003 ||
        Math.abs(colour - targetColour) > 0.002;
    } else {
      if (manualColour !== null) setColour(manualColour);
      projectPin();
    }
    return moving || revealed;
  }
  on(window, "scroll", readScroll, { passive: true });
  on(
    root,
    "pointermove",
    (event) => {
      if (active || reduce.matches || event.pointerType === "touch") return;
      const box = viewport.getBoundingClientRect();
      pointerX = ((event.clientX - box.left) / box.width - 0.5) * 2;
      pointerY = ((event.clientY - box.top) / box.height - 0.5) * 2;
      draw();
    },
    { passive: true },
  );
  on(root, "pointerleave", () => {
    pointerX = pointerY = 0;
    draw();
  });
  on(root, "click", (event) => {
    const step = event.target.closest("[data-journey-step]");
    if (step) goTo(startPositions[Number(step.dataset.journeyStep)]);
    if (event.target.closest("[data-journey-begin]")) goTo(0.5);
    const button = event.target.closest("button[data-journey-colour]");
    if (button) {
      manualColour = button.dataset.journeyColour === "rgb" ? 1 : 0;
      draw();
    }
  });
  function motionPreference() {
    root.classList.toggle("journey-reduced", reduce.matches);
    pointerX = pointerY = 0;
    readScroll();
    draw();
  }
  on(reduce, "change", motionPreference);
  on(compact, "change", () => {
    readScroll();
    draw();
  });
  motionPreference();
  updatePhase(0);
  setColour(0);
  return {
    update,
    resize() {
      readScroll();
      if (!active) applyPose();
      else projectPin();
      draw();
    },
    setActive(value) {
      active = value;
      root.classList.toggle("journey-exploring", active);
      cards.forEach((card, i) => {
        card.setAttribute("aria-hidden", String(active || i !== phase));
        card.inert = active || i !== phase;
      });
      if (active) {
        const target = new THREE.Vector3(0, -0.015, 0);
        camera.position.add(target.clone().sub(controls.target));
        controls.target.copy(target);
        controls.update();
      } else {
        controls.autoRotate = false;
        current = desired;
        manualColour = null;
        draw();
      }
      root.querySelector('[data-pc-action="interact"]').textContent = value
        ? document.documentElement.lang.startsWith("en")
          ? "Back to the journey"
          : "Voltar à viagem"
        : document.documentElement.lang.startsWith("en")
          ? "Explore freely"
          : "Explorar livremente";
    },
    reset() {
      if (active) {
        const pose = journeyPose(0.5, camera.aspect, radius, { compact: compact.matches });
        const offset = new THREE.Vector3()
          .fromArray(pose.position)
          .sub(new THREE.Vector3().fromArray(pose.target));
        controls.target.set(0, -0.015, 0);
        camera.position.copy(offset).add(controls.target);
        controls.update();
      } else goTo(0);
      draw();
    },
    dispose() {
      disposed = true;
    },
  };
}
