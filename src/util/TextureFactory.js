// S5: Canvas で手続き生成したテクスチャ群。外部リソース禁止ルール対応。
import * as THREE from 'three';

function _rand(a, b) { return a + Math.random() * (b - a); }

function _baseCanvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function _toTex(canvas, { repeat = 1, srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (repeat !== 1) tex.repeat.set(repeat, repeat);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export const TextureFactory = {
  // コンクリート: ベースグレー + ノイズ + 斑点 + ひび
  makeConcreteTexture(size = 512) {
    const c = _baseCanvas(size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#6a6a70';
    ctx.fillRect(0, 0, size, size);
    // ノイズ
    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 30;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
    // 斑点
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(0,0,0,${_rand(0.05, 0.25).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, _rand(1, 4), 0, Math.PI * 2);
      ctx.fill();
    }
    // 薄いひび
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      let x = Math.random() * size, y = Math.random() * size;
      ctx.moveTo(x, y);
      const segs = 5 + Math.floor(Math.random() * 5);
      for (let s = 0; s < segs; s++) {
        x += _rand(-30, 30); y += _rand(-30, 30);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return _toTex(c);
  },

  // 金属パネル: リベット+継ぎ目
  makeMetalTexture(size = 512) {
    const c = _baseCanvas(size);
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, '#595966');
    g.addColorStop(0.5, '#44444f');
    g.addColorStop(1, '#2f2f3a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    // パネル継ぎ目
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2;
    const panel = size / 4;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * panel, 0); ctx.lineTo(i * panel, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * panel); ctx.lineTo(size, i * panel); ctx.stroke();
    }
    // リベット
    for (let px = panel / 2; px < size; px += panel) {
      for (let py = panel / 2; py < size; py += panel) {
        const rx = px + _rand(-2, 2), ry = py + _rand(-2, 2);
        ctx.fillStyle = '#8a8a95';
        ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(rx + 0.8, ry + 0.8, 1.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    // 汚れノイズ
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(0,0,0,${_rand(0.02, 0.12).toFixed(3)})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
    }
    return _toTex(c);
  },

  // アスファルト: ざらつき + 白線
  makeAsphaltTexture(size = 512) {
    const c = _baseCanvas(size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(0, 0, size, size);
    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 40;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
    // 砂利
    for (let i = 0; i < 200; i++) {
      const v = 60 + Math.random() * 80;
      ctx.fillStyle = `rgb(${v|0},${v|0},${(v*0.95)|0})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, _rand(1, 2.5), _rand(1, 2.5));
    }
    return _toTex(c);
  },

  // 床（コンクリ+マーキング）: 大きめ
  makeFloorTexture(size = 1024) {
    const c = _baseCanvas(size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3d3d44';
    ctx.fillRect(0, 0, size, size);
    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 36;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
    // タイル目地
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    const tiles = 4;
    const step = size / tiles;
    for (let i = 0; i <= tiles; i++) {
      ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
    }
    // 黄色マーキング（角と中央寄り）
    ctx.strokeStyle = 'rgba(230,200,60,0.55)';
    ctx.lineWidth = 10;
    ctx.setLineDash([24, 16]);
    ctx.strokeRect(size * 0.12, size * 0.12, size * 0.76, size * 0.76);
    ctx.setLineDash([]);
    // 汚れ
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = `rgba(0,0,0,${_rand(0.05, 0.2).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, _rand(3, 12), 0, Math.PI * 2);
      ctx.fill();
    }
    return _toTex(c);
  },

  // S5: 夜闘技場スカイ（上=漆黒 → 中=紫暗赤 → 下=ネオンピンク気味）+ 星
  makeSkyGradient(w = 1024, h = 512) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    // S6: 視認性向上のためやや明るめ紫寄りにシフト（上 #1A0A25 / 中 #44152A / 下 #6A2A3A）
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.00, '#1A0A25');
    g.addColorStop(0.50, '#44152A');
    g.addColorStop(0.85, '#6A2A3A');
    g.addColorStop(1.00, '#2A0A1A');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // 星（上半分・やや多め） S6: 180 -> 220
    for (let i = 0; i < 220; i++) {
      const y = Math.random() * h * 0.55;
      const x = Math.random() * w;
      const a = _rand(0.35, 1.0);
      // 一部を薄ピンクにして雰囲気
      const pink = Math.random() < 0.12;
      ctx.fillStyle = pink
        ? `rgba(255,200,220,${a.toFixed(2)})`
        : `rgba(255,255,240,${a.toFixed(2)})`;
      const r = Math.random() < 0.80 ? 1 : (Math.random() < 0.8 ? 2 : 3);
      ctx.fillRect(x, y, r, r);
    }
    // ネオン薄雲（下半分帯）
    for (let i = 0; i < 10; i++) {
      const y = h * (0.55 + Math.random() * 0.25);
      const x = Math.random() * w;
      const ww = _rand(100, 260);
      ctx.fillStyle = `rgba(200,60,140,${_rand(0.10, 0.25).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(x, y, ww, _rand(6, 14), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // 遠景サーチライト風（斜めストリーム）
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const x = _rand(0, w);
      const gr = ctx.createLinearGradient(x, h * 0.6, x + 80, 0);
      gr.addColorStop(0, 'rgba(255,80,140,0.18)');
      gr.addColorStop(1, 'rgba(255,80,140,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x - 40, 0, 120, h);
    }
    ctx.globalCompositeOperation = 'source-over';
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  },

  // Runner: アスファルト路面タイル（中央黄色破線 + 白側線）
  makeRoadTile(w = 512, h = 1024) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2a2a30';
    ctx.fillRect(0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 36;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < 280; i++) {
      const v = 60 + Math.random() * 80;
      ctx.fillStyle = `rgb(${v|0},${v|0},${(v*0.95)|0})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, _rand(1, 2.5), _rand(1, 2.5));
    }
    ctx.fillStyle = 'rgba(230,230,230,0.88)';
    ctx.fillRect(w * 0.04, 0, 6, h);
    ctx.fillRect(w * 0.96 - 6, 0, 6, h);
    ctx.fillStyle = 'rgba(240,210,70,0.92)';
    const dashH = 64, gapH = 56;
    for (let y = 0; y < h; y += dashH + gapH) {
      ctx.fillRect(w * 0.33, y, 6, dashH);
      ctx.fillRect(w * 0.66 - 6, y, 6, dashH);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  },

  // Runner: 草地タイル（緑基調 + 草ドット）
  makeGrassTile(w = 512, h = 1024) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2c4a22';
    ctx.fillRect(0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 30;
      d[i] = Math.max(0, Math.min(255, d[i] + n * 0.5));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.4));
    }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const g = 70 + Math.random() * 80;
      ctx.fillStyle = `rgb(${(g*0.4)|0},${g|0},${(g*0.4)|0})`;
      ctx.fillRect(x, y, 1, _rand(2, 4));
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(80,55,30,${_rand(0.18, 0.35).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, _rand(3, 9), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(230,230,230,0.35)';
    ctx.fillRect(w * 0.04, 0, 4, h);
    ctx.fillRect(w * 0.96 - 4, 0, 4, h);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  },

  // Runner: 石畳の市街タイル（街灯光焼き込み風）
  makeStreetTile(w = 512, h = 1024) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3a3842';
    ctx.fillRect(0, 0, w, h);
    const tileW = w / 4;
    const tileH = 80;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2;
    for (let ty = 0; ty < h; ty += tileH) {
      const offset = ((ty / tileH) & 1) ? tileW / 2 : 0;
      for (let tx = -tileW; tx < w + tileW; tx += tileW) {
        ctx.strokeRect(tx + offset, ty, tileW, tileH);
      }
    }
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 22;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2; i++) {
      const cx = i === 0 ? w * 0.2 : w * 0.8;
      const cy = (i === 0 ? 0.3 : 0.75) * h;
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160);
      g.addColorStop(0, 'rgba(255,170,100,0.55)');
      g.addColorStop(1, 'rgba(255,170,100,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 160, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(230,230,230,0.7)';
    ctx.fillRect(w * 0.04, 0, 5, h);
    ctx.fillRect(w * 0.96 - 5, 0, 5, h);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  },
};
