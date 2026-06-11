// Runner: 夜間走行路の照明。街路灯オレンジ PointLight を前後に配置。
import * as THREE from 'three';

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    // HemisphereLight 0.8（slasher より若干強め、街路視認性向上）
    this.hemi = new THREE.HemisphereLight(0x4455AA, 0x221122, 0.8);
    scene.add(this.hemi);

    // 月光 DirectionalLight
    this.dir = new THREE.DirectionalLight(0xAACCFF, 1.0);
    this.dir.position.set(10, 20, 5);
    this.dir.castShadow = true;
    this.dir.shadow.mapSize.set(1024, 1024);
    this.dir.shadow.camera.left = -25;
    this.dir.shadow.camera.right = 25;
    this.dir.shadow.camera.top = 25;
    this.dir.shadow.camera.bottom = -25;
    this.dir.shadow.camera.near = 1;
    this.dir.shadow.camera.far = 60;
    this.dir.shadow.bias = -0.0005;
    this.dir.shadow.normalBias = 0.02;
    scene.add(this.dir);

    // 街路灯: 前方 z=-10, -20, -40 + 後方 z=10 にオレンジ PointLight
    // 左右の縁側（x=±3.5 あたり）にもそれぞれ 1 灯ずつ
    this.pointLights = [];
    const lampColor = 0xFFAA66;
    const posList = [
      { x:  3.6, y: 3.2, z: -10, base: 1.4 },
      { x: -3.6, y: 3.2, z: -20, base: 1.4 },
      { x:  3.6, y: 3.2, z: -40, base: 1.2 },
      { x: -3.6, y: 3.2, z:  10, base: 1.2 },
    ];
    for (const p of posList) {
      const pl = new THREE.PointLight(lampColor, p.base, 14, 2.0);
      pl.position.set(p.x, p.y, p.z);
      pl.userData.baseIntensity = p.base;
      pl.userData.phase = Math.random() * Math.PI * 2;
      scene.add(pl);
      this.pointLights.push(pl);
    }

    // プレイヤー足元追従 SpotLight（温色・真上 y=8 から照射）
    this.playerSpot = new THREE.SpotLight(0xFFAA66, 1.3, 15, Math.PI / 5, 0.4, 1.5);
    this.playerSpot.position.set(0, 8, 0);
    this.playerSpot.target.position.set(0, 0, 0);
    scene.add(this.playerSpot);
    scene.add(this.playerSpot.target);

    // fog を暗紫寄りに。前方遠方は濃く、視認しやすい範囲
    scene.fog = new THREE.Fog(0x1A0A1F, 30, 120);
  }

  update(dt, now, playerPos) {
    // 街路灯の脈動（弱め）
    for (const pl of this.pointLights) {
      pl.userData.phase += dt * 2.0;
      const base = pl.userData.baseIntensity || 1.3;
      const tAbs = (now != null ? now : pl.userData.phase);
      const pulse = 1.0 + 0.18 * Math.sin(tAbs * 1.5 + pl.userData.phase * 0.5);
      pl.intensity = base * pulse;
    }
    if (this.playerSpot && playerPos) {
      this.playerSpot.position.set(playerPos.x, playerPos.y + 8, playerPos.z);
      this.playerSpot.target.position.set(playerPos.x, playerPos.y, playerPos.z);
      this.playerSpot.target.updateMatrixWorld();
    }
  }
}
