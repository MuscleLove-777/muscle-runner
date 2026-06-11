// Runner HUD: 距離 / スコア / HP ハート / ダッシュゲージ / エナジー残秒
// 差分更新で DOM 操作コストを抑える。
export class HUD {
  constructor() {
    this.el = {
      dist:       document.getElementById('hudDistance'),
      score:      document.getElementById('hudScore'),
      hpHearts:   document.getElementById('hpHearts'),
      dashBar:    document.getElementById('dashBar'),
      dashFill:   document.getElementById('dashFill'),
      energy:     document.getElementById('energyTimer'),
      gameOverScreen: document.getElementById('gameOverScreen'),
    };
    this._heartSpans = [];
    if (this.el.hpHearts) {
      this._heartSpans = Array.from(this.el.hpHearts.querySelectorAll('.heart'));
    }
    // 差分キャッシュ
    this._lastDist = -1;
    this._lastScore = -1;
    this._lastHp = -1;
    this._lastDashPct = -1;
    this._lastEnergy = -1;
    this._lastEnergyVis = null;
  }

  updateDistance(m) {
    const v = Math.floor(m);
    if (v === this._lastDist) return;
    this._lastDist = v;
    if (this.el.dist) this.el.dist.textContent = `DIST: ${v}m`;
  }

  updateScore(s) {
    const v = Math.floor(s);
    if (v === this._lastScore) return;
    this._lastScore = v;
    if (this.el.score) this.el.score.textContent = `SCORE: ${v}`;
  }

  updateHearts(hp, hpMax) {
    if (hp === this._lastHp) return;
    this._lastHp = hp;
    for (let i = 0; i < this._heartSpans.length; i++) {
      const on = i < hp;
      this._heartSpans[i].classList.toggle('on', on);
      this._heartSpans[i].classList.toggle('off', !on);
    }
  }

  updateDash(pct) {
    const p = Math.max(0, Math.min(1, pct));
    const r = Math.round(p * 1000);
    if (r === this._lastDashPct) return;
    this._lastDashPct = r;
    if (this.el.dashFill) this.el.dashFill.style.width = (p * 100).toFixed(1) + '%';
  }

  updateEnergy(seconds, visible) {
    const sec = Math.max(0, seconds);
    const vis = !!visible;
    if (vis !== this._lastEnergyVis) {
      this._lastEnergyVis = vis;
      if (this.el.energy) this.el.energy.style.display = vis ? 'block' : 'none';
    }
    if (!vis) return;
    const r = Math.round(sec * 10);
    if (r === this._lastEnergy) return;
    this._lastEnergy = r;
    if (this.el.energy) this.el.energy.textContent = `ENERGY ${sec.toFixed(1)}s`;
  }

  update(state) {
    this.updateDistance(state.distanceM);
    this.updateScore(state.score);
    this.updateHearts(state.hp, state.hpMax);
    this.updateDash(state.dashGauge / (state.dashGaugeMax || 1));
    this.updateEnergy(state.energyRemain, state.energyRemain > 0);
  }

  showGameOver(finalScore, finalDist) {
    if (!this.el.gameOverScreen) return;
    const sEl = this.el.gameOverScreen.querySelector('[data-final-score]');
    const dEl = this.el.gameOverScreen.querySelector('[data-final-dist]');
    if (sEl) sEl.textContent = String(Math.floor(finalScore));
    if (dEl) dEl.textContent = String(Math.floor(finalDist));
    this.el.gameOverScreen.style.display = 'flex';
  }

  hideGameOver() {
    if (this.el.gameOverScreen) this.el.gameOverScreen.style.display = 'none';
  }
}
