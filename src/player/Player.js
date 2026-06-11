// Runner: プレイヤーの純粋データ。
// ワールドはスクロール、プレイヤー自身は (x=laneX[lane], y=0 or jump, z=0) 固定。
import * as THREE from 'three';
import { RUNNER } from '../config.js';
import { GameState } from '../state/GameState.js';

export class Player {
  constructor(game) {
    this.game = game;
    this.position = new THREE.Vector3(RUNNER.laneX[1], 0, 0);
    this.lane = 1;           // 現在レーン
    this.targetLane = 1;     // 目標レーン（入力側が書く）
    this.hp = RUNNER.hpMax;
    this.hpMax = RUNNER.hpMax;

    this.velY = 0;
    this.isGrounded = true;
    this.isJumping = false;

    this.isSliding = false;
    this.slideT = 0;

    this.dashGauge = RUNNER.dashGaugeMax;
    this.isDashing = false;

    this.invulnT = 0;
  }

  takeDamage(d = 1) {
    if (this.hp <= 0) return;
    if (this.invulnT > 0) return;
    this.hp = Math.max(0, this.hp - d);
    this.invulnT = RUNNER.damageIFrames;
    try { this.game?.soundManager?.playCrash?.(); } catch (_) {}
    try { this.game?.cameraShake?.trigger?.(0.3, 0.35); } catch (_) {}
    if (this.hp <= 0) {
      this.hp = 0;
      try { this.game?.onGameOver?.(); } catch (_) {}
    }
  }

  reset() {
    this.position.set(RUNNER.laneX[1], 0, 0);
    this.lane = 1; this.targetLane = 1;
    this.hp = this.hpMax;
    this.velY = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.isSliding = false;
    this.slideT = 0;
    this.dashGauge = RUNNER.dashGaugeMax;
    this.isDashing = false;
    this.invulnT = 0;
  }
}
