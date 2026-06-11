// S3: MuscleLove 仕様の共通ゾンビモデル（筋肉質な女戦士ゾンビ）
// rootGroup（足元原点、身長約1.68m）を返す。
// 旧API `ZombieGirlBase.buildBase(params)` の形は維持。
// 返値 Group / userData.parts に bodyGroup, torsoGroup, headGroup, legL, legR, armL, armR, ponytail, hitMeshes
import * as THREE from 'three';

// ---------- Texture helpers (procedural, cached) ----------
let _mouthTex = null;
function getMouthTex() {
  if (_mouthTex) return _mouthTex;
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  // 口
  ctx.fillStyle = '#3a0808';
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2, size * 0.40, size * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();
  // 歯
  ctx.fillStyle = '#d8c8b8';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(size / 2 + i * 6 - 1.5, size / 2 - 3, 3, 6);
  }
  // 垂れ血
  ctx.fillStyle = '#8a0000';
  ctx.beginPath();
  ctx.moveTo(size * 0.40, size * 0.60);
  ctx.lineTo(size * 0.50, size * 0.98);
  ctx.lineTo(size * 0.60, size * 0.60);
  ctx.closePath();
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  _mouthTex = tex;
  return tex;
}

let _bloodTex = null;
function getBloodTex() {
  if (_bloodTex) return _bloodTex;
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(138, 0, 0, 0.9)';
  for (let i = 0; i < 10; i++) {
    const x = size / 2 + (Math.random() - 0.5) * size * 0.7;
    const y = size / 2 + (Math.random() - 0.5) * size * 0.7;
    const r = 3 + Math.random() * 12;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  _bloodTex = tex;
  return tex;
}

function darken(hex, factor) {
  const r = ((hex >> 16) & 0xff) * factor;
  const g = ((hex >> 8) & 0xff) * factor;
  const b = (hex & 0xff) * factor;
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

// 筋肉の陰影を少し濃くした肌色（バンプ用）
function skinPop(hex) {
  return darken(hex, 0.82);
}

export const ZombieGirlBase = {
  buildBase(params) {
    const {
      skinTone = 0xD4A68C,
      uniformColor = 0x1E3A8A,  // sports bra color
      hairColor = 0x5A2B12,
      bodyScale = 1.0,
      bloodCount = 7,
    } = params || {};

    const rootGroup = new THREE.Group();

    const bodyGroup = new THREE.Group();
    bodyGroup.scale.setScalar(bodyScale);
    rootGroup.add(bodyGroup);

    // --- Materials ---
    const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.55, metalness: 0.05 });
    const popMat  = new THREE.MeshStandardMaterial({ color: skinPop(skinTone), roughness: 0.45, metalness: 0.05 });
    const braMat  = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.65 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: darken(uniformColor, 0.55), roughness: 0.75 });
    const sideStripeMat = new THREE.MeshStandardMaterial({ color: 0xF2F2F2, roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.6 });
    const accentRed = new THREE.MeshStandardMaterial({ color: 0xCC1E1E, roughness: 0.5, metalness: 0.1 });

    // ====== Legs ======
    // 太ももは太めのシリンダー（上太・下細）
    const legGeo = new THREE.CylinderGeometry(0.13, 0.09, 0.78, 12);
    const legL = new THREE.Mesh(legGeo, skinMat);
    legL.position.set(-0.11, 0.42, 0);
    legL.castShadow = true;
    const legR = new THREE.Mesh(legGeo, skinMat);
    legR.position.set(0.11, 0.42, 0);
    legR.castShadow = true;
    bodyGroup.add(legL);
    bodyGroup.add(legR);

    // 大腿四頭筋（太もも前面の盛り上がり）各脚2つ
    const quadGeo = new THREE.SphereGeometry(0.09, 10, 8);
    function addQuads(parentLeg) {
      const q1 = new THREE.Mesh(quadGeo, popMat);
      q1.position.set(0, 0.12, 0.07);
      parentLeg.add(q1);
      const q2 = new THREE.Mesh(quadGeo, popMat);
      q2.position.set(0, -0.05, 0.065);
      q2.scale.set(0.85, 0.8, 0.85);
      parentLeg.add(q2);
      // 腓腹筋（ふくらはぎ、後面）
      const calf = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), popMat);
      calf.position.set(0, -0.25, -0.06);
      calf.scale.set(1.0, 1.3, 1.0);
      parentLeg.add(calf);
    }
    addQuads(legL);
    addQuads(legR);

    // ショートスパッツ（腰回り）
    const shorts = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.14, 0.24),
      shortsMat
    );
    shorts.position.set(0, 0.95, 0);
    shorts.castShadow = true;
    bodyGroup.add(shorts);

    // サイドストライプ（左右）
    const stripeGeo = new THREE.BoxGeometry(0.008, 0.14, 0.06);
    const stripeL = new THREE.Mesh(stripeGeo, sideStripeMat);
    stripeL.position.set(-0.192, 0.95, 0);
    bodyGroup.add(stripeL);
    const stripeR = new THREE.Mesh(stripeGeo, sideStripeMat);
    stripeR.position.set(0.192, 0.95, 0);
    bodyGroup.add(stripeR);

    // ====== Torso ======
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.10, 0);
    bodyGroup.add(torsoGroup);

    // 胴体本体（肌）
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.50, 0.22),
      skinMat
    );
    torso.position.set(0, 0.22, 0);
    torso.castShadow = true;
    torsoGroup.add(torso);

    // 大胸筋 Box 左右（中央に溝が出るよう離して配置）
    const pecGeo = new THREE.BoxGeometry(0.17, 0.12, 0.05);
    const pecL = new THREE.Mesh(pecGeo, popMat);
    pecL.position.set(-0.095, 0.33, 0.115);
    torsoGroup.add(pecL);
    const pecR = new THREE.Mesh(pecGeo, popMat);
    pecR.position.set(0.095, 0.33, 0.115);
    torsoGroup.add(pecR);

    // スポーツブラ（Boxで胸部を覆う）
    const bra = new THREE.Mesh(
      new THREE.BoxGeometry(0.40, 0.14, 0.24),
      braMat
    );
    bra.position.set(0, 0.33, 0);
    bra.castShadow = true;
    torsoGroup.add(bra);

    // ブラのストラップ（薄Box x2）
    const strapGeo = new THREE.BoxGeometry(0.035, 0.14, 0.02);
    const strapL = new THREE.Mesh(strapGeo, braMat);
    strapL.position.set(-0.11, 0.44, 0.10);
    torsoGroup.add(strapL);
    const strapR = new THREE.Mesh(strapGeo, braMat);
    strapR.position.set(0.11, 0.44, 0.10);
    torsoGroup.add(strapR);

    // 腹直筋 6パック（横3 x 縦2）
    const absGeo = new THREE.BoxGeometry(0.04, 0.05, 0.03);
    for (let row = 0; row < 2; row++) {
      for (let col = -1; col <= 1; col++) {
        const ab = new THREE.Mesh(absGeo, popMat);
        ab.position.set(col * 0.05, 0.15 - row * 0.065, 0.115);
        torsoGroup.add(ab);
      }
    }

    // 腰のVライン示唆（薄いBox、斜め）
    const vLineGeoL = new THREE.BoxGeometry(0.09, 0.02, 0.01);
    const vLineL = new THREE.Mesh(vLineGeoL, popMat);
    vLineL.position.set(-0.08, 0.04, 0.115);
    vLineL.rotation.z = 0.5;
    torsoGroup.add(vLineL);
    const vLineR = new THREE.Mesh(vLineGeoL, popMat);
    vLineR.position.set(0.08, 0.04, 0.115);
    vLineR.rotation.z = -0.5;
    torsoGroup.add(vLineR);

    // ネックレス/チョーカー（赤アクセント）
    const choker = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.012, 6, 18),
      accentRed
    );
    choker.rotation.x = Math.PI / 2;
    choker.position.set(0, 0.52, 0);
    torsoGroup.add(choker);

    // 首（太めの首筋）
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.075, 0.15, 10),
      skinMat
    );
    neck.position.set(0, 0.55, 0);
    torsoGroup.add(neck);

    // ====== Arms ======
    // 上腕（太め、肌）
    const upperArmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.28, 12);
    const armL = new THREE.Mesh(upperArmGeo, skinMat);
    armL.position.set(-0.25, 0.30, 0);
    armL.rotation.x = 0.14;
    armL.castShadow = true;
    torsoGroup.add(armL);
    const armR = new THREE.Mesh(upperArmGeo, skinMat);
    armR.position.set(0.25, 0.30, 0);
    armR.rotation.x = 0.14;
    armR.castShadow = true;
    torsoGroup.add(armR);

    // 三角筋・二頭筋・三頭筋を各上腕に追加（parent=arm なのでarmが動けば一緒に動く）
    function addDelts(arm, sign) {
      // 三角筋（肩の盛り上がり）
      const delt = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), popMat);
      delt.position.set(0, 0.14, 0);
      arm.add(delt);
      arm.userData._delt = delt;
      // 二頭筋（前面）
      const biceps = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), popMat);
      biceps.position.set(0, 0.03, 0.03);
      arm.add(biceps);
      arm.userData._biceps = biceps;
      // 三頭筋（後面）
      const triceps = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), popMat);
      triceps.position.set(0, 0.00, -0.025);
      arm.add(triceps);
      arm.userData._triceps = triceps;
    }
    addDelts(armL, -1);
    addDelts(armR, 1);

    // 前腕（上腕の下端にぶら下げ、肘の折れを表現するため少し前傾）
    const forearmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.28, 10);
    function addForearm(arm) {
      const fa = new THREE.Mesh(forearmGeo, skinMat);
      fa.position.set(0, -0.24, 0.04);
      fa.rotation.x = -0.25;
      fa.castShadow = true;
      arm.add(fa);
      // 手（握り拳）
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.06), skinMat);
      hand.position.set(0, -0.16, 0.02);
      fa.add(hand);
      return fa;
    }
    addForearm(armL);
    addForearm(armR);

    // ====== Head ======
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.55, 0);
    bodyGroup.add(headGroup);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 16, 12),
      skinMat
    );
    head.castShadow = true;
    headGroup.add(head);

    // 目（赤発光）
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF4444 });
    const eyeGeo = new THREE.SphereGeometry(0.02, 8, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.045, 0.02, 0.115);
    headGroup.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.045, 0.02, 0.115);
    headGroup.add(eyeR);

    // 口（血糊テクスチャ付きPlane）
    const mouthMat = new THREE.MeshBasicMaterial({
      map: getMouthTex(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.025), mouthMat);
    mouth.position.set(0, -0.05, 0.126);
    headGroup.add(mouth);

    // ポニーテール（長めCylinderを後ろに垂らす）
    const ponytail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.015, 0.50, 10),
      hairMat
    );
    ponytail.position.set(0, -0.05, -0.18);
    ponytail.rotation.x = -0.75; // 後ろに垂らす
    ponytail.castShadow = true;
    headGroup.add(ponytail);

    // ポニテの結び目（赤リボン）
    const tie = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.012, 6, 14),
      accentRed
    );
    tie.position.set(0, 0.05, -0.09);
    tie.rotation.x = Math.PI / 2;
    headGroup.add(tie);

    // 前髪（Box、顔の前）
    const bangs = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.07, 0.04),
      hairMat
    );
    bangs.position.set(0, 0.10, 0.10);
    headGroup.add(bangs);

    // 横髪（耳側、薄いBox）
    const sideHairGeo = new THREE.BoxGeometry(0.04, 0.18, 0.14);
    const sideL = new THREE.Mesh(sideHairGeo, hairMat);
    sideL.position.set(-0.13, 0.02, 0.00);
    headGroup.add(sideL);
    const sideR = new THREE.Mesh(sideHairGeo, hairMat);
    sideR.position.set(0.13, 0.02, 0.00);
    headGroup.add(sideR);

    // リストバンド（赤、各前腕）
    // forearmはarm.children[末端]なので、位置を取りに行くより直接手元に付ける
    const wristGeo = new THREE.BoxGeometry(0.085, 0.03, 0.085);
    const wristMat = new THREE.MeshStandardMaterial({ color: 0xCC2222, roughness: 0.6 });
    function addWristband(arm) {
      // forearm = arm.children の最後に追加したMesh(Cylinder)
      let forearm = null;
      for (const c of arm.children) {
        if (c.geometry && c.geometry.type === 'CylinderGeometry') forearm = c;
      }
      if (!forearm) return;
      const wb = new THREE.Mesh(wristGeo, wristMat);
      wb.position.set(0, -0.12, 0);
      forearm.add(wb);
    }
    addWristband(armL);
    addWristband(armR);

    // ====== Blood splashes ======
    const bloodGroup = new THREE.Group();
    const bloodMat = new THREE.MeshStandardMaterial({
      map: getBloodTex(),
      color: 0x8A0000,
      roughness: 0.3,
      transparent: true,
      depthWrite: false,
    });
    for (let i = 0; i < bloodCount; i++) {
      const sz = 0.07 + Math.random() * 0.14;
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(sz, sz),
        bloodMat
      );
      const angle = Math.random() * Math.PI * 2;
      const r = 0.12;
      const y = 0.80 + Math.random() * 0.75; // 腰〜首元までランダム
      plane.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      plane.lookAt(plane.position.x * 2, plane.position.y, plane.position.z * 2);
      plane.rotation.z = Math.random() * Math.PI * 2;
      bloodGroup.add(plane);
    }
    bodyGroup.add(bloodGroup);

    // ====== hitZone 設定 ======
    head.userData.hitZone = 'head';
    neck.userData.hitZone = 'body';
    torso.userData.hitZone = 'body';
    pecL.userData.hitZone = 'body';
    pecR.userData.hitZone = 'body';
    bra.userData.hitZone = 'body';
    shorts.userData.hitZone = 'body';
    armL.userData.hitZone = 'body';
    armR.userData.hitZone = 'body';
    legL.userData.hitZone = 'leg';
    legR.userData.hitZone = 'leg';

    // ====== userData.parts ======
    rootGroup.userData.parts = {
      bodyGroup, torsoGroup, headGroup,
      legL, legR, armL, armR,
      ponytail,
      // 派生クラスで筋肉バンプを再スケールするための参照
      pecL, pecR, bra, shorts,
      deltL: armL.userData._delt, deltR: armR.userData._delt,
      bicepsL: armL.userData._biceps, bicepsR: armR.userData._biceps,
      tricepsL: armL.userData._triceps, tricepsR: armR.userData._triceps,
      // hitMeshes はレイキャスト対象
      hitMeshes: [head, torso, bra, shorts, pecL, pecR, armL, armR, legL, legR],
    };

    return rootGroup;
  },
};
