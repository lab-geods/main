import { decodePointCloud } from "./point-cloud-data.mjs";
import { CanvasPointRenderer } from "./point-cloud-canvas.mjs";

const en = document.documentElement.lang.startsWith("en");
const words = en
  ? {
      loading: "Loading the point cloud…",
      failed: "The 3D view could not be loaded.",
      retry: "Try again",
      explore: "Explore in 3D",
      finish: "Finish exploring",
      pause: "Pause rotation",
      play: "Rotate automatically",
      hint: "Drag to rotate · scroll or pinch to zoom",
      ready: "Point cloud ready",
    }
  : {
      loading: "A carregar a nuvem de pontos…",
      failed: "Não foi possível carregar a vista 3D.",
      retry: "Tentar novamente",
      explore: "Explorar em 3D",
      finish: "Terminar exploração",
      pause: "Parar rotação",
      play: "Rodar automaticamente",
      hint: "Arrasta para rodar · usa a roda do rato ou dois dedos para aproximar",
      ready: "Nuvem de pontos pronta",
    };

for (const root of document.querySelectorAll("[data-point-cloud]")) {
  const stage = root.querySelector(".pc-stage");
  const status = root.querySelector(".pc-status");
  const toolbar = root.querySelector(".pc-toolbar");
  const hint = root.querySelector(".pc-hint");
  const toggle = root.querySelector('[data-pc-action="interact"]');
  const retry = root.querySelector('[data-pc-action="retry"]');
  const adjustments = root.querySelector(".pc-adjustments");
  const full = root.dataset.pcMode === "full";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  let cleanup = () => {},
    starting = false,
    visible = false;

  async function start() {
    if (starting) return;
    starting = true;
    cleanup();
    stage.replaceChildren();
    root.dataset.pcReady = "false";
    root.setAttribute("aria-busy", "true");
    toolbar.hidden = true;
    retry.hidden = true;
    status.hidden = false;
    status.textContent = words.loading;
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), 20000);
    let renderer,
      geometry,
      material,
      texture,
      controls,
      frame = 0,
      disposed = false;
    let resizeObserver,
      stopEvents = new AbortController();
    const on = (target, event, callback, options = {}) =>
      target.addEventListener(event, callback, { ...options, signal: stopEvents.signal });
    cleanup = () => {
      disposed = true;
      clearTimeout(timeout);
      abort.abort();
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      stopEvents.abort();
      controls?.dispose();
      geometry?.dispose();
      material?.dispose();
      texture?.dispose();
      renderer?.dispose();
      stage.replaceChildren();
    };
    try {
      const [THREE, { OrbitControls }] = await Promise.all([
        import("./vendor/three/three.module.min.js"),
        import("./vendor/three/OrbitControls.js"),
      ]);
      const metadataURL = new URL(root.dataset.pointCloud, document.baseURI);
      if (metadataURL.origin !== location.origin) throw new Error("Unsupported data location");
      const response = await fetch(metadataURL, { signal: abort.signal });
      if (!response.ok) throw new Error("Metadata unavailable");
      const metadata = await response.json();
      if (!/^[\w-]+\.bin$/.test(metadata.binary)) throw new Error("Invalid data filename");
      const binaryResponse = await fetch(new URL(metadata.binary, metadataURL), {
        signal: abort.signal,
      });
      if (!binaryResponse.ok) throw new Error("Data unavailable");
      const data = decodePointCloud(metadata, await binaryResponse.arrayBuffer());
      clearTimeout(timeout);
      if (disposed) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 50);
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer = gl
        ? new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true })
        : new CanvasPointRenderer(THREE, data);
      root.dataset.pcRenderer = gl ? "webgl" : "canvas";
      renderer.setClearColor(0x101512, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(
        Math.min(devicePixelRatio || 1, matchMedia("(max-width:760px)").matches ? 1.5 : 2),
      );
      renderer.domElement.className = "pc-canvas";
      renderer.domElement.setAttribute(
        "aria-label",
        en
          ? "Interactive RGB point cloud of the Temple of Diana"
          : "Nuvem de pontos RGB interativa do Templo de Diana",
      );
      renderer.domElement.setAttribute("role", "img");
      stage.append(renderer.domElement);
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(data.linearRGB, 3));
      geometry.computeBoundingSphere();
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = 32;
      const context = sprite.getContext("2d");
      context.fillStyle = "#fff";
      context.beginPath();
      context.arc(16, 16, 15, 0, Math.PI * 2);
      context.fill();
      texture = new THREE.CanvasTexture(sprite);
      material = new THREE.PointsMaterial({
        size: 0.0065,
        vertexColors: true,
        map: texture,
        alphaTest: 0.3,
        sizeAttenuation: true,
      });
      scene.add(new THREE.Points(geometry, material));
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.09;
      controls.autoRotate = !full && !reduce.matches;
      controls.autoRotateSpeed = 0.45;
      controls.maxPolarAngle = Math.PI * 0.91;
      controls.target.set(0, -0.035, 0);
      let active = full,
        interacted = false,
        dirty = true,
        last = 0,
        inFrame = false;
      const radius = geometry.boundingSphere.radius;
      const pause = root.querySelector('[data-pc-action="motion"]');
      const direction = new THREE.Vector3(1.05, 0.8, 1.4).normalize();
      const motionLabel = () => {
        pause.setAttribute("aria-pressed", String(controls.autoRotate));
        pause.setAttribute("aria-label", controls.autoRotate ? words.pause : words.play);
        pause.title = controls.autoRotate ? words.pause : words.play;
        pause.textContent = controls.autoRotate ? "Ⅱ" : "▶";
      };
      function fit() {
        const vertical = THREE.MathUtils.degToRad(camera.fov);
        const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
        const distance = (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.04;
        controls.target.set(0, -0.035, 0);
        camera.position.copy(direction).multiplyScalar(distance).add(controls.target);
        controls.minDistance = radius * 0.7;
        controls.maxDistance = distance * 5;
        controls.update();
      }
      function loop(time) {
        frame = 0;
        if (disposed || !visible || document.hidden) return;
        if (renderer.isSoftware && last && time - last < 50) {
          frame = requestAnimationFrame(loop);
          return;
        }
        inFrame = true;
        const delta = Math.min((time - last) / 1000 || 1 / 60, 0.05);
        last = time;
        const changed = controls.update(delta);
        if (dirty || changed) renderer.render(scene, camera);
        const again = dirty || changed || controls.autoRotate;
        dirty = false;
        inFrame = false;
        if (again && !frame) frame = requestAnimationFrame(loop);
      }
      function draw() {
        dirty = true;
        if (!inFrame && !frame && !disposed && visible && !document.hidden)
          frame = requestAnimationFrame(loop);
      }
      function setActive(value) {
        active = value;
        root.dataset.pcActive = String(active);
        controls.enabled = active;
        toggle.hidden = full;
        toggle.textContent = active ? words.finish : words.explore;
        toggle.setAttribute("aria-pressed", String(active));
        adjustments.hidden = !active;
        hint.hidden = !active;
        hint.textContent = words.hint;
        draw();
      }
      function resize() {
        const box = stage.getBoundingClientRect();
        if (!box.width || !box.height) return;
        renderer.setSize(box.width, box.height, false);
        camera.aspect = box.width / box.height;
        camera.updateProjectionMatrix();
        if (!interacted) fit();
        draw();
      }
      controls.addEventListener("change", draw);
      controls.addEventListener("start", () => {
        interacted = true;
        controls.autoRotate = false;
        motionLabel();
        draw();
      });
      on(toolbar, "click", (event) => {
        const action = event.target.closest("[data-pc-action]")?.dataset.pcAction;
        if (!action) return;
        if (action === "interact") setActive(!active);
        if (action === "reset") {
          interacted = false;
          fit();
        }
        if (action === "in" || action === "out") {
          interacted = true;
          camera.position
            .sub(controls.target)
            .multiplyScalar(action === "in" ? 0.82 : 1.22)
            .add(controls.target);
          controls.update();
        }
        if (action === "motion") {
          controls.autoRotate = !controls.autoRotate;
          motionLabel();
        }
        draw();
      });
      on(reduce, "change", () => {
        if (reduce.matches) controls.autoRotate = false;
        motionLabel();
        draw();
      });
      on(document, "visibilitychange", () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else draw();
      });
      on(renderer.domElement, "webglcontextlost", (event) => {
        event.preventDefault();
        cleanup();
        root.dataset.pcReady = "false";
        toolbar.hidden = true;
        status.hidden = false;
        status.textContent = words.failed;
        retry.hidden = false;
      });
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stage);
      motionLabel();
      setActive(full);
      resize();
      root.dataset.pcCount = String(data.count);
      root.dataset.pcReady = "true";
      root.setAttribute("aria-busy", "false");
      toolbar.hidden = false;
      status.textContent = words.ready;
      status.hidden = true;
      root.addEventListener("pc-visibility", draw, { signal: stopEvents.signal });
      draw();
    } catch (error) {
      if (!disposed) {
        cleanup();
        root.dataset.pcReady = "false";
        root.setAttribute("aria-busy", "false");
        status.textContent = words.failed;
        status.hidden = false;
        retry.textContent = words.retry;
        retry.hidden = false;
      }
    } finally {
      starting = false;
    }
  }
  retry.addEventListener("click", start);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        root.dispatchEvent(new Event("pc-visibility"));
        if (visible && !root.dataset.pcReady) start();
      },
      { threshold: 0.05 },
    ).observe(root);
  } else {
    visible = true;
    start();
  }
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) cleanup();
  });
}
