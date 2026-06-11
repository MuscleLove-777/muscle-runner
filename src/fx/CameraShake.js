// S5: カメラシェイク — ThirdPersonCamera の position にノイズを加える。
// Game が cameraShake を保持し、update(dt) で減衰・適用。
// trigger(duration, magnitude) で上乗せ（強い方が優先される）。
import * as THREE from 'three';

export class CameraShake {
  constructor(camera) {
    // camera: ThirdPersonCamera
    this.camera = camera;
    this.t = 0;
    this.duration = 0;
    this.magnitude = 0;
  }

  trigger(duration, magnitude) {
    const d = Math.max(0.01, duration || 0);
    const m = Math.max(0, magnitude || 0);
    // 強度と残時間のうち強い方を採用
    const remainMag = this.magnitude * (1 - Math.min(1, this.t / Math.max(0.01, this.duration)));
    if (m >= remainMag) {
      this.duration = d;
      this.magnitude = m;
      this.t = 0;
    } else {
      // すでに強いシェイク中 → 持続時間だけ延長
      if (d > this.duration - this.t) this.duration = this.t + d;
    }
  }

  // カメラ位置更新後に呼ぶ
  update(dt) {
    if (!this.camera || !this.camera.three) return;
    if (this.t >= this.duration || this.magnitude <= 0) {
      this.t = this.duration = this.magnitude = 0;
      return;
    }
    this.t += dt;
    const u = Math.min(1, this.t / this.duration);
    const fall = 1 - u;
    const mag = this.magnitude * fall;
    const cam = this.camera.three;
    cam.position.x += (Math.random() * 2 - 1) * mag;
    cam.position.y += (Math.random() * 2 - 1) * mag * 0.6;
    cam.position.z += (Math.random() * 2 - 1) * mag;
  }
}
