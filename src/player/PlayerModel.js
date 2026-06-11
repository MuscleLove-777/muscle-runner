// 主人公のモデル生成。FPS 版 ZombieGirlBase をそのまま流用して、
// 生者らしくカスタマイズ（目=緑、血糊=非表示、赤アクセント追加）。
// 戻り値 rootGroup には userData.parts（ZombieGirlBase が用意）と
// userData.handR（武器アタッチ用空 Object3D）がぶら下がる。
import * as THREE from 'three';
import { ZombieGirlBase } from '../enemies/models/ZombieGirlBase.js';

export function buildPlayerModel() {
  const rootGroup = ZombieGirlBase.buildBase({
    skinTone: 0xF2D4B8,      // 明るめの肌
    uniformColor: 0xB01030,  // MuscleLove レッドのスポブラ
    hairColor: 0xF5D48A,     // ブロンド
    bodyScale: 1.0,
    bloodCount: 0,           // 生者なので血糊ゼロ（念のため後段でも非表示）
  });

  const parts = rootGroup.userData?.parts;

  // === 目を緑発光に差し替え ===
  // ZombieGirlBase では MeshBasicMaterial + SphereGeometry の小さい赤目が
  // headGroup 直下に 2 個ある。traverse で MeshBasicMaterial のものを探す。
  if (parts && parts.headGroup) {
    const eyeColor = new THREE.Color(0x00FF88);
    parts.headGroup.traverse((o) => {
      if (o.isMesh && o.material && o.material.isMeshBasicMaterial) {
        // 口のテクスチャ貼りもMeshBasicMaterialだが、mapが付いているので除外
        if (!o.material.map) {
          o.material.color.copy(eyeColor);
        }
      }
    });
  }

  // === 血糊 Plane を visible=false（bloodCount=0 でも念のため） ===
  if (parts && parts.bodyGroup) {
    parts.bodyGroup.traverse((o) => {
      if (o.isMesh && o.material && o.material.map && o.geometry
          && o.geometry.type === 'PlaneGeometry'
          && o.material.color && o.material.color.getHex
          && o.material.color.getHex() === 0x8A0000) {
        o.visible = false;
      }
    });
  }

  // === 赤アクセント: ヘアバンド（Torus） ===
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xFF2D3A, roughness: 0.5, metalness: 0.1,
  });
  const hairBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.015, 6, 20),
    bandMat
  );
  hairBand.rotation.x = Math.PI / 2;
  hairBand.position.set(0, 1.66, 0.02);
  rootGroup.add(hairBand);

  // === 赤アームバンド（Box x 2） ===
  const armBandGeo = new THREE.BoxGeometry(0.18, 0.04, 0.18);
  const armBandL = new THREE.Mesh(armBandGeo, bandMat);
  armBandL.position.set(-0.25, 1.28, 0);
  rootGroup.add(armBandL);
  const armBandR = new THREE.Mesh(armBandGeo, bandMat);
  armBandR.position.set(0.25, 1.28, 0);
  rootGroup.add(armBandR);

  // === 背中の X 字ベルト（2 本の細い Box） ===
  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, roughness: 0.7,
  });
  const beltGeo = new THREE.BoxGeometry(0.04, 0.55, 0.02);
  const beltA = new THREE.Mesh(beltGeo, beltMat);
  beltA.position.set(0, 1.30, -0.11);
  beltA.rotation.z = 0.35;
  rootGroup.add(beltA);
  const beltB = new THREE.Mesh(beltGeo, beltMat);
  beltB.position.set(0, 1.30, -0.11);
  beltB.rotation.z = -0.35;
  rootGroup.add(beltB);

  // === 右手アタッチ点（武器モデルがここに parent される） ===
  const handR = new THREE.Object3D();
  handR.position.set(0.25, 1.0, 0.02);
  rootGroup.add(handR);
  rootGroup.userData.handR = handR;

  // 左手も一応用意（2 刀流武器や重武器で使う可能性あり）
  const handL = new THREE.Object3D();
  handL.position.set(-0.25, 1.0, 0.02);
  rootGroup.add(handL);
  rootGroup.userData.handL = handL;

  // === Invulnerability blink: 無敵中だけ opacity を sin で点滅 ===
  // 全ての Mesh material に対して一括して transparent=true, opacity を制御。
  // 同一 material インスタンスを共有しているので、Set で重複排除して触る。
  const _mats = new Set();
  rootGroup.traverse((o) => {
    if (o.isMesh && o.material) {
      if (Array.isArray(o.material)) {
        for (const m of o.material) _mats.add(m);
      } else {
        _mats.add(o.material);
      }
    }
  });
  for (const m of _mats) {
    // 元の opacity / transparent を保持
    m.userData = m.userData || {};
    m.userData._baseOpacity = m.opacity != null ? m.opacity : 1.0;
    m.userData._wasTransparent = !!m.transparent;
  }
  // フラグ + setInvulnerable API
  rootGroup.userData._invulnerable = false;
  rootGroup.userData.setInvulnerable = function (on, nowSec) {
    rootGroup.userData._invulnerable = !!on;
    if (!on) {
      for (const m of _mats) {
        m.transparent = !!(m.userData && m.userData._wasTransparent);
        m.opacity = (m.userData && m.userData._baseOpacity != null)
          ? m.userData._baseOpacity : 1.0;
      }
    } else {
      for (const m of _mats) {
        m.transparent = true;
      }
    }
  };
  rootGroup.userData.tickInvulnerable = function (nowSec) {
    if (!rootGroup.userData._invulnerable) return;
    const o = Math.sin(nowSec * 40) * 0.5 + 0.5;
    // 0.25 〜 0.85 の範囲
    const v = 0.25 + o * 0.60;
    for (const m of _mats) {
      m.opacity = v;
    }
  };

  return rootGroup;
}
