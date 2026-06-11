// Runner 入力→Player 状態遷移。
// A/← : 左レーン / D/→ : 右レーン / Space: ジャンプ / S: スライド / Shift: ダッシュ長押し
import { RUNNER } from '../config.js';
import { GameState } from '../state/GameState.js';

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function lerp(a, b, t) { return a + (b - a) * t; }

export class PlayerController {
  constructor(game) {
    this.game = game;
    this.player = game.player;
    this.model = game.playerModel;
    this._laneLerpT = 0;
    this._laneLerpFrom = this.player.position.x;
    this._laneLerpTo = this.player.position.x;
    this.onJump = null;
    this.onSlideStart = null;
    this.onDashStart = null;
  }

  update(dt) {
    const input = this.game.input;
    const p = this.player;

    // --- レーン切替入力 ---
    const leftEdge  = input.isKeyDownEdge('KeyA') || input.isKeyDownEdge('ArrowLeft');
    const rightEdge = input.isKeyDownEdge('KeyD') || input.isKeyDownEdge('ArrowRight');
    if (leftEdge) {
      const nl = clamp(p.targetLane - 1, 0, 2);
      if (nl !== p.targetLane) {
        p.targetLane = nl;
        this._laneLerpFrom = p.position.x;
        this._laneLerpTo = RUNNER.laneX[p.targetLane];
        this._laneLerpT = 0;
      }
    }
    if (rightEdge) {
      const nl = clamp(p.targetLane + 1, 0, 2);
      if (nl !== p.targetLane) {
        p.targetLane = nl;
        this._laneLerpFrom = p.position.x;
        this._laneLerpTo = RUNNER.laneX[p.targetLane];
        this._laneLerpT = 0;
      }
    }

    // レーン X 補間（laneSwitchDur 秒で到達）
    if (Math.abs(p.position.x - this._laneLerpTo) > 0.001) {
      this._laneLerpT += dt;
      const k = clamp(this._laneLerpT / RUNNER.laneSwitchDur, 0, 1);
      // ease-out quad
      const e = 1 - (1 - k) * (1 - k);
      p.position.x = lerp(this._laneLerpFrom, this._laneLerpTo, e);
      if (k >= 1) {
        p.position.x = this._laneLerpTo;
        p.lane = p.targetLane;
      }
    } else {
      p.lane = p.targetLane;
    }

    // --- ジャンプ ---
    if (input.isKeyDownEdge('Space') && p.isGrounded && !p.isSliding) {
      p.velY = RUNNER.jumpVel;
      p.isGrounded = false;
      p.isJumping = true;
      try { this.game?.soundManager?.playJump?.(); } catch (_) {}
      if (this.onJump) try { this.onJump(); } catch (_) {}
    }

    // --- スライド ---
    const slideEdge = input.isKeyDownEdge('KeyS') || input.isKeyDownEdge('ArrowDown');
    if (slideEdge && p.isGrounded && !p.isSliding) {
      p.isSliding = true;
      p.slideT = RUNNER.slideDur;
      try { this.game?.soundManager?.playSlide?.(); } catch (_) {}
      if (this.onSlideStart) try { this.onSlideStart(); } catch (_) {}
    }
    if (p.isSliding) {
      p.slideT -= dt;
      if (p.slideT <= 0) {
        p.isSliding = false;
        p.slideT = 0;
      }
    }

    // --- ダッシュ（Shift 長押し + ゲージ） ---
    const shift = input.isKey('ShiftLeft') || input.isKey('ShiftRight');
    if (shift && p.dashGauge > 0) {
      if (!p.isDashing) {
        p.isDashing = true;
        try { this.game?.soundManager?.playDash?.(); } catch (_) {}
        if (this.onDashStart) try { this.onDashStart(); } catch (_) {}
      }
      p.dashGauge = Math.max(0, p.dashGauge - RUNNER.dashCostPerSec * dt);
      if (p.dashGauge <= 0) p.isDashing = false;
    } else {
      p.isDashing = false;
      // 回復（待機中）
      p.dashGauge = Math.min(RUNNER.dashGaugeMax, p.dashGauge + RUNNER.dashRegenPerSec * dt);
    }

    // --- 重力 / Y 軸 ---
    p.velY += RUNNER.gravity * dt;
    p.position.y += p.velY * dt;
    if (p.position.y <= RUNNER.playerBaseY) {
      p.position.y = RUNNER.playerBaseY;
      p.velY = 0;
      if (!p.isGrounded) {
        // 着地
        p.isGrounded = true;
        p.isJumping = false;
      }
    }

    // --- エナジー残時間減衰 ---
    if (GameState.energyRemain > 0) {
      GameState.energyRemain = Math.max(0, GameState.energyRemain - dt);
    }

    // --- 無敵残時間 ---
    if (p.invulnT > 0) p.invulnT = Math.max(0, p.invulnT - dt);

    // --- モデル位置 ---
    if (this.model) {
      // スライド中は視覚的に少し低く（ただし足が地面に埋まらない程度）
      const modelY = p.isSliding ? Math.max(0, p.position.y - 0.15) : p.position.y;
      this.model.position.set(p.position.x, modelY, p.position.z);
      // 常に前方（-Z）を向く
      this.model.rotation.y = Math.PI;
    }

    // --- GameState ミラー ---
    GameState.playerPos.copy(p.position);
    GameState.playerLane = p.lane;
    GameState.isDashing = p.isDashing;
    GameState.isSliding = p.isSliding;
    GameState.isJumping = !p.isGrounded;
    GameState.dashGauge = p.dashGauge;
    GameState.hp = p.hp;
  }
}
