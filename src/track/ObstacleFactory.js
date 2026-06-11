// 障害物モデル生成。AABB 用の w/h/d と jumpable/slidable フラグを userData に格納。
import * as THREE from 'three';

// 赤白縞テクスチャ（ハードル用）キャッシュ
let _stripeTex = null;
function getStripeTex() {
  if (_stripeTex) return _stripeTex;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 16;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = (i & 1) ? '#E22B2B' : '#F2F2F2';
    ctx.fillRect(i * 8, 0, 8, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  _stripeTex = tex;
  return tex;
}

const _metalMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.4, metalness: 0.7 });
const _rubberMat = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.9, metalness: 0 });
const _trashBodyMat = new THREE.MeshStandardMaterial({ color: 0x4d4d56, roughness: 0.6, metalness: 0.35 });
const _trashLidMat  = new THREE.MeshStandardMaterial({ color: 0x2d2d36, roughness: 0.7, metalness: 0.3 });
const _barkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.9 });
const _mossMat = new THREE.MeshStandardMaterial({ color: 0x2e6a2e, roughness: 0.85 });

export const ObstacleFactory = {
  // ダンベル: 低姿勢 (h=0.4) → ジャンプ推奨
  buildDumbbell() {
    const g = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.6, 10),
      _metalMat
    );
    shaft.rotation.z = Math.PI / 2;
    shaft.position.y = 0.2;
    shaft.castShadow = true;
    g.add(shaft);
    const ballGeo = new THREE.SphereGeometry(0.16, 14, 10);
    const bL = new THREE.Mesh(ballGeo, _rubberMat);
    bL.position.set(-0.33, 0.2, 0);
    bL.castShadow = true;
    g.add(bL);
    const bR = new THREE.Mesh(ballGeo, _rubberMat);
    bR.position.set(0.33, 0.2, 0);
    bR.castShadow = true;
    g.add(bR);
    g.userData.kind = 'dumbbell';
    g.userData.aabb = { w: 0.95, h: 0.4, d: 0.45 };
    g.userData.jumpable = true;  // ジャンプで越せる
    g.userData.slidable = false;
    return g;
  },

  // ハードル: 横棒 (h=1.1) → スライド推奨
  buildHurdle() {
    const g = new THREE.Group();
    const barMat = new THREE.MeshStandardMaterial({
      map: getStripeTex(), roughness: 0.6,
    });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.7 });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), barMat);
    bar.position.y = 1.0;
    bar.castShadow = true;
    g.add(bar);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), legMat);
    legL.position.set(-0.65, 0.52, 0);
    g.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), legMat);
    legR.position.set(0.65, 0.52, 0);
    g.add(legR);
    g.userData.kind = 'hurdle';
    // スライドでくぐれる：バー高さ 0.94〜1.06 の帯のみ判定
    g.userData.aabb = { w: 1.6, h: 1.1, d: 0.3 };
    g.userData.aabbMinY = 0.94;
    g.userData.jumpable = false;
    g.userData.slidable = true;
    return g;
  },

  // ゴミ箱: h=1.3 → ジャンプで越せる（やや高い）
  buildTrashcan() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.30, 1.2, 16),
      _trashBodyMat
    );
    body.position.y = 0.6;
    body.castShadow = true;
    g.add(body);
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.08, 16),
      _trashLidMat
    );
    lid.position.y = 1.24;
    g.add(lid);
    g.userData.kind = 'trashcan';
    g.userData.aabb = { w: 0.8, h: 1.3, d: 0.8 };
    g.userData.jumpable = true;
    g.userData.slidable = false;
    return g;
  },

  // 丸太: 横向きシリンダー → ジャンプ必須（スライド不可）
  buildLog() {
    const g = new THREE.Group();
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 2.2, 14),
      _barkMat
    );
    log.rotation.z = Math.PI / 2;
    log.position.y = 0.45;
    log.castShadow = true;
    g.add(log);
    // 苔: 上面に小Plane
    const moss = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.6),
      _mossMat
    );
    moss.rotation.x = -Math.PI / 2;
    moss.position.y = 0.91;
    g.add(moss);
    g.userData.kind = 'log';
    g.userData.aabb = { w: 2.2, h: 0.9, d: 0.9 };
    g.userData.jumpable = true;
    g.userData.slidable = false;
    return g;
  },
};
