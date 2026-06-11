// Runner GameOver 画面。R 長押しでリスタート（Game 側で処理）、X シェアボタン内蔵。
export class GameOverScreen {
  constructor() {
    this.el = document.getElementById('gameOverScreen');
    this._xBtn = null;
    this._ensureShareButton();
  }

  _ensureShareButton() {
    if (!this.el) return;
    if (this._xBtn) return;
    // ヒントの後、ctaGameOver の前に挿入
    const cta = this.el.querySelector('#ctaGameOver');
    const wrapper = document.createElement('div');
    wrapper.id = 'goShareWrap';
    wrapper.style.cssText = 'margin-top: 18px; pointer-events: auto;';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'goShareX';
    btn.className = 'ml-share-x';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg><span>Xでシェア / Share on X</span>';
    btn.addEventListener('click', (e) => { e.stopPropagation(); this._handleShare(); });
    wrapper.appendChild(btn);
    if (cta && cta.parentNode === this.el) {
      this.el.insertBefore(wrapper, cta);
    } else {
      this.el.appendChild(wrapper);
    }
    this._xBtn = btn;
  }

  _handleShare() {
    const dist = Math.floor(this._lastDist || 0);
    const text = `MUSCLE RUNNER で ${dist}m 走り抜けた！💪 3レーン無限ランナー #MuscleLove`;
    const url = 'https://musclelove-runner.vercel.app/';
    const href = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(url);
    try {
      window.open(href, '_blank', 'noopener');
    } catch (_) {}
  }

  show(finalScore, finalDist) {
    if (!this.el) return;
    this._lastScore = finalScore;
    this._lastDist = finalDist;
    const sEl = this.el.querySelector('[data-final-score]');
    const dEl = this.el.querySelector('[data-final-dist]');
    if (sEl) sEl.textContent = String(Math.floor(finalScore));
    if (dEl) dEl.textContent = String(Math.floor(finalDist));
    this.el.style.display = 'flex';
  }

  hide() {
    if (this.el) this.el.style.display = 'none';
  }
}
