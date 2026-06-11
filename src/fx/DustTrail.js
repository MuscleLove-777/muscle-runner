// プレイヤー足元の砂埃パーティクル。Sprite + Canvas テクスチャ。
// 寿命 0.3 秒、opacity 1→0、y 0→0.2 上昇。
import * as THREE from 'three';

let _tex = null;
function _getDustTex() {
  if (_tex) return _tex;
  const size = 32;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.4, 'rgba(220,220,220,0.55)');
  g.addColorStop(1, 'rgba(200,200,200,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  _tex = new THREE.CanvasTexture(c);
  _tex.needsUpdate = true;
  return _tex;
}

export class DustTrail {
  constructor(scene) {
    this.scene = scene;
    this._particles = []; // { sprite, life, max, vel }
    this._accum = 0;
  }

  update(dt, playerPos, isSliding, isMoving) {
    // スポーンレート: 通常 4/s, スライド中 8/s
    if (isMoving) {
      const rate = isSliding ? 8.0 : 4.0;
      this._accum += dt * rate;
      while (this._accum >= 1) {
        this._accum -= 1;
        this._spawn(playerPos, isSliding);
      }
    }

    // 更新
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i];
      p.life += dt;
      const t = p.life / p.max;
      p.sprite.position.x += p.vel.x * dt;
      p.sprite.position.y += p.vel.y * dt;
      p.sprite.position.z += p.vel.z * dt;
      p.sprite.material.opacity = Math.max(0, 1 - t);
      p.sprite.scale.setScalar(0.18 + t * 0.24);
      if (p.life >= p.max) {
        this.scene.remove(p.sprite);
        p.sprite.material.dispose();
        this._particles.splice(i, 1);
      }
    }
  }

  _spawn(playerPos, isSliding) {
    const mat = new THREE.SpriteMaterial({
      map: _getDustTex(),
      color: 0xE8DEC8,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const s = new THREE.Sprite(mat);
    const jx = (Math.random() - 0.5) * 0.4;
    const jz = 0.1 + Math.random() * 0.3;
    s.position.set(playerPos.x + jx, 0.05, playerPos.z + jz);
    s.scale.setScalar(0.18);
    this.scene.add(s);
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      0.4 + Math.random() * 0.3,
      0.6 + Math.random() * 0.4
    );
    if (isSliding) vel.z += 0.8;
    this._particles.push({
      sprite: s,
      life: 0,
      max: 0.3,
      vel,
    });
  }

  clear() {
    for (const p of this._particles) {
      this.scene.remove(p.sprite);
      p.sprite.material.dispose();
    }
    this._particles.length = 0;
  }
}
