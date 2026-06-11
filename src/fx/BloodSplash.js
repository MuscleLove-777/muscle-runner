// S3: 敵被弾時の血しぶきパーティクル
import * as THREE from 'three';

let _tex = null;
function getTex() {
  if (_tex) return _tex;
  const size = 32;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 40, 40, 1)');
  g.addColorStop(0.5, 'rgba(170, 20, 20, 0.8)');
  g.addColorStop(1, 'rgba(90, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  _tex = new THREE.CanvasTexture(c);
  _tex.needsUpdate = true;
  return _tex;
}

const _active = []; // { sprite, vel, life, max, scene }
const GRAVITY = -8;

export const BloodSplash = {
  spawn(scene, worldPos) {
    const tex = getTex();
    const count = 15;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex, color: 0xff3333,
        transparent: true, depthWrite: false,
        blending: THREE.NormalBlending,
      });
      const s = new THREE.Sprite(mat);
      const sz = 0.08 + Math.random() * 0.1;
      s.scale.set(sz, sz, sz);
      s.position.copy(worldPos);
      // 初期ランダム速度（上＋全方向）
      const a = Math.random() * Math.PI * 2;
      const r = 1 + Math.random() * 2.5;
      const vx = Math.cos(a) * r;
      const vz = Math.sin(a) * r;
      const vy = 1.5 + Math.random() * 2.5;
      scene.add(s);
      _active.push({
        sprite: s,
        vel: new THREE.Vector3(vx, vy, vz),
        life: 0, max: 0.6, scene,
      });
    }
  },

  update(dt) {
    for (let i = _active.length - 1; i >= 0; i--) {
      const p = _active[i];
      p.life += dt;
      p.vel.y += GRAVITY * dt;
      p.sprite.position.addScaledVector(p.vel, dt);
      const t = p.life / p.max;
      p.sprite.material.opacity = Math.max(0, 1 - t);
      if (p.life >= p.max || p.sprite.position.y <= 0) {
        p.scene.remove(p.sprite);
        p.sprite.material.map = null;
        p.sprite.material.dispose();
        _active.splice(i, 1);
      }
    }
  },

  clear(scene) {
    for (const p of _active) {
      scene.remove(p.sprite);
      p.sprite.material.dispose();
    }
    _active.length = 0;
  },
};
