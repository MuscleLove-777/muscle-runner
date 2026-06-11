# MUSCLE RUNNER

3D 無限ランナー。筋肉美女主人公が 3 レーンを駆け抜け、障害物をジャンプ/スライド/ダッシュで突破する。MuscleLove ゲームシリーズ第 2 弾。

## 操作

| 入力 | アクション |
|------|-----------|
| A / ← | 左レーン |
| D / → | 右レーン |
| SPACE | ジャンプ |
| S | スライド |
| SHIFT (hold) | ダッシュ（ゲージ制、FOV 広がる） |
| ESC | 一時停止 |
| R | ゲームオーバー後のリスタート |

## 起動

ローカルサーバが必要（ES Module + import map）。

```bash
cd muscle-runner
python -m http.server 8080
# http://localhost:8080/
```

ブラウザで開き、タイトル画面をクリックして開始。

## アーキテクチャ

- `src/Game.js`       — 中央ゲームクラス。update 順 Input→Controller→Camera→TrackManager→Obstacle→PlayerAnimator→FX→HUD→render
- `src/config.js`     — RUNNER 定数
- `src/state/GameState.js` — 共有ステート
- `src/player/`       — Player / PlayerController / PlayerAnimator / PlayerModel / RunnerCamera
- `src/world/`        — Skybox / Lighting / TrackManager
- `src/track/`        — ObstacleFactory / ObstacleManager
- `src/ui/`           — HUD / StartScreen / GameOverScreen
- `src/util/`         — MaterialFactory / MathUtil / TextureFactory
- `src/audio/`        — SoundManager（WebAudio 手続き生成）
- `src/fx/`           — BloodSplash / Explosion / CameraShake
- `src/enemies/models/ZombieGirlBase.js` — 共通人体モデル（slasher 流用）

外部画像/音源は使わず、全テクスチャ/SFX は手続き生成。

## デプロイ

ルート直下の `vercel.json` / `.hostname-fix.cjs` で Vercel にデプロイ可能（`vercel --prod`）。
