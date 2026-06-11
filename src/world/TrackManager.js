// タイル方式の無限スクロール路面。
// 8 タイルをリング状に並べ、プレイヤーより手前（z > 20）に来たら末尾に回す。
import * as THREE from 'three';
import { RUNNER } from '../config.js';
import { TextureFactory } from '../util/TextureFactory.js';

const TILE_TYPES = ['road', 'street', 'grass'];

export class TrackManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    // テクスチャキャッシュ
    this._roadTex = TextureFactory.makeRoadTile();
    this._streetTex = TextureFactory.makeStreetTile();
    this._grassTex = TextureFactory.makeGrassTile();

    // 側の縁石マテリアル
    this._curbMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.85 });
    // 木（草タイル用）
    this._treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.9 });
    this._treeLeafMat = new THREE.MeshStandardMaterial({ color: 0x2e6a2e, roughness: 0.85 });
    // 街灯柱
    this._lampMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.6, metalness: 0.3 });
    this._lampBulbMat = new THREE.MeshStandardMaterial({
      color: 0xFFE4A0, emissive: 0xFFAA66, emissiveIntensity: 1.2, roughness: 0.4,
    });

    this.tiles = [];
    // タイル 8 枚を z=0, -20, -40, ... に前方へ並べる
    const startZOffset = 10; // プレイヤーの手前にも少しタイル
    for (let i = 0; i < RUNNER.tileBufferCount; i++) {
      const tile = this._makeTile(this._randomType());
      tile.position.z = startZOffset - i * RUNNER.tileLength;
      this.group.add(tile);
      this.tiles.push(tile);
    }

    this.onTileRecycled = null; // (tile) => void（ObstacleManager 用フック）
  }

  _randomType() {
    return TILE_TYPES[(Math.random() * TILE_TYPES.length) | 0];
  }

  _makeTile(type) {
    const tile = new THREE.Group();
    tile.userData.type = type;

    // 床 (7.5 x 20)
    const tex = type === 'road' ? this._roadTex
      : (type === 'street' ? this._streetTex : this._grassTex);
    const floorMat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.85, metalness: 0.05,
    });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, RUNNER.tileLength),
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    tile.add(floor);

    // 縁石 2 本（左右）
    const curbGeo = new THREE.BoxGeometry(0.4, 0.25, RUNNER.tileLength);
    const curbL = new THREE.Mesh(curbGeo, this._curbMat);
    curbL.position.set(-3.95, 0.12, 0);
    tile.add(curbL);
    const curbR = new THREE.Mesh(curbGeo, this._curbMat);
    curbR.position.set(3.95, 0.12, 0);
    tile.add(curbR);

    // 装飾
    if (type === 'grass') {
      // 木 2〜4 本（縁石外側）
      const count = 2 + ((Math.random() * 3) | 0);
      for (let i = 0; i < count; i++) {
        const tree = this._makeTree();
        const side = Math.random() < 0.5 ? -1 : 1;
        tree.position.set(side * (5.2 + Math.random() * 1.2),
          0, (Math.random() - 0.5) * (RUNNER.tileLength - 2));
        tile.add(tree);
      }
    } else if (type === 'street') {
      // 街灯 1〜2 本
      const count = 1 + ((Math.random() * 2) | 0);
      for (let i = 0; i < count; i++) {
        const lamp = this._makeLamp();
        const side = Math.random() < 0.5 ? -1 : 1;
        lamp.position.set(side * 4.6, 0, (Math.random() - 0.5) * (RUNNER.tileLength - 3));
        tile.add(lamp);
      }
    } else {
      // road: 看板（薄 Box）1 本程度
      if (Math.random() < 0.4) {
        const sign = this._makeSign();
        const side = Math.random() < 0.5 ? -1 : 1;
        sign.position.set(side * 4.7, 0, (Math.random() - 0.5) * (RUNNER.tileLength - 2));
        tile.add(sign);
      }
    }

    // 障害物用コンテナ
    const obstacleGroup = new THREE.Group();
    tile.add(obstacleGroup);
    tile.userData.obstacleGroup = obstacleGroup;
    tile.userData.obstacles = [];

    return tile;
  }

  _makeTree() {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 1.6, 8),
      this._treeTrunkMat
    );
    trunk.position.y = 0.8;
    trunk.castShadow = true;
    g.add(trunk);
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.0, 8),
      this._treeLeafMat
    );
    leaf.position.y = 2.3;
    leaf.castShadow = true;
    g.add(leaf);
    return g;
  }

  _makeLamp() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.08, 3.8, 8),
      this._lampMat
    );
    pole.position.y = 1.9;
    pole.castShadow = true;
    g.add(pole);
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.08, 0.08),
      this._lampMat
    );
    arm.position.set(-0.4, 3.6, 0);
    g.add(arm);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 10, 8),
      this._lampBulbMat
    );
    bulb.position.set(-0.78, 3.58, 0);
    g.add(bulb);
    return g;
  }

  _makeSign() {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6),
      this._lampMat
    );
    pole.position.y = 1.0;
    g.add(pole);
    const mat = new THREE.MeshStandardMaterial({ color: 0xB01030, roughness: 0.5 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.05), mat);
    board.position.y = 1.9;
    g.add(board);
    return g;
  }

  _recycleTile(tile) {
    // 既存障害物クリア
    if (tile.userData.obstacles) tile.userData.obstacles.length = 0;
    if (tile.userData.obstacleGroup) {
      while (tile.userData.obstacleGroup.children.length) {
        tile.userData.obstacleGroup.remove(tile.userData.obstacleGroup.children[0]);
      }
    }
    // タイプ変更の余地: 同一 type 再利用でも OK。ここは簡易なのでそのまま
    if (this.onTileRecycled) {
      try { this.onTileRecycled(tile); } catch (_) {}
    }
  }

  update(dt, scrollSpeed) {
    const adv = scrollSpeed * dt;
    for (const tile of this.tiles) {
      tile.position.z += adv;
    }
    // プレイヤーより後方 (z > 20) に行ったタイルを最前方 (最小 z - tileLength) に回す
    for (const tile of this.tiles) {
      if (tile.position.z > 20) {
        // 現在の最小 z を求める
        let minZ = Infinity;
        for (const t of this.tiles) if (t.position.z < minZ) minZ = t.position.z;
        tile.position.z = minZ - RUNNER.tileLength;
        this._recycleTile(tile);
      }
    }
  }
}
