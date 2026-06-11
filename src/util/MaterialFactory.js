// S2+S4: 武器ビューモデル用の共有マテリアル。毎回生成すると無駄なのでキャッシュ
import * as THREE from 'three';

let _metalGray = null;
let _polymerBlack = null;
let _wood = null;
let _scopeLens = null;
let _brass = null;
let _rubber = null;
let _skinMuscle = null;
let _musclePop = null;
let _wristband = null;

export const MaterialFactory = {
  metalGray() {
    if (!_metalGray) {
      _metalGray = new THREE.MeshStandardMaterial({ color: 0x3A3A3A, roughness: 0.4, metalness: 0.7 });
    }
    return _metalGray;
  },
  polymerBlack() {
    if (!_polymerBlack) {
      _polymerBlack = new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.85, metalness: 0.05 });
    }
    return _polymerBlack;
  },
  wood() {
    if (!_wood) {
      _wood = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.85, metalness: 0 });
    }
    return _wood;
  },
  scopeLens() {
    if (!_scopeLens) {
      _scopeLens = new THREE.MeshStandardMaterial({
        color: 0x2244AA, emissive: 0x112266, emissiveIntensity: 0.3,
        roughness: 0.1, metalness: 0.2,
      });
    }
    return _scopeLens;
  },
  brass() {
    if (!_brass) {
      _brass = new THREE.MeshStandardMaterial({ color: 0xC9A24A, roughness: 0.35, metalness: 0.85 });
    }
    return _brass;
  },
  rubber() {
    if (!_rubber) {
      _rubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95, metalness: 0 });
    }
    return _rubber;
  },
  // MuscleLove: プレイヤー腕・筋肉バンプ用肌色系
  skinMuscle() {
    if (!_skinMuscle) {
      _skinMuscle = new THREE.MeshStandardMaterial({ color: 0xD4A68C, roughness: 0.55, metalness: 0.05 });
    }
    return _skinMuscle;
  },
  musclePop() {
    if (!_musclePop) {
      _musclePop = new THREE.MeshStandardMaterial({ color: 0xC89078, roughness: 0.45, metalness: 0.05 });
    }
    return _musclePop;
  },
  wristband() {
    if (!_wristband) {
      _wristband = new THREE.MeshStandardMaterial({ color: 0xCC2222, roughness: 0.6 });
    }
    return _wristband;
  },
};
