// S5: 爆発エフェクト強化（Bullet.jsの内蔵版の代わりに呼び出しても良いモジュール版）
// Sphere + PointLight + 煙 Sprite の組み合わせ。
import * as THREE from 'three';

const _list = [];

let _smokeTex = null;
function _getSmokeTex() {
  if (_smokeTex) return _smokeTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,200,120,0.95)');
  g.addColorStop(0.35, 'rgba(120,80,60,0.7)');
  g.addColorStop(0.8, 'rgba(30,25,30,0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  _smokeTex = new THREE.CanvasTexture(c);
  _smokeTex.needsUpdate = true;
  return _smokeTex;
}

export const Explosion = {
  spawn(scene, pos, radius = 4) {
    // 光
    const light = new THREE.PointLight(0xFFAA33, 14, radius * 3.0);
    light.position.copy(pos);
    scene.add(light);
    // 拡大球
    const geo = new THREE.SphereGeometry(0.2, 16, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xFF8833, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.copy(pos);
    scene.add(sphere);
    // 煙 Sprite
    const smokeMat = new THREE.SpriteMaterial({
      map: _getSmokeTex(), transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const smoke = new THREE.Sprite(smokeMat);
    smoke.position.copy(pos);
    smoke.scale.setScalar(1.0);
    scene.add(smoke);

    _list.push({ scene, light, sphere, smoke, life: 0, max: 0.45, radius });
  },

  update(dt) {
    for (let i = _list.length - 1; i >= 0; i--) {
      const e = _list[i];
      e.life += dt;
      const t = Math.min(1, e.life / e.max);
      const r = 0.2 + (e.radius - 0.2) * t;
      e.sphere.scale.setScalar(r / 0.2);
      e.sphere.material.opacity = Math.max(0, 0.9 * (1 - t));
      e.light.intensity = 14 * (1 - t);
      e.smoke.scale.setScalar(1 + t * (e.radius * 1.4));
      e.smoke.material.opacity = Math.max(0, 0.85 * (1 - t));
      e.smoke.position.y += dt * 0.5;
      if (e.life >= e.max) {
        e.scene.remove(e.sphere);
        e.scene.remove(e.light);
        e.scene.remove(e.smoke);
        e.sphere.geometry.dispose();
        e.sphere.material.dispose();
        _list.splice(i, 1);
      }
    }
  },
};
