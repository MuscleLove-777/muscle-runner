// タイル毎に障害物を配置、スクロールに合わせて AABB 衝突判定。
// TrackManager の onTileRecycled から populateTile(tile) が呼ばれる。
import * as THREE from 'three';
import { RUNNER } from '../config.js';
import { ObstacleFactory } from './ObstacleFactory.js';

const LANE_X = RUNNER.laneX;
const SLOT_Z = [-0.25, 0.25]; // タイル内 z スロット (比率): 25% 75% → タイル中心基準で -tileLen*0.25 など

function pickKind() {
  const r = Math.random();
  if (r < 0.35) return 'dumbbell';
  if (r < 0.65) return 'hurdle';
  if (r < 0.85) return 'trashcan';
  return 'log';
}

function buildByKind(kind) {
  switch (kind) {
    case 'dumbbell': return ObstacleFactory.buildDumbbell();
    case 'hurdle':   return ObstacleFactory.buildHurdle();
    case 'trashcan': return ObstacleFactory.buildTrashcan();
    case 'log':      return ObstacleFactory.buildLog();
    default:         return ObstacleFactory.buildDumbbell();
  }
}

export class ObstacleManager {
  constructor(scene, game) {
    this.scene = scene;
    this.game = game;
    this._primedTiles = new WeakSet();
    this.difficulty = 1.0; // S5: 30秒ごとに +0.1, 最大 2.0
    // 初回は TrackManager がすでにタイルを並べた後に populateAll() を呼ぶ
  }

  populateAll(tiles) {
    for (const t of tiles) this.populateTile(t);
  }

  // タイル 1 枚分の障害物を配置
  populateTile(tile) {
    const group = tile.userData.obstacleGroup;
    const obs = tile.userData.obstacles;
    if (!group || !obs) return;

    // 既存をクリア（リサイクル時）
    while (group.children.length) group.remove(group.children[0]);
    obs.length = 0;

    // 難易度ベースで 0〜最大 (difficulty * 2) 個を配置
    // difficulty=1.0 → 0〜2 個 / difficulty=2.0 → 0〜4 個
    const d = Math.max(0.5, Math.min(2.0, this.difficulty || 1.0));
    const emptyChance = Math.max(0.08, 0.28 - (d - 1.0) * 0.15);
    let count = 0;
    if (Math.random() < emptyChance) {
      count = 0;
    } else {
      const maxCount = Math.max(1, Math.round(d * 2));
      const minCount = Math.max(1, Math.round(d * 0.5));
      count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    }
    if (count === 0) return;

    // レーン使用ビットマスク（3 レーン全埋めを避ける）
    const slotsUsed = []; // { slotIndex, lanes: Set, kinds: { [lane]: kind } }

    // スロット数を count に応じて増やす (難易度高いと 4 スロット相当)
    // スロット Z: -0.4 / -0.15 / 0.15 / 0.4（タイル長比）
    const slotZRatios = [-0.4, -0.15, 0.15, 0.4];
    for (let i = 0; i < count; i++) {
      const slotIndex = i % slotZRatios.length;
      const slotInfo = slotsUsed[slotIndex] || { slotIndex, lanes: new Set(), kinds: {} };
      // 最大 2 レーン／スロット（3 レーン全埋めを避ける）
      let laneCandidates = [0, 1, 2].filter((l) => !slotInfo.lanes.has(l));
      if (slotInfo.lanes.size >= 2) { slotsUsed[slotIndex] = slotInfo; continue; }

      const otherKinds = Object.values(slotInfo.kinds);
      const hasHurdle = otherKinds.includes('hurdle');
      const hasLog = otherKinds.includes('log');

      const lane = laneCandidates[(Math.random() * laneCandidates.length) | 0];
      let kind = pickKind();
      if ((hasHurdle && kind === 'log') || (hasLog && kind === 'hurdle')) {
        kind = (Math.random() < 0.5) ? 'dumbbell' : 'trashcan';
      }
      const mesh = buildByKind(kind);
      const zOffset = RUNNER.tileLength * slotZRatios[slotIndex];
      mesh.position.set(LANE_X[lane], 0, zOffset);
      group.add(mesh);
      obs.push({ mesh, lane, kind });
      slotInfo.lanes.add(lane);
      slotInfo.kinds[lane] = kind;
      slotsUsed[slotIndex] = slotInfo;
    }
  }

  update(dt, scrollSpeed, player, tiles) {
    // 障害物はタイルの子なので、タイル移動とともに自然に流れる。
    // AABB 衝突: プレイヤーはワールド (laneX[lane], y, 0) 付近、
    // 障害物のワールド座標を求めて矩形判定。
    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z; // 常に 0

    // プレイヤー AABB: w=0.6, 基本 h=1.6（上部 y=1.6）
    // スライド中は h=0.8 → y 上限下げる
    // ジャンプ中は min.y = y（足元）
    const pHalfW = 0.3;
    const pH = player.isSliding ? 0.8 : 1.6;
    const pMinX = px - pHalfW;
    const pMaxX = px + pHalfW;
    const pMinY = player.position.y;
    const pMaxY = player.position.y + pH;
    const pHalfD = 0.25;
    const pMinZ = pz - pHalfD;
    const pMaxZ = pz + pHalfD;

    for (const tile of tiles) {
      if (!tile.userData.obstacles) continue;
      // 早期除外: タイルの z レンジがプレイヤーから遠い場合スキップ
      const tileZ = tile.position.z;
      if (tileZ < -6 || tileZ > 12) continue;

      for (const o of tile.userData.obstacles) {
        if (o.hit || o.destroyed) continue;
        if (!o.mesh.parent) continue;
        const worldZ = tileZ + o.mesh.position.z;
        const worldX = o.mesh.position.x;
        // Z が衝突帯から外れるなら skip
        if (worldZ < pMinZ - 1.5 || worldZ > pMaxZ + 1.5) continue;

        const box = o.mesh.userData.aabb;
        if (!box) continue;
        const hw = box.w * 0.5, hd = box.d * 0.5;
        const oMinX = worldX - hw;
        const oMaxX = worldX + hw;
        const oMinY = o.mesh.userData.aabbMinY != null ? o.mesh.userData.aabbMinY : 0;
        const oMaxY = oMinY + box.h;
        const oMinZ = worldZ - hd;
        const oMaxZ = worldZ + hd;

        // AABB テスト
        if (
          pMaxX > oMinX && pMinX < oMaxX &&
          pMaxY > oMinY && pMinY < oMaxY &&
          pMaxZ > oMinZ && pMinZ < oMaxZ
        ) {
          o.hit = true;
          if (this.game && typeof this.game.onObstacleHit === 'function') {
            try { this.game.onObstacleHit(o); } catch (_) {}
          } else {
            try { console.log('[obstacle hit]', o.kind); } catch (_) {}
          }
        }
      }
    }
  }
}
