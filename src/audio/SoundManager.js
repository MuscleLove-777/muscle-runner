// S5: WebAudio API 手続きサウンド。外部音源禁止。
// 使い方: ユーザージェスチャ後に init()+resume()。その後 playXxx() で即時鳴る。
// S6: playReload(weaponId) を武器ごとの時系列シーケンスに拡張
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this._noiseBuf = null;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.45;
    this.master.connect(this.ctx.destination);
    // ホワイトノイズ 1秒バッファ（再利用）
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this._noiseBuf = buf;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _now() { return this.ctx ? this.ctx.currentTime : 0; }

  // 汎用: ホワイトノイズバースト
  _noise(duration, vol, filter) {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    src.loop = true;
    const gain = this.ctx.createGain();
    const t0 = this._now();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    let node = src;
    if (filter) {
      const bp = this.ctx.createBiquadFilter();
      bp.type = filter.type || 'bandpass';
      bp.frequency.value = filter.freq || 1000;
      if (filter.Q != null) bp.Q.value = filter.Q;
      node.connect(bp); bp.connect(gain);
    } else {
      node.connect(gain);
    }
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + duration + 0.05);
  }

  // 汎用: 単発トーン（エンベロープ付き）
  _tone(freq, duration, type = 'sine', vol = 0.3, attack = 0.005, pitchEndRatio = 1.0) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    const t0 = this._now();
    osc.frequency.setValueAtTime(freq, t0);
    if (pitchEndRatio !== 1.0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * pitchEndRatio), t0 + duration);
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain); gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  // --- 武器ごとの発砲音 ---
  playFire(weaponId) {
    if (!this.ctx) return;
    switch (weaponId) {
      case 'GLOCK17':
        this._noise(0.06, 0.45, { type: 'bandpass', freq: 2000, Q: 0.8 });
        this._tone(800, 0.04, 'square', 0.22, 0.002, 0.5);
        break;
      case 'MP5':
        this._noise(0.04, 0.38, { type: 'bandpass', freq: 1600, Q: 0.9 });
        this._tone(600, 0.03, 'sawtooth', 0.2, 0.002, 0.6);
        break;
      case 'M4A1':
        this._noise(0.05, 0.42, { type: 'bandpass', freq: 1400, Q: 0.9 });
        this._tone(450, 0.05, 'square', 0.24, 0.002, 0.55);
        break;
      case 'AK74':
        this._noise(0.07, 0.55, { type: 'bandpass', freq: 900, Q: 0.8 });
        this._tone(300, 0.06, 'square', 0.3, 0.003, 0.5);
        this._tone(120, 0.08, 'sine', 0.22, 0.003, 0.6);
        break;
      case 'R870':
        this._noise(0.15, 0.75, { type: 'bandpass', freq: 700, Q: 0.5 });
        this._tone(150, 0.12, 'sine', 0.35, 0.003, 0.6);
        this._tone(70, 0.14, 'sine', 0.25, 0.003, 0.7);
        break;
      case 'AWP':
        this._noise(0.25, 0.85, { type: 'bandpass', freq: 500, Q: 0.4 });
        this._tone(200, 0.20, 'sine', 0.4, 0.003, 0.5);
        this._tone(80, 0.30, 'sine', 0.3, 0.003, 0.7);
        break;
      case 'DEAGLE':
        this._noise(0.10, 0.60, { type: 'bandpass', freq: 1100, Q: 0.7 });
        this._tone(350, 0.08, 'square', 0.32, 0.003, 0.5);
        this._tone(140, 0.10, 'sine', 0.22, 0.003, 0.6);
        break;
      case 'M79':
        this._noise(0.20, 0.55, { type: 'lowpass', freq: 800, Q: 0.7 });
        this._tone(100, 0.25, 'sine', 0.38, 0.004, 0.55);
        break;
      default:
        this._noise(0.05, 0.35, { type: 'bandpass', freq: 1200, Q: 0.9 });
        this._tone(500, 0.04, 'square', 0.22, 0.002, 0.5);
    }
  }

  // --- リロード共通パーツ ---
  _magRelease() {
    // 高めのカチッ: 800Hz square 0.03s vol0.15 + 軽ノイズ
    this._tone(800, 0.03, 'square', 0.15, 0.002, 0.9);
    this._noise(0.02, 0.08, { type: 'bandpass', freq: 3000, Q: 1.5 });
  }
  _magDrop() {
    // 低めのノイズ + 150Hz sine 0.08s
    this._noise(0.08, 0.18, { type: 'bandpass', freq: 400, Q: 1.2 });
    this._tone(150, 0.08, 'sine', 0.14, 0.003, 0.7);
  }
  _magInsert() {
    // short noise 0.05s + 300Hz tone 0.06s
    this._noise(0.05, 0.18, { type: 'bandpass', freq: 1200, Q: 1.2 });
    this._tone(300, 0.06, 'sine', 0.18, 0.003, 0.8);
  }
  _slideRack() {
    // metallic ダブルクリック（400Hz→600Hzを 0.08s 間隔で 2発）
    this._tone(400, 0.04, 'square', 0.18, 0.002, 0.85);
    this._noise(0.03, 0.12, { type: 'bandpass', freq: 2200, Q: 1.4 });
    setTimeout(() => {
      this._tone(600, 0.04, 'square', 0.18, 0.002, 0.85);
      this._noise(0.03, 0.14, { type: 'bandpass', freq: 2600, Q: 1.4 });
    }, 80);
  }
  _boltClose() {
    // 低音 shorter (200Hz sine 0.12s + noise 0.04s)
    this._tone(200, 0.12, 'sine', 0.22, 0.003, 0.6);
    this._noise(0.04, 0.18, { type: 'bandpass', freq: 800, Q: 1.2 });
  }
  _shellLoad() {
    // short noise+300Hz 0.06s
    this._noise(0.05, 0.15, { type: 'bandpass', freq: 1800, Q: 1.2 });
    this._tone(300, 0.06, 'sine', 0.16, 0.003, 0.8);
  }
  _pumpAction() {
    // 低sharp「シャキン」: noise 0.12s vol0.4 + 450Hz 0.1s
    this._noise(0.12, 0.40, { type: 'bandpass', freq: 1600, Q: 0.9 });
    this._tone(450, 0.10, 'square', 0.22, 0.003, 0.6);
    this._tone(180, 0.09, 'sine', 0.14, 0.003, 0.7);
  }
  _breakOpen() {
    // キィィ系ワイドピッチベンド（500Hz→200Hz 0.25s saw）
    this._tone(500, 0.25, 'sawtooth', 0.18, 0.005, 0.4);
    this._noise(0.10, 0.10, { type: 'bandpass', freq: 1200, Q: 1.3 });
  }

  // --- 武器別リロードシーケンス ---
  playReload(weaponId) {
    if (!this.ctx) return;
    const id = weaponId || '';
    const at = (sec, fn) => {
      if (sec <= 0.0005) { try { fn(); } catch (_) {} }
      else setTimeout(() => { try { fn(); } catch (_) {} }, Math.round(sec * 1000));
    };
    switch (id) {
      case 'GLOCK17':
        at(0.00, () => this._magRelease());
        at(0.40, () => this._magDrop());
        at(0.90, () => this._magInsert());
        at(1.30, () => this._slideRack());
        break;
      case 'MP5':
        at(0.00, () => this._magRelease());
        at(0.40, () => this._magDrop());
        at(1.00, () => this._magInsert());
        at(1.60, () => this._slideRack());
        break;
      case 'M4A1':
        at(0.00, () => this._magRelease());
        at(0.50, () => this._magDrop());
        at(1.10, () => this._magInsert());
        at(1.80, () => this._boltClose());
        break;
      case 'AK74':
        at(0.00, () => this._magRelease());
        at(0.50, () => this._magDrop());
        at(1.30, () => {
          // 重い音: insert を重めに
          this._magInsert();
          this._tone(110, 0.10, 'sine', 0.18, 0.003, 0.65);
        });
        at(2.00, () => this._boltClose());
        break;
      case 'R870': {
        at(0.00, () => this._pumpAction());
        const shellTimes = [0.40, 0.80, 1.20, 1.60, 2.00, 2.40, 2.80];
        for (const t of shellTimes) at(t, () => this._shellLoad());
        at(3.20, () => this._pumpAction());
        break;
      }
      case 'AWP':
        at(0.00, () => this._boltClose());
        at(0.50, () => this._magRelease());
        at(1.20, () => this._magDrop());
        at(2.10, () => {
          // 重く長い insert
          this._magInsert();
          this._tone(90, 0.14, 'sine', 0.20, 0.003, 0.6);
        });
        at(3.00, () => {
          // 重く長い close
          this._boltClose();
          this._tone(140, 0.18, 'sine', 0.20, 0.003, 0.5);
        });
        break;
      case 'DEAGLE':
        at(0.00, () => this._magRelease());
        at(0.60, () => this._magDrop());
        at(1.20, () => {
          // Glock風・重め
          this._magInsert();
          this._tone(180, 0.08, 'sine', 0.16, 0.003, 0.65);
        });
        at(1.80, () => this._slideRack());
        break;
      case 'M79':
        at(0.00, () => this._breakOpen());
        at(1.20, () => {
          // 大口径シェル装填・低め
          this._noise(0.10, 0.22, { type: 'bandpass', freq: 900, Q: 1.0 });
          this._tone(180, 0.15, 'sine', 0.25, 0.003, 0.7);
        });
        at(2.50, () => {
          // ブリーチ閉じる音
          this._boltClose();
          this._tone(120, 0.14, 'sine', 0.22, 0.003, 0.6);
        });
        break;
      default:
        // 既存の軽量デフォルト（後方互換）
        this._noise(0.06, 0.30, { type: 'bandpass', freq: 3000, Q: 1.5 });
        this._tone(220, 0.05, 'sine', 0.15, 0.003, 0.7);
        setTimeout(() => {
          this._noise(0.04, 0.25, { type: 'bandpass', freq: 2600, Q: 2.0 });
          this._tone(180, 0.04, 'sine', 0.12, 0.003, 0.7);
        }, 180);
    }
  }

  playExplosion() {
    if (!this.ctx) return;
    this._noise(0.55, 0.75, { type: 'lowpass', freq: 500, Q: 0.6 });
    this._tone(70, 0.35, 'sine', 0.4, 0.004, 0.45);
    this._tone(140, 0.25, 'sawtooth', 0.25, 0.004, 0.5);
  }

  playEnemyHit() {
    if (!this.ctx) return;
    this._tone(420, 0.16, 'sawtooth', 0.18, 0.005, 0.6);
    this._noise(0.05, 0.10, { type: 'bandpass', freq: 900, Q: 2.0 });
  }

  playEnemyDeath() {
    if (!this.ctx) return;
    this._tone(380, 0.55, 'sawtooth', 0.22, 0.01, 0.35);
    this._tone(180, 0.60, 'sine', 0.15, 0.01, 0.4);
    this._noise(0.25, 0.12, { type: 'bandpass', freq: 700, Q: 1.5 });
  }

  playPlayerHurt() {
    if (!this.ctx) return;
    this._tone(220, 0.25, 'sine', 0.22, 0.005, 0.55);
    this._noise(0.08, 0.18, { type: 'bandpass', freq: 600, Q: 1.5 });
  }

  playFootstep() {
    if (!this.ctx) return;
    this._noise(0.07, 0.12, { type: 'bandpass', freq: 380, Q: 1.8 });
    this._tone(110, 0.04, 'sine', 0.06, 0.002, 0.7);
  }

  // --- muscle-slasher: 近接武器の振り音 ---
  playSwing(weaponId) {
    if (!this.ctx) return;
    switch (weaponId) {
      case 'FIST':
        // 風切りパン
        this._noise(0.06, 0.22, { type: 'bandpass', freq: 1800, Q: 1.2 });
        this._tone(420, 0.05, 'square', 0.08, 0.002, 0.6);
        break;
      case 'BAT':
        // 重いゴッ
        this._noise(0.10, 0.28, { type: 'bandpass', freq: 700, Q: 1.0 });
        this._tone(180, 0.10, 'sine', 0.20, 0.003, 0.5);
        break;
      case 'KATANA':
        // シャキン（高音の金属的な鳴り）
        this._tone(1400, 0.08, 'triangle', 0.22, 0.002, 0.55);
        this._noise(0.06, 0.22, { type: 'bandpass', freq: 2600, Q: 1.4 });
        this._tone(900, 0.10, 'sine', 0.10, 0.002, 0.6);
        break;
      case 'CHAINSAW':
        // ブィーン（持続ノイズ短め＋低音）
        this._noise(0.16, 0.40, { type: 'bandpass', freq: 600, Q: 0.8 });
        this._tone(160, 0.14, 'sawtooth', 0.20, 0.003, 1.05);
        break;
      case 'TONFA':
        // シュッ（軽めの風切り）
        this._noise(0.05, 0.20, { type: 'bandpass', freq: 2200, Q: 1.3 });
        this._tone(620, 0.04, 'triangle', 0.10, 0.002, 0.55);
        break;
      default:
        this._noise(0.05, 0.18, { type: 'bandpass', freq: 1600, Q: 1.2 });
    }
  }

  // --- muscle-slasher: 命中音 ---
  playHit(weaponId) {
    if (!this.ctx) return;
    switch (weaponId) {
      case 'FIST':
        this._tone(260, 0.12, 'square', 0.22, 0.003, 0.55);
        this._noise(0.05, 0.18, { type: 'bandpass', freq: 500, Q: 1.5 });
        break;
      case 'BAT':
        this._tone(140, 0.22, 'sine', 0.30, 0.003, 0.4);
        this._noise(0.08, 0.30, { type: 'bandpass', freq: 400, Q: 1.1 });
        break;
      case 'KATANA':
        this._tone(760, 0.12, 'triangle', 0.22, 0.003, 0.5);
        this._noise(0.04, 0.22, { type: 'bandpass', freq: 3200, Q: 1.6 });
        break;
      case 'CHAINSAW':
        this._noise(0.10, 0.32, { type: 'bandpass', freq: 900, Q: 0.9 });
        this._tone(220, 0.08, 'sawtooth', 0.18, 0.003, 0.7);
        break;
      case 'TONFA':
        this._tone(320, 0.08, 'square', 0.18, 0.003, 0.55);
        this._noise(0.04, 0.18, { type: 'bandpass', freq: 1200, Q: 1.4 });
        break;
      default:
        this._tone(400, 0.10, 'square', 0.18, 0.003, 0.55);
    }
  }

  // --- S5: BGM風アンビエント音 ---
  // 低周波ノイズ + 揺らぎ Pad (200Hz triangle + 210Hz detune) + 低音アクセント（4s毎ランダム、80Hz short）
  startAmbient() {
    if (!this.ctx) return;
    if (this._ambient) return;
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0.30;
    bus.connect(this.master);

    // (a) 低周波ノイズ（ループ）— 再利用ホワイトノイズバッファを lowpass で
    const noise = ctx.createBufferSource();
    noise.buffer = this._noiseBuf;
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    lp.Q.value = 0.8;
    const ng = ctx.createGain();
    ng.gain.value = 0.18;
    noise.connect(lp); lp.connect(ng); ng.connect(bus);
    noise.start();

    // (b) Pad: 200Hz triangle + 210Hz triangle（デチューン）
    const padA = ctx.createOscillator();
    padA.type = 'triangle';
    padA.frequency.value = 200;
    const padB = ctx.createOscillator();
    padB.type = 'triangle';
    padB.frequency.value = 210;
    const padG = ctx.createGain();
    padG.gain.value = 0.10;
    padA.connect(padG); padB.connect(padG); padG.connect(bus);
    padA.start(); padB.start();

    // (c) LFO で padG に揺らぎ
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(padG.gain);
    lfo.start();

    // (d) 低音アクセント（4s 間隔 ± ランダムで 80Hz short）
    const accent = () => {
      if (!this._ambient) return;
      this._tone(80, 0.35, 'sine', 0.22, 0.01, 0.55);
      this._ambientTimer = setTimeout(accent, 3000 + Math.random() * 3000);
    };
    this._ambient = { bus, noise, padA, padB, padG, lfo, lfoGain };
    this._ambientTimer = setTimeout(accent, 2500 + Math.random() * 2000);
  }

  stopAmbient() {
    if (!this._ambient) return;
    try { this._ambient.noise.stop(); } catch (_) {}
    try { this._ambient.padA.stop(); } catch (_) {}
    try { this._ambient.padB.stop(); } catch (_) {}
    try { this._ambient.lfo.stop(); } catch (_) {}
    try { this._ambient.bus.disconnect(); } catch (_) {}
    if (this._ambientTimer) {
      clearTimeout(this._ambientTimer);
      this._ambientTimer = null;
    }
    this._ambient = null;
  }

  setAmbientVolume(v) {
    if (!this._ambient || !this._ambient.bus) return;
    try { this._ambient.bus.gain.value = Math.max(0, Math.min(1, v)); } catch (_) {}
  }

  // --- muscle-slasher: 必殺技音 ---
  playSkill(skillId) {
    if (!this.ctx) return;
    switch (skillId) {
      case 'rush':
        // 連打感（高速トーン連打）
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            if (!this.ctx) return;
            this._tone(300 + i * 60, 0.06, 'square', 0.16, 0.002, 0.6);
            this._noise(0.04, 0.18, { type: 'bandpass', freq: 1400, Q: 1.3 });
          }, i * 80);
        }
        break;
      case 'homerun':
        this._noise(0.25, 0.55, { type: 'bandpass', freq: 600, Q: 0.8 });
        this._tone(120, 0.30, 'sine', 0.35, 0.003, 0.45);
        this._tone(60, 0.35, 'sine', 0.3, 0.003, 0.5);
        break;
      case 'iai':
        // 静→爆ぜ
        this._tone(2200, 0.08, 'sine', 0.12, 0.002, 0.55);
        setTimeout(() => {
          if (!this.ctx) return;
          this._noise(0.20, 0.55, { type: 'bandpass', freq: 2800, Q: 1.3 });
          this._tone(1400, 0.18, 'triangle', 0.3, 0.003, 0.4);
        }, 220);
        break;
      case 'rampage':
        // エンジン高速回転
        this._noise(0.60, 0.55, { type: 'bandpass', freq: 800, Q: 0.7 });
        this._tone(320, 0.50, 'sawtooth', 0.3, 0.005, 1.2);
        break;
      case 'ranbu':
        // 連打の乱れ
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            if (!this.ctx) return;
            this._tone(500 + (i % 3) * 200, 0.05, 'triangle', 0.14, 0.002, 0.6);
            this._noise(0.03, 0.14, { type: 'bandpass', freq: 2000, Q: 1.5 });
          }, i * 60);
        }
        break;
      default:
        this._tone(600, 0.2, 'square', 0.2, 0.003, 0.5);
    }
  }

  // ===== Runner SFX =====
  playJump() {
    if (!this.ctx) return;
    this._tone(380, 0.14, 'triangle', 0.20, 0.005, 1.6);
    this._noise(0.05, 0.10, { type: 'bandpass', freq: 1800, Q: 1.2 });
  }

  playSlide() {
    if (!this.ctx) return;
    this._noise(0.30, 0.32, { type: 'bandpass', freq: 900, Q: 0.8 });
    this._tone(220, 0.18, 'sawtooth', 0.12, 0.006, 0.6);
  }

  playDash() {
    if (!this.ctx) return;
    // 突進: 低→高 ピッチベンド + ホワイトノイズ
    this._tone(120, 0.25, 'sawtooth', 0.28, 0.004, 2.2);
    this._noise(0.20, 0.28, { type: 'bandpass', freq: 1400, Q: 0.9 });
    this._tone(520, 0.12, 'square', 0.14, 0.004, 1.3);
  }

  playCollectProtein() {
    if (!this.ctx) return;
    this._tone(800, 0.08, 'triangle', 0.18, 0.002, 1.4);
    this._tone(1200, 0.10, 'sine', 0.14, 0.002, 1.2);
  }

  playCollectStar() {
    if (!this.ctx) return;
    // キラキラ 3 音階段
    this._tone(900, 0.10, 'triangle', 0.20, 0.003, 1.2);
    setTimeout(() => { if (this.ctx) this._tone(1350, 0.10, 'triangle', 0.20, 0.003, 1.2); }, 70);
    setTimeout(() => { if (this.ctx) this._tone(1800, 0.15, 'triangle', 0.22, 0.003, 1.0); }, 140);
  }

  playCollectEnergy() {
    if (!this.ctx) return;
    // 発電機風の力強い音
    this._tone(200, 0.30, 'sawtooth', 0.28, 0.005, 2.2);
    this._tone(600, 0.25, 'square', 0.18, 0.005, 1.5);
    this._noise(0.18, 0.20, { type: 'bandpass', freq: 2200, Q: 1.1 });
  }

  playCrash() {
    if (!this.ctx) return;
    // ドゴッ: 低周波 noise + 低音
    this._noise(0.22, 0.55, { type: 'lowpass', freq: 600, Q: 0.7 });
    this._tone(90, 0.30, 'sine', 0.35, 0.003, 0.45);
    this._tone(180, 0.18, 'sawtooth', 0.22, 0.003, 0.55);
  }

  playZombieHowl() {
    if (!this.ctx) return;
    // 長めの唸り: 低周波 saw + noise
    this._tone(180, 0.7, 'sawtooth', 0.24, 0.02, 0.55);
    this._tone(90, 0.8, 'sine', 0.18, 0.02, 0.7);
    this._noise(0.5, 0.18, { type: 'bandpass', freq: 600, Q: 1.0 });
  }

  playGameOver() {
    if (!this.ctx) return;
    // 下降フレーズ 3 音
    this._tone(440, 0.35, 'triangle', 0.25, 0.005, 0.6);
    setTimeout(() => { if (this.ctx) this._tone(330, 0.40, 'triangle', 0.25, 0.005, 0.55); }, 260);
    setTimeout(() => { if (this.ctx) this._tone(220, 0.70, 'sawtooth', 0.28, 0.005, 0.45); }, 560);
    this._noise(0.9, 0.18, { type: 'lowpass', freq: 500, Q: 0.8 });
  }
}
