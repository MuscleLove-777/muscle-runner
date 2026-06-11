// 後方追従カメラ。プレイヤーは (x=laneX, 0, 0) 固定なので位置は追従、FOV はダッシュで広がる。
import * as THREE from 'three';

const _tmpTarget = new THREE.Vector3();
const _tmpLook = new THREE.Vector3();

export class RunnerCamera {
  constructor(aspect) {
    this.three = new THREE.PerspectiveCamera(65, aspect, 0.1, 300);
    // 初期配置
    this.three.position.set(0, 3.2, 6.2);
    this.three.lookAt(0, 1.2, -6);
    this.targetOffset = new THREE.Vector3(0, 3.2, 6.2);
    this.lookAhead = 6;
    this._fov = 65;
  }

  setAspect(aspect) {
    this.three.aspect = aspect;
    this.three.updateProjectionMatrix();
  }

  // 互換 API（InputManager で PointerLock を使わない Runner では空実装）
  getForward() {
    const v = new THREE.Vector3();
    this.three.getWorldDirection(v);
    return v;
  }

  update(playerPos, isDashing, dt) {
    _tmpTarget.copy(playerPos).add(this.targetOffset);
    // 位置 lerp（ほぼ追いつく）
    const k = Math.min(1, dt * 8);
    this.three.position.lerp(_tmpTarget, k);
    // 見る先: プレイヤー + 前方 (-Z) lookAhead
    _tmpLook.copy(playerPos);
    _tmpLook.y += 1.2;
    _tmpLook.z -= this.lookAhead;
    this.three.lookAt(_tmpLook);

    // FOV 補間: 通常 65 → ダッシュ 78
    const targetFov = isDashing ? 78 : 65;
    this._fov += (targetFov - this._fov) * Math.min(1, dt * 6);
    this.three.fov = this._fov;
    this.three.updateProjectionMatrix();
  }
}
