/* A reversible camera path around the supplied point cloud. Coordinates stay unchanged. */
export const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));
const ease = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
const frames = [
  { at: 0, azimuth: 0.94, elevation: 0.77, distance: 1.04, height: -0.035 },
  { at: 0.5, azimuth: 0.28, elevation: 0.3, distance: 0.91, height: 0.005 },
  { at: 1, azimuth: -0.48, elevation: 0.18, distance: 0.81, height: 0.035 },
];

export function journeyPose(progress, aspect, radius, options = {}) {
  const t = clamp01(progress);
  const compact = Boolean(options.compact);
  const safeAspect = Math.max(0.15, Number(aspect) || 1);
  const safeRadius = Math.max(0.05, Number(radius) || 0.7);
  const a = t <= 0.5 ? frames[0] : frames[1];
  const b = t <= 0.5 ? frames[1] : frames[2];
  const u = ease((t - a.at) / (b.at - a.at));
  const azimuth = mix(a.azimuth, b.azimuth, u) + (options.parallaxX || 0) * 0.035;
  const elevation = mix(a.elevation, b.elevation, u) + (options.parallaxY || 0) * 0.018;
  const fov = compact ? 48 : 42;
  const tangent = Math.tan((fov * Math.PI) / 360);
  const horizontal = 2 * Math.atan(tangent * safeAspect * (compact ? 0.96 : 0.6));
  const distance =
    (safeRadius / Math.sin(Math.min((fov * Math.PI) / 180, horizontal) / 2)) *
    mix(a.distance, b.distance, u);
  const direction = [
    Math.sin(azimuth) * Math.cos(elevation),
    Math.sin(elevation),
    Math.cos(azimuth) * Math.cos(elevation),
  ];
  const right = [Math.cos(azimuth), 0, -Math.sin(azimuth)];
  const up = [
    -Math.sin(azimuth) * Math.sin(elevation),
    Math.cos(elevation),
    -Math.cos(azimuth) * Math.sin(elevation),
  ];
  const xOffset = -(compact ? 0 : 0.4) * distance * tangent * safeAspect;
  const yOffset = (compact ? 0.32 : 0.015) * distance * tangent;
  const target = right.map(
    (value, i) => value * xOffset + up[i] * yOffset + (i === 1 ? mix(a.height, b.height, u) : 0),
  );
  return {
    position: target.map((value, i) => value + direction[i] * distance),
    target,
    fov,
    phase: t < 0.29 ? 0 : t < 0.73 ? 1 : 2,
    colour: ease(clamp01((t - 0.4) / 0.52)),
    progress: t,
  };
}
