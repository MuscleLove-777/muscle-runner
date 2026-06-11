// S1: 小物ユーティリティ
export function clamp(v, lo, hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randRange(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

export function degToRad(deg) {
  return deg * (Math.PI / 180);
}
