// Runner 版: 走行周期を速くし、jump/slide/dash のポーズオーバーライドを追加。
import * as THREE from 'three';

export class PlayerAnimator {
  constructor(playerModel) {
    this.model = playerModel;
    this.parts = playerModel?.userData?.parts || null;
    this._t = 0;
    this._pose = null; // 'jump'|'slide'|'dash'|null
    this._poseT = 0;

    if (this.parts) {
      this._baseArmLRot = this.parts.armL.rotation.clone();
      this._baseArmRRot = this.parts.armR.rotation.clone();
      this._baseLegLRot = this.parts.legL.rotation.clone();
      this._baseLegRRot = this.parts.legR.rotation.clone();
      this._baseTorsoRot = this.parts.torsoGroup
        ? this.parts.torsoGroup.rotation.clone()
        : new THREE.Euler();
    }
  }

  update(dt, isMoving, speedFactor) {
    if (!this.parts) return;
    // Runner: 常時走っているので isMoving 扱い。走行周期を速く（12 Hz 相当）
    this._t += dt * (isMoving ? (8 + 6 * speedFactor) : 0);
    const s = Math.sin(this._t * 1.5); // 実質 sin(t*12) 相当
    const amp = isMoving ? (0.5 + 0.25 * speedFactor) : 0;

    // 脚: 反位相
    this.parts.legL.rotation.x = this._baseLegLRot.x + s * amp;
    this.parts.legR.rotation.x = this._baseLegRRot.x - s * amp;

    // 腕: 脚と反対
    this.parts.armR.rotation.x = this._baseArmRRot.x - s * amp * 0.9;
    this.parts.armL.rotation.x = this._baseArmLRot.x + s * amp * 0.9;
    // 腕の Z を Base に戻す
    this.parts.armL.rotation.z = this._baseArmLRot.z;
    this.parts.armR.rotation.z = this._baseArmRRot.z;

    // 胴体角度リセット（ポーズで上書き）
    if (this.parts.torsoGroup) {
      this.parts.torsoGroup.rotation.x = this._baseTorsoRot.x;
    }

    // --- ポーズ上書き ---
    if (this._pose) {
      this._poseT += dt;
      const poseEnd = this._pose === 'dash' ? 999 : 0.45;
      if (this._pose === 'jump') {
        // 両腕軽く上げ、片膝上げ
        const k = Math.min(1, this._poseT / 0.25);
        this.parts.armL.rotation.x = this._baseArmLRot.x - 0.9 * (1 - k) - 0.2;
        this.parts.armR.rotation.x = this._baseArmRRot.x - 0.9 * (1 - k) - 0.2;
        this.parts.legL.rotation.x = this._baseLegLRot.x + 0.8 * (1 - k) + 0.2;
        this.parts.legR.rotation.x = this._baseLegRRot.x - 0.3;
      } else if (this._pose === 'slide') {
        // 伏せポーズ: 胴体前傾、両腕後方
        if (this.parts.torsoGroup) {
          this.parts.torsoGroup.rotation.x = this._baseTorsoRot.x - 1.0;
        }
        this.parts.armL.rotation.x = this._baseArmLRot.x + 0.9;
        this.parts.armR.rotation.x = this._baseArmRRot.x + 0.9;
        this.parts.legL.rotation.x = this._baseLegLRot.x + 0.3;
        this.parts.legR.rotation.x = this._baseLegRRot.x + 0.5;
      } else if (this._pose === 'dash') {
        // 前傾 + 腕を素早く（周期維持）
        if (this.parts.torsoGroup) {
          this.parts.torsoGroup.rotation.x = this._baseTorsoRot.x - 0.35;
        }
        // ふつうの走行腕振りは残す
      }
      if (this._pose !== 'dash' && this._poseT >= poseEnd) {
        this._pose = null;
        this._poseT = 0;
      }
    }
  }

  playJump() {
    this._pose = 'jump';
    this._poseT = 0;
  }
  playSlide() {
    this._pose = 'slide';
    this._poseT = 0;
  }
  playDashPose(on) {
    if (on) { this._pose = 'dash'; this._poseT = 0; }
    else if (this._pose === 'dash') { this._pose = null; this._poseT = 0; }
  }
}
