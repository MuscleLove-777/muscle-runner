// 夜空ドーム。TextureFactory.makeSkyGradient を裏面に貼る大きい球。
import * as THREE from 'three';
import { TextureFactory } from '../util/TextureFactory.js';

export class Skybox {
  constructor(scene) {
    const tex = TextureFactory.makeSkyGradient(1024, 512);
    const geo = new THREE.SphereGeometry(200, 32, 16);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    scene.add(this.mesh);
  }
}
