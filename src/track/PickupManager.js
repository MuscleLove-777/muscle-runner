// Runner 収集物の配置と取得判定。
// 各タイルに pickup をスポーンし、タイルに子として add（タイル移動で自然に流れる）。
// プレイヤーと世界座標で距離判定し取得処理。
import * as THREE from 'three';
import { RUNNER } from '../config.js';
import { PickupFactory } from './PickupFactory.js';

const LANE_X = RUNNER.laneX;

export class PickupManager {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this._energyCounter = 0;   // 15 タイルに 1 個制限用
  }

  populateAll(tiles) {
    for (const t of tiles) this.populateTile(t);
  }

  // タイル 1 枚に 0〜3 個の pickup を配置（障害物と z 被りを避ける）
  populateTile(tile) {
    if (!tile) return;
    // pickup 専用サブグループを持たせる
    let pickupGroup = tile.userData.pickupGroup;
    if (!pickupGroup) {
      pickupGroup = new THREE.Group();
      tile.add(pickupGroup);
      tile.userData.pickupGroup = pickupGroup;
      tile.userData.pickups = [];
    }

    // 既存クリア
    while (pickupGroup.children.length) pickupGroup.remove(pickupGroup.children[0]);
    tile.userData.pickups.length = 0;

    const obstacles = tile.userData.obstacles || [];
    // 障害物の z リスト（タイル相対座標）
    const obsZones = obstacles.map((o) => ({
      z: o.mesh.position.z,
      lane: o.lane,
    }));

    // 出現パターン決定
    // 40% チェーン(5個) / 15% エナジー / 25% スター / 20% 無し
    const roll = Math.random();
    this._energyCounter++;

    if (roll < 0.20) {
      // 無し
      return;
    }

    if (roll < 0.60) {
      // プロテインチェーン 3〜5 個を同レーンに並べる
      const chainLen = 3 + ((Math.random() * 3) | 0);
      const lane = (Math.random() * 3) | 0;
      const startZ = -RUNNER.tileLength * 0.45;
      const stepZ = (RUNNER.tileLength * 0.9) / chainLen;
      for (let i = 0; i < chainLen; i++) {
        const zOffset = startZ + i * stepZ;
        // 障害物と近接していたらスキップ
        if (obsZones.some((o) => o.lane === lane && Math.abs(o.z - zOffset) < 1.2)) continue;
        const p = PickupFactory.buildProtein();
        p.position.set(LANE_X[lane], 0, zOffset);
        pickupGroup.add(p);
        tile.userData.pickups.push({ mesh: p, lane, type: 'protein', taken: false });
      }
      return;
    }

    if (roll < 0.85) {
      // スター 1 個。ジャンプで取る位置 (y=0.8 or 1.8)
      const lane = (Math.random() * 3) | 0;
      const zOffset = (Math.random() - 0.5) * (RUNNER.tileLength * 0.7);
      if (obsZones.some((o) => o.lane === lane && Math.abs(o.z - zOffset) < 1.5)) return;
      const p = PickupFactory.buildStar();
      const y = Math.random() < 0.5 ? 0.8 : 1.8;
      p.position.set(LANE_X[lane], y, zOffset);
      p.userData.yBase = y;
      pickupGroup.add(p);
      tile.userData.pickups.push({ mesh: p, lane, type: 'star', taken: false });
      return;
    }

    // エナジー: 15 タイルに 1 個制限
    if (this._energyCounter >= 14 + ((Math.random() * 6) | 0)) {
      this._energyCounter = 0;
      const lane = (Math.random() * 3) | 0;
      const zOffset = (Math.random() - 0.5) * (RUNNER.tileLength * 0.6);
      if (obsZones.some((o) => o.lane === lane && Math.abs(o.z - zOffset) < 1.5)) return;
      const p = PickupFactory.buildEnergy();
      p.position.set(LANE_X[lane], 0.3, zOffset);
      p.userData.yBase = 0.3;
      pickupGroup.add(p);
      tile.userData.pickups.push({ mesh: p, lane, type: 'energy', taken: false });
    }
  }

  update(dt, scrollSpeed, player, tiles) {
    const now = (typeof performance !== 'undefined') ? performance.now() / 1000 : 0;
    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z;

    for (const tile of tiles) {
      const list = tile.userData.pickups;
      if (!list || list.length === 0) continue;
      // 早期除外: タイルが遠ければスキップ
      const tileZ = tile.position.z;
      if (tileZ < -14 || tileZ > 14) continue;

      for (const entry of list) {
        if (entry.taken) continue;
        const mesh = entry.mesh;
        // 浮遊アニメ
        const phase = mesh.userData.bobPhase || 0;
        const yBase = mesh.userData.yBase || 0;
        mesh.position.y = yBase + Math.sin(now * 3.2 + phase) * 0.10;
        mesh.rotation.y += dt * 2.2;
        // 世界座標
        const wx = mesh.position.x;
        const wy = mesh.position.y;
        const wz = tileZ + mesh.position.z;
        const dx = wx - px;
        const dz = wz - pz;
        const distSq = dx * dx + dz * dz;
        if (distSq < 1.0 * 1.0 && Math.abs(wy - py) < 1.0) {
          // 取得
          entry.taken = true;
          mesh.visible = false;
          if (this.game && typeof this.game.onPickup === 'function') {
            try { this.game.onPickup(entry.type, mesh.userData.pointValue || 1); } catch (_) {}
          }
        }
      }
    }
  }

  reset(tiles) {
    if (!tiles) return;
    this._energyCounter = 0;
    for (const t of tiles) this.populateTile(t);
  }
}
