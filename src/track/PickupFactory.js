// Runner 収集物: プロテイン / スター / エナジードリンク
// 各 Group は userData.type と userData.pointValue をもつ。
import * as THREE from 'three';

const _proteinBodyMat = new THREE.MeshStandardMaterial({
  color: 0xFAFAFA, roughness: 0.35, metalness: 0.08,
});
const _proteinLidMat = new THREE.MeshStandardMaterial({
  color: 0x262626, roughness: 0.45, metalness: 0.2,
});
const _proteinLabelMat = new THREE.MeshStandardMaterial({
  color: 0xD0202A, roughness: 0.55, metalness: 0.05,
});

const _starMat = new THREE.MeshStandardMaterial({
  color: 0xF2C94C,
  emissive: 0xFFB020,
  emissiveIntensity: 1.4,
  roughness: 0.25,
  metalness: 0.3,
});

const _energyBodyMat = new THREE.MeshStandardMaterial({
  color: 0x2A2F3A, roughness: 0.3, metalness: 0.85,
});
const _energyRedMat = new THREE.MeshStandardMaterial({
  color: 0xE02040, roughness: 0.4, metalness: 0.6,
});
const _energyBlueMat = new THREE.MeshStandardMaterial({
  color: 0x1D6BE0, emissive: 0x1040AA, emissiveIntensity: 0.35,
  roughness: 0.4, metalness: 0.7,
});

export const PickupFactory = {
  // プロテインシェーカー: シェーカー本体 + 蓋 + 赤ラベル
  buildProtein() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.12, 0.32, 14),
      _proteinBodyMat
    );
    body.position.y = 0.20;
    body.castShadow = true;
    g.add(body);
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.135, 0.135, 0.07, 14),
      _proteinLidMat
    );
    lid.position.y = 0.40;
    g.add(lid);
    // 赤ラベル（Box を貼り付ける雰囲気）
    const label = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.10, 0.015),
      _proteinLabelMat
    );
    label.position.set(0, 0.22, 0.125);
    g.add(label);
    g.userData.type = 'protein';
    g.userData.pointValue = 1;
    g.userData.bobPhase = Math.random() * Math.PI * 2;
    g.userData.yBase = 0;
    g.userData.yOffsetBob = 0; // update 時浮遊用
    return g;
  },

  // スター: 八面体 黄色発光
  buildStar() {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.20, 0),
      _starMat
    );
    core.position.y = 0;
    core.castShadow = false;
    g.add(core);
    // 発光用 PointLight（軽量・range短め）
    const light = new THREE.PointLight(0xFFD470, 0.9, 3.0, 2.0);
    light.position.y = 0;
    g.add(light);
    g.userData.type = 'star';
    g.userData.pointValue = 5;
    g.userData.bobPhase = Math.random() * Math.PI * 2;
    g.userData.yBase = 0;
    return g;
  },

  // エナジードリンク缶: 青＋赤ラベル、メタリック
  buildEnergy() {
    const g = new THREE.Group();
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.32, 16),
      _energyBodyMat
    );
    can.position.y = 0.16;
    can.castShadow = true;
    g.add(can);
    // 青帯
    const blueBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.122, 0.122, 0.14, 16),
      _energyBlueMat
    );
    blueBand.position.y = 0.18;
    g.add(blueBand);
    // 赤アクセント
    const redBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.123, 0.123, 0.04, 16),
      _energyRedMat
    );
    redBand.position.y = 0.11;
    g.add(redBand);
    // 上蓋
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.115, 0.02, 16),
      _proteinLidMat
    );
    lid.position.y = 0.33;
    g.add(lid);
    g.userData.type = 'energy';
    g.userData.pointValue = 20;
    g.userData.bobPhase = Math.random() * Math.PI * 2;
    g.userData.yBase = 0;
    return g;
  },
};
