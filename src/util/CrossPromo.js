// MuscleLove Cross-Promo: 他5本ゲームへのリンクカード集合
const ML_GAMES = [
  { id:'fps',     ja:'筋肉FPS',         emoji:'🎯',   tag:'FPS 3D',          url:'https://musclelove-fps.vercel.app/'     },
  { id:'slasher', ja:'筋肉スラッシャー', emoji:'⚔️',  tag:'Action 3D',       url:'https://musclelove-slasher.vercel.app/' },
  { id:'runner',  ja:'筋肉ランナー3D',   emoji:'🏃‍♀️', tag:'Endless Runner', url:'https://musclelove-runner.vercel.app/'  },
  { id:'shiren',  ja:'筋肉シレン',       emoji:'🏰',   tag:'Roguelike',       url:'https://musclelove-shiren.vercel.app/'  },
  { id:'cards',   ja:'筋肉カード',       emoji:'🃏',   tag:'Card Battle',     url:'https://musclelove-cards.vercel.app/'   },
  { id:'idle',    ja:'筋肉アイドル',     emoji:'💪',   tag:'Idle RPG',        url:'https://musclelove-idle.vercel.app/'    },
];

const SELF_ID = 'runner';

export function getCrossPromoHTML() {
  const others = ML_GAMES.filter(g => g.id !== SELF_ID);
  const cards = others.map(g => `
    <a class="ml-cross-card" href="${g.url}" target="_blank" rel="noopener">
      <span class="ml-cross-emoji">${g.emoji}</span>
      <span class="ml-cross-name">${g.ja}</span>
      <span class="ml-cross-tag">${g.tag}</span>
    </a>`).join('');
  return `
    <div class="ml-cross-promo">
      <div class="ml-cross-title">💪 他のMuscleLoveゲームも遊ぶ</div>
      <div class="ml-cross-grid">${cards}</div>
      <a class="ml-cross-portal" href="https://musclelove-games.vercel.app/" target="_blank" rel="noopener">
        🏠 全ゲーム一覧（ポータル）
      </a>
    </div>`;
}
