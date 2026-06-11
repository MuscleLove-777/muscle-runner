// Runner 共有ステート。HUD/各システムが参照。
import * as THREE from 'three';
import { RUNNER } from '../config.js';

export const GameState = {
  // 'title' | 'playing' | 'paused' | 'gameOver'
  phase: 'title',

  playerPos: new THREE.Vector3(0, 0, 0),
  playerLane: 1,          // 0/1/2 (中央が 1)

  hp: RUNNER.hpMax,
  hpMax: RUNNER.hpMax,

  score: 0,
  distanceM: 0,

  scrollSpeed: RUNNER.scrollSpeedStart,

  dashGauge: RUNNER.dashGaugeMax,
  dashGaugeMax: RUNNER.dashGaugeMax,

  energyRemain: 0,

  isDashing: false,
  isSliding: false,
  isJumping: false,

  now: 0,
  dt: 0,
  timeScale: 1.0,
};
