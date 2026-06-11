// エントリポイント。DOM ready 後に Game を作って走らせる。
import { Game } from './Game.js';

function boot() {
  const game = new Game('gameRoot');
  game.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
