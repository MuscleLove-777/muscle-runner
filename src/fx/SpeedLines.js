// ダッシュ中に画面両サイドに白ラインを流す DOM overlay エフェクト。
// index.html 側に #speedLines DOM がなければ動的に生成する。
export class SpeedLines {
  constructor() {
    this.el = document.getElementById('speedLines');
    if (!this.el) {
      this.el = this._build();
      document.body.appendChild(this.el);
    }
    this.active = false;
  }

  _build() {
    // CSS をページに注入（1 回だけ）
    if (!document.getElementById('speedLinesStyle')) {
      const style = document.createElement('style');
      style.id = 'speedLinesStyle';
      style.textContent = `
#speedLines {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 15;
  opacity: 0;
  transition: opacity 0.2s linear;
}
#speedLines.on { opacity: 1; }
#speedLines .sl-side {
  position: absolute;
  top: 0; bottom: 0;
  width: 20%;
  overflow: hidden;
}
#speedLines .sl-side.left  { left: 0; }
#speedLines .sl-side.right { right: 0; }
#speedLines .sl-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.0) 100%);
  filter: blur(0.5px);
  transform: translateY(-40px);
  animation: slFlow 0.5s linear infinite;
}
#speedLines .sl-side.right .sl-line {
  background: linear-gradient(270deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.0) 100%);
}
@keyframes slFlow {
  0%   { transform: translate(0, -40px); opacity: 0; }
  20%  { opacity: 0.9; }
  100% { transform: translate(0, 110vh);   opacity: 0; }
}
`;
      document.head.appendChild(style);
    }
    const root = document.createElement('div');
    root.id = 'speedLines';
    const sideL = document.createElement('div'); sideL.className = 'sl-side left';
    const sideR = document.createElement('div'); sideR.className = 'sl-side right';
    for (let i = 0; i < 10; i++) {
      const l = document.createElement('div');
      l.className = 'sl-line';
      l.style.top = (i * 10) + '%';
      l.style.animationDelay = (-(Math.random() * 0.5)).toFixed(2) + 's';
      l.style.animationDuration = (0.32 + Math.random() * 0.25).toFixed(2) + 's';
      sideL.appendChild(l);
      const r = document.createElement('div');
      r.className = 'sl-line';
      r.style.top = (i * 10 + 5) + '%';
      r.style.animationDelay = (-(Math.random() * 0.5)).toFixed(2) + 's';
      r.style.animationDuration = (0.32 + Math.random() * 0.25).toFixed(2) + 's';
      sideR.appendChild(r);
    }
    root.appendChild(sideL);
    root.appendChild(sideR);
    return root;
  }

  setActive(on) {
    if (on === this.active) return;
    this.active = on;
    if (!this.el) return;
    this.el.classList.toggle('on', !!on);
  }
}
