// Runner 中央ゲームクラス。
// S1+S2: 移動 / トラック / 障害物衝突
// S3:    ピックアップ / HP / HUD / i-Frames
// S4:    背後ゾンビ 5 体 / GameOver 演出 / R 長押しリスタート
// S5:    スピードライン / 砂埃 / 難易度カーブ / 音接続
import * as THREE from 'three';

import { RUNNER } from './config.js';
import { GameState } from './state/GameState.js';
import { InputManager } from './input/InputManager.js';

import { Skybox } from './world/Skybox.js';
import { Lighting } from './world/Lighting.js';
import { TrackManager } from './world/TrackManager.js';

import { Player } from './player/Player.js';
import { buildPlayerModel } from './player/PlayerModel.js';
import { PlayerController } from './player/PlayerController.js';
import { PlayerAnimator } from './player/PlayerAnimator.js';
import { RunnerCamera } from './player/RunnerCamera.js';

import { ObstacleManager } from './track/ObstacleManager.js';
import { PickupManager } from './track/PickupManager.js';

import { ZombieChaser } from './enemies/ZombieChaser.js';

import { HUD } from './ui/HUD.js';
import { StartScreen } from './ui/StartScreen.js';
import { GameOverScreen } from './ui/GameOverScreen.js';

import { BloodSplash } from './fx/BloodSplash.js';
import { Explosion } from './fx/Explosion.js';
import { CameraShake } from './fx/CameraShake.js';
import { SpeedLines } from './fx/SpeedLines.js';
import { DustTrail } from './fx/DustTrail.js';

import { SoundManager } from './audio/SoundManager.js';

export class Game {
  constructor(containerId) {
    this.container = document.getElementById(containerId) || document.body;

    // === Renderer ===
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // === Scene ===
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060612);

    // === Camera ===
    this.camera = new RunnerCamera(window.innerWidth / window.innerHeight);
    this.cameraShake = new CameraShake(this.camera);
    this._camOverride = null; // GameOver 用

    // === World ===
    this.skybox = new Skybox(this.scene);
    this.lighting = new Lighting(this.scene);
    this.trackManager = new TrackManager(this.scene);

    // === Player ===
    this.player = new Player(this);
    this.playerModel = buildPlayerModel();
    this.playerModel.position.set(this.player.position.x, 0, 0);
    this.playerModel.rotation.y = Math.PI;
    this.scene.add(this.playerModel);
    this.playerAnimator = new PlayerAnimator(this.playerModel);
    this.playerController = new PlayerController(this);

    this.playerController.onJump = () => this.playerAnimator.playJump();
    this.playerController.onSlideStart = () => this.playerAnimator.playSlide();
    this.playerController.onDashStart = () => {};

    // === Obstacles / Pickups ===
    this.obstacleManager = new ObstacleManager(this.scene, this);
    this.pickupManager = new PickupManager(this.scene, this);
    this.obstacleManager.populateAll(this.trackManager.tiles);
    this.pickupManager.populateAll(this.trackManager.tiles);
    this.trackManager.onTileRecycled = (tile) => {
      this.obstacleManager.populateTile(tile);
      this.pickupManager.populateTile(tile);
    };

    // === Zombies ===
    this.zombieChaser = new ZombieChaser(this.scene, this);

    // === Sound ===
    this.soundManager = new SoundManager();

    // === Input ===
    this.input = new InputManager(this.renderer.domElement);

    // === UI ===
    this.hud = new HUD();
    this.startScreen = new StartScreen(this.renderer.domElement);
    this.gameOverScreen = new GameOverScreen();

    // === FX ===
    this.speedLines = new SpeedLines();
    this.dustTrail = new DustTrail(this.scene);

    // グローバル参照
    window.__game = this;

    // === State / Meta ===
    GameState.phase = 'title';
    this._playT = 0;
    this._difficulty = 1.0;
    this._nextDiffT = 30.0;
    this._rHoldT = 0;  // R キー長押し検知
    this._howlT = 10.0; // ゾンビの外部 howl スケジュール

    // Start ボタン
    this.startScreen.preStart(() => {
      this.soundManager.init();
      this.soundManager.resume();
    });
    this.startScreen.onStart(() => {
      this._onStartPlaying();
      this.startScreen.hide();
    });

    window.addEventListener('resize', () => this._onResize());
    this._lastT = performance.now() / 1000;
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.setAspect(w / h);
  }

  _onStartPlaying() {
    GameState.phase = 'playing';
    GameState.score = 0;
    GameState.distanceM = 0;
    GameState.scrollSpeed = RUNNER.scrollSpeedStart;
    GameState.dashGauge = RUNNER.dashGaugeMax;
    GameState.energyRemain = 0;
    GameState.hp = RUNNER.hpMax;
    GameState.timeScale = 1.0;
    this.player.reset();
    this._playT = 0;
    this._difficulty = 1.0;
    this._nextDiffT = 30.0;
    this.obstacleManager.difficulty = 1.0;
    try { this.soundManager?.startAmbient?.(); } catch (_) {}
  }

  // === ピックアップ取得時 ===
  onPickup(type, pointValue) {
    if (type === 'protein') {
      GameState.score += (pointValue || 1);
      try { this.soundManager.playCollectProtein(); } catch (_) {}
    } else if (type === 'star') {
      GameState.score += (pointValue || 5);
      try { this.soundManager.playCollectStar(); } catch (_) {}
    } else if (type === 'energy') {
      GameState.score += (pointValue || 20);
      GameState.energyRemain = RUNNER.energyDur;
      try { this.soundManager.playCollectEnergy(); } catch (_) {}
    }
  }

  // === 障害物ヒット時 ===
  onObstacleHit(o) {
    // エナジー中: 障害物を破壊
    if (GameState.energyRemain > 0) {
      try {
        const wp = new THREE.Vector3();
        o.mesh.getWorldPosition(wp);
        Explosion.spawn(this.scene, wp, 2.2);
        if (o.mesh.parent) o.mesh.parent.remove(o.mesh);
        o.destroyed = true;
        this.soundManager?.playExplosion?.();
      } catch (_) {}
      return;
    }
    // 無敵中: 無視
    if (this.player.invulnT > 0) return;
    // 血しぶき + シェイク + ダメージ
    try {
      const wp = new THREE.Vector3();
      o.mesh.getWorldPosition(wp);
      wp.y = 1.1;
      BloodSplash.spawn(this.scene, wp);
    } catch (_) {}
    try { this.cameraShake.trigger(0.35, 0.40); } catch (_) {}
    this.player.takeDamage(1);
  }

  onGameOver() {
    if (GameState.phase === 'gameOver') return;
    GameState.phase = 'gameOver';
    try { this.soundManager.playGameOver?.(); } catch (_) {}
    try { this.soundManager.stopAmbient?.(); } catch (_) {}
    // スローモーション
    GameState.timeScale = 0.3;
    // ゾンビに lunge 指示
    try { this.zombieChaser.lunge(this.player.position); } catch (_) {}
    // カメラ演出パラメータ
    this._camOverride = {
      t: 0, dur: 3.0,
      startYaw: 0, endYaw: Math.PI * 0.5,
      startDist: 6.2, endDist: 12.0,
    };
    // HUD
    try { this.hud.showGameOver(GameState.score, GameState.distanceM); } catch (_) {}
    if (this.gameOverScreen) {
      this.gameOverScreen.show(GameState.score, GameState.distanceM);
    }
  }

  reset() {
    this.player.reset();
    GameState.score = 0;
    GameState.distanceM = 0;
    GameState.scrollSpeed = RUNNER.scrollSpeedStart;
    GameState.dashGauge = RUNNER.dashGaugeMax;
    GameState.energyRemain = 0;
    GameState.hp = RUNNER.hpMax;
    GameState.timeScale = 1.0;
    GameState.phase = 'playing';
    this._playT = 0;
    this._difficulty = 1.0;
    this._nextDiffT = 30.0;
    this._camOverride = null;
    this._rHoldT = 0;
    this.obstacleManager.difficulty = 1.0;
    if (this.gameOverScreen) this.gameOverScreen.hide();
    if (this.hud) this.hud.hideGameOver();
    // モデルの回転復帰
    if (this.playerModel) {
      this.playerModel.rotation.x = 0;
      this.playerModel.rotation.y = Math.PI;
      // 無敵解除
      try { this.playerModel.userData.setInvulnerable?.(false); } catch (_) {}
    }
    // zombies リセット
    try { this.zombieChaser.reset(); } catch (_) {}
    // タイル障害物 + ピックアップ再構築
    for (const t of this.trackManager.tiles) {
      this.obstacleManager.populateTile(t);
      this.pickupManager.populateTile(t);
    }
    try { this.soundManager.startAmbient?.(); } catch (_) {}
  }

  _applyDifficulty(dt) {
    this._playT += dt;
    // スクロール速度は Game.update 側の既存ロジックで加速
    // 障害物難易度カーブ: 30 秒ごとに +0.1 最大 2.0
    if (this._playT >= this._nextDiffT) {
      this._nextDiffT += 30.0;
      this._difficulty = Math.min(2.0, this._difficulty + 0.1);
      this.obstacleManager.difficulty = this._difficulty;
    }
  }

  update() {
    const now = performance.now() / 1000;
    let dt = now - this._lastT;
    this._lastT = now;
    if (dt > 0.1) dt = 0.1;
    GameState.now = now;
    GameState.dt = dt;

    // ESC ポーズ
    if (this.input.isKeyDownEdge('Escape')) {
      if (GameState.phase === 'playing') GameState.phase = 'paused';
      else if (GameState.phase === 'paused') GameState.phase = 'playing';
    }

    // GameOver 中 R 長押し 2 秒でリスタート
    if (GameState.phase === 'gameOver') {
      if (this.input.isKey('KeyR')) {
        this._rHoldT += dt;
        if (this._rHoldT >= 2.0) {
          this._rHoldT = 0;
          this.reset();
        }
      } else {
        this._rHoldT = 0;
      }
    } else {
      this._rHoldT = 0;
    }

    // タイムスケールを 1 に徐々に戻す（GameOver 中はスロー固定）
    if (GameState.phase !== 'gameOver') {
      if (GameState.timeScale < 1.0) {
        GameState.timeScale = Math.min(1.0, GameState.timeScale + dt * 0.8);
      }
    }

    const gdt = dt * GameState.timeScale;

    if (GameState.phase === 'playing') {
      // 1. Controller
      this.playerController.update(gdt);

      // スクロール速度: 通常加速 + ダッシュ倍率 + 経過時間線形ブースト
      const baseSpeed = Math.min(
        RUNNER.scrollSpeedMax,
        RUNNER.scrollSpeedStart + RUNNER.scrollAccel * this._playT
      );
      GameState.scrollSpeed = baseSpeed;
      const effSpeed = this.player.isDashing
        ? GameState.scrollSpeed * RUNNER.dashScrollMul
        : GameState.scrollSpeed;

      // 2. Camera
      this.camera.update(this.player.position, this.player.isDashing, gdt);

      // 3. TrackManager
      this.trackManager.update(gdt, effSpeed);

      // 4. Obstacle
      this.obstacleManager.update(gdt, effSpeed, this.player, this.trackManager.tiles);

      // 4b. Pickup
      this.pickupManager.update(gdt, effSpeed, this.player, this.trackManager.tiles);

      // 5. Zombies
      this.zombieChaser.update(gdt, this.player.position, this.player.isDashing);

      // 6. PlayerAnimator
      const speedFactor = this.player.isDashing ? 1.0 : 0.6;
      this.playerAnimator.update(gdt, true, speedFactor);
      this.playerAnimator.playDashPose(this.player.isDashing);

      // 7. Invulnerability 点滅
      const invuln = this.player.invulnT > 0;
      try {
        if (invuln && !this.playerModel.userData._invulnerable) {
          this.playerModel.userData.setInvulnerable?.(true, now);
        } else if (!invuln && this.playerModel.userData._invulnerable) {
          this.playerModel.userData.setInvulnerable?.(false, now);
        }
        if (invuln) this.playerModel.userData.tickInvulnerable?.(now);
      } catch (_) {}

      // 8. FX update
      BloodSplash.update(gdt);
      Explosion.update(gdt);
      this.dustTrail.update(gdt, this.player.position, this.player.isSliding, true);
      this.speedLines.setActive(this.player.isDashing);

      // 9. Lighting
      this.lighting.update(gdt, now, this.player.position);

      // スコア/距離
      GameState.distanceM += effSpeed * gdt;
      let scoreGain = effSpeed * gdt * 1.0;
      if (this.player.isDashing) scoreGain *= 1.5;
      GameState.score += scoreGain;

      // 難易度
      this._applyDifficulty(gdt);

      // HUD
      this.hud.update(GameState);
    } else if (GameState.phase === 'gameOver') {
      // カメラ回り込み
      if (this._camOverride) {
        this._camOverride.t = Math.min(this._camOverride.dur, this._camOverride.t + dt);
        const k = this._camOverride.t / this._camOverride.dur;
        const e = 1 - (1 - k) * (1 - k);
        const yaw = this._camOverride.startYaw + (this._camOverride.endYaw - this._camOverride.startYaw) * e;
        const dist = this._camOverride.startDist + (this._camOverride.endDist - this._camOverride.startDist) * e;
        const p = this.player.position;
        this.camera.three.position.set(
          p.x + Math.sin(yaw) * dist,
          3.2 + 1.0 * e,
          p.z + Math.cos(yaw) * dist
        );
        this.camera.three.lookAt(p.x, p.y + 1.2, p.z);
      }
      // ゾンビは lunge 中
      try { this.zombieChaser.update(gdt, this.player.position, false); } catch (_) {}
      BloodSplash.update(gdt);
      Explosion.update(gdt);
      this.speedLines.setActive(false);
      this.dustTrail.update(gdt, this.player.position, false, false);
      this.lighting.update(gdt, now, this.player.position);
      this.hud.update(GameState);
    } else if (GameState.phase === 'paused' || GameState.phase === 'title') {
      this.lighting.update(gdt, now, this.player.position);
      this.hud.update(GameState);
      this.speedLines.setActive(false);
    }

    // Camera Shake
    try { this.cameraShake?.update(dt); } catch (_) {}

    // レンダ
    this.renderer.render(this.scene, this.camera.three);

    // 入力 edge クリア
    this.input.update();
  }

  start() {
    const loop = () => {
      this.update();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
