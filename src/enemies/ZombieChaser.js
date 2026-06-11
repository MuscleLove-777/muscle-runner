// 背後から追いすがる腐敗緑ゾンビ 5 体。
// 通常: プレイヤーの背後にゆらゆら追従。ダッシュ中は距離を詰める。
// Howl: 10 秒ごとにランダム 1 体が唸り。
// Lunge: GameOver 演出。プレイヤーに覆いかぶさる。
import * as THREE from 'three';
import { ZombieGirlBase } from './models/ZombieGirlBase.js';
import { BloodSplash } from '../fx/BloodSplash.js';

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function lerp(a, b, t) { return a + (b - a) * t; }

export class ZombieChaser {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this.zombies = [];
    this._howlTimer = 10.0;
    this._lunging = false;
    this._lungeT = 0;
    this._lungeMax = 2.0;

    const count = 5;
    for (let i = 0; i < count; i++) {
      const z = ZombieGirlBase.buildBase({
        skinTone: 0xA0B090,   // 腐敗緑
        uniformColor: 0x333333,
        hairColor: 0x1A1A1A,
        bloodCount: 5,
        bodyScale: 1.0 + (Math.random() - 0.5) * 0.12,
      });
      // ZombieChaser は前方(-Z)を向く = rotation.y=Math.PI (slasherと違い、プレイヤーは -Z 走行なので同じ向き)
      z.rotation.y = Math.PI;
      const baseOffset = {
        x: (Math.random() - 0.5) * 5.0, // -2.5..2.5
        z: 10 + Math.random() * 8,       // 10..18
        phase: Math.random() * Math.PI * 2,
        animT: Math.random() * Math.PI * 2,
      };
      scene.add(z);
      this.zombies.push({
        group: z,
        baseOffset,
      });
    }
  }

  _animateWalk(z, dt, speedFactor = 1.0) {
    const parts = z.group.userData?.parts;
    if (!parts) return;
    z.baseOffset.animT += dt * 8 * speedFactor;
    const s = Math.sin(z.baseOffset.animT);
    const amp = 0.55;
    parts.legL.rotation.x = s * amp;
    parts.legR.rotation.x = -s * amp;
    parts.armL.rotation.x = -s * amp * 0.9;
    parts.armR.rotation.x = s * amp * 0.9;
    // ゾンビらしく腕をやや広げ
    parts.armL.rotation.z = 0.35;
    parts.armR.rotation.z = -0.35;
    // 胴体軽い前傾
    if (parts.torsoGroup) parts.torsoGroup.rotation.x = -0.2 + Math.sin(z.baseOffset.animT * 0.5) * 0.05;
  }

  update(dt, playerPos, isDashing) {
    if (this._lunging) {
      this._updateLunge(dt, playerPos);
      return;
    }
    const now = (typeof performance !== 'undefined') ? performance.now() / 1000 : 0;
    for (const z of this.zombies) {
      const b = z.baseOffset;
      // ダッシュ中は詰め寄る
      const dashPull = isDashing ? -5 : 0;
      const followZ = b.z + dashPull + 1.5 * Math.sin(now * 1.3 + b.phase);
      const followX = b.x + 0.35 * Math.sin(now * 0.9 + b.phase * 2);
      z.group.position.set(
        playerPos.x + followX,
        0,
        playerPos.z + followZ
      );
      this._animateWalk(z, dt, isDashing ? 1.35 : 1.0);
    }

    this._howlTimer -= dt;
    if (this._howlTimer <= 0) {
      this._howlTimer = 9 + Math.random() * 4;
      try {
        this.game?.soundManager?.playZombieHowl?.();
      } catch (_) {}
    }
  }

  spawnHowl(soundManager) {
    // 外部から呼ばれた場合でもタイマーを短くするだけ
    try { soundManager?.playZombieHowl?.(); } catch (_) {}
    this._howlTimer = 9 + Math.random() * 4;
  }

  // GameOver 演出: 2 秒かけて全員を playerPos まで lerp
  lunge(playerPos) {
    if (this._lunging) return;
    this._lunging = true;
    this._lungeT = 0;
    // 各ゾンビの開始位置を記録
    for (const z of this.zombies) {
      z.lungeFrom = z.group.position.clone();
      // 1 体だけ覆いかぶさる役（最前列を選ぶ = z 値が最小）
      z.isCoverer = false;
    }
    // 最も近い 1 体を coverer に
    let closest = null;
    let closestDz = Infinity;
    for (const z of this.zombies) {
      const dz = Math.abs(z.group.position.z - playerPos.z);
      if (dz < closestDz) { closestDz = dz; closest = z; }
    }
    if (closest) closest.isCoverer = true;
  }

  _updateLunge(dt, playerPos) {
    this._lungeT += dt;
    const t = Math.min(1, this._lungeT / this._lungeMax);
    const ease = 1 - (1 - t) * (1 - t); // ease-out quad
    for (const z of this.zombies) {
      const from = z.lungeFrom || z.group.position;
      const targetZ = z.isCoverer ? 0.2 : 0.5 + (Math.random() - 0.5) * 0.3;
      const targetX = z.isCoverer ? playerPos.x : playerPos.x + (z.baseOffset.x * 0.35);
      z.group.position.x = lerp(from.x, targetX, ease);
      z.group.position.z = lerp(from.z, playerPos.z + targetZ, ease);
      // 覆いかぶさる: rotation.x を前方に倒す
      if (z.isCoverer) {
        z.group.rotation.x = lerp(0, -0.8, ease);
      }
      // 腕をかきむしり動作
      const parts = z.group.userData?.parts;
      if (parts) {
        const spk = Math.sin(this._lungeT * 18 + z.baseOffset.phase);
        parts.armL.rotation.x = -0.4 + spk * 0.6;
        parts.armR.rotation.x = -0.4 - spk * 0.6;
      }
    }
    // 血しぶき連射（0.2s 毎）
    if (!this._bloodAccum) this._bloodAccum = 0;
    this._bloodAccum += dt;
    if (this._bloodAccum >= 0.2) {
      this._bloodAccum = 0;
      try {
        const p = new THREE.Vector3(playerPos.x, 1.1, playerPos.z);
        BloodSplash.spawn(this.scene, p);
      } catch (_) {}
    }
  }

  reset() {
    this._lunging = false;
    this._lungeT = 0;
    this._howlTimer = 10.0;
    this._bloodAccum = 0;
    for (const z of this.zombies) {
      z.baseOffset.x = (Math.random() - 0.5) * 5.0;
      z.baseOffset.z = 10 + Math.random() * 8;
      z.baseOffset.phase = Math.random() * Math.PI * 2;
      z.group.rotation.x = 0;
      z.group.rotation.y = Math.PI;
    }
  }

  dispose() {
    for (const z of this.zombies) {
      if (z.group && z.group.parent) z.group.parent.remove(z.group);
    }
    this.zombies.length = 0;
  }
}
