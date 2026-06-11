// Runner タイトル画面。クリックで開始（AudioContext はジェスチャ内で起動）。
export class StartScreen {
  constructor(renderDom) {
    this.el = document.getElementById('startScreen');
    this.renderDom = renderDom;
    this._onStart = null;
    this._preStart = null;
    if (this.el) {
      this.el.addEventListener('click', () => this._handleClick());
    }
  }

  onStart(fn) { this._onStart = fn; }
  preStart(fn) { this._preStart = fn; }

  _handleClick() {
    try { this._preStart?.(); } catch (_) {}
    try { this._onStart?.(); } catch (_) {}
  }

  show() { if (this.el) this.el.style.display = 'flex'; }
  hide() { if (this.el) this.el.style.display = 'none'; }
}
