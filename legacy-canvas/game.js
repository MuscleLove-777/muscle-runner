// ========== Muscle Runner - Game Engine ==========
(function () {
  'use strict';

  // --- Canvas setup ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('game-container');

  const W = 900;
  const H = 506; // 16:9
  canvas.width = W;
  canvas.height = H;

  // --- DOM refs ---
  const hudEl = document.getElementById('hud');
  const hudDist = document.getElementById('hud-distance');
  const hudProtein = document.getElementById('hud-protein');
  const hudStars = document.getElementById('hud-stars');
  const titleScreen = document.getElementById('title-screen');
  const gameoverScreen = document.getElementById('gameover-screen');
  const resDist = document.getElementById('res-distance');
  const resProtein = document.getElementById('res-protein');
  const resStars = document.getElementById('res-stars');
  const resBest = document.getElementById('res-best');
  const btnStart = document.getElementById('btn-start');
  const btnRetry = document.getElementById('btn-retry');
  const btnShare = document.getElementById('btn-x-share');

  // --- Audio (Web Audio API) ---
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playTone(freq, duration, type = 'square', vol = 0.12) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function sfxJump() {
    playTone(400, 0.15, 'square', 0.1);
    setTimeout(() => playTone(600, 0.1, 'square', 0.08), 50);
  }

  function sfxCollect() {
    playTone(800, 0.08, 'sine', 0.12);
    setTimeout(() => playTone(1200, 0.1, 'sine', 0.1), 60);
  }

  function sfxStar() {
    playTone(1000, 0.06, 'sine', 0.12);
    setTimeout(() => playTone(1400, 0.08, 'sine', 0.1), 50);
    setTimeout(() => playTone(1800, 0.1, 'sine', 0.08), 100);
  }

  function sfxCrash() {
    playTone(150, 0.3, 'sawtooth', 0.15);
    playTone(100, 0.4, 'square', 0.1);
  }

  // --- Background images ---
  const bgImages = [];
  const IMG_COUNT = 10;
  let imagesLoaded = 0;
  for (let i = 1; i <= IMG_COUNT; i++) {
    const img = new Image();
    img.src = `images/img${i}.png`;
    img.onload = () => imagesLoaded++;
    bgImages.push(img);
  }

  // --- Game state ---
  const GROUND_Y = H - 70;
  const GRAVITY = 0.55;
  const JUMP_FORCE = -12;
  const HOLD_FORCE = -0.45;
  const MAX_HOLD_FRAMES = 18;

  let state = 'title'; // title, playing, gameover
  let distance = 0;
  let proteinCount = 0;
  let starCount = 0;
  let bestDistance = parseInt(localStorage.getItem('muscleRunnerBest') || '0', 10);
  let speed = 5;
  let frameCount = 0;
  let jumpHeld = false;
  let holdFrames = 0;

  // Player
  const player = {
    x: 120,
    y: GROUND_Y,
    w: 40,
    h: 50,
    vy: 0,
    onGround: true,
    frame: 0,
  };

  // Obstacles & collectibles
  let obstacles = [];
  let collectibles = [];
  let particles = [];

  // Background parallax layers
  let bgOffset1 = 0;
  let bgOffset2 = 0;
  let bgOffset3 = 0;

  // Background image display
  let currentBgImg = null;
  let bgImgAlpha = 0;
  let bgImgTimer = 0;
  let bgImgIndex = 0;
  const BG_IMG_INTERVAL = 600; // frames between images
  const BG_IMG_FADE_IN = 120;
  const BG_IMG_HOLD = 300;
  const BG_IMG_FADE_OUT = 120;

  // Ground decorations
  let groundDeco = [];

  // --- Utility ---
  function rand(a, b) { return Math.random() * (b - a) + a; }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

  // --- Reset ---
  function resetGame() {
    distance = 0;
    proteinCount = 0;
    starCount = 0;
    speed = 5;
    frameCount = 0;
    jumpHeld = false;
    holdFrames = 0;
    player.y = GROUND_Y;
    player.vy = 0;
    player.onGround = true;
    player.frame = 0;
    obstacles = [];
    collectibles = [];
    particles = [];
    bgOffset1 = 0;
    bgOffset2 = 0;
    bgOffset3 = 0;
    bgImgAlpha = 0;
    bgImgTimer = 0;
    bgImgIndex = randInt(0, IMG_COUNT - 1);
    currentBgImg = null;
    groundDeco = [];
    for (let x = 0; x < W + 200; x += randInt(60, 150)) {
      groundDeco.push({ x, type: randInt(0, 2) });
    }
  }

  // --- Spawn ---
  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'dumbbell' : 'barbell';
    const h = type === 'dumbbell' ? randInt(35, 55) : randInt(25, 40);
    const w = type === 'dumbbell' ? 35 : randInt(50, 70);
    obstacles.push({
      x: W + 50,
      y: GROUND_Y - h + 10,
      w,
      h,
      type,
    });
  }

  function spawnCollectible() {
    const type = Math.random() < 0.75 ? 'protein' : 'star';
    const yOff = randInt(40, 140);
    collectibles.push({
      x: W + 50,
      y: GROUND_Y - yOff,
      w: 28,
      h: 28,
      type,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  // --- Particles ---
  function addParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: rand(-3, 3),
        vy: rand(-4, 1),
        life: randInt(15, 35),
        maxLife: 35,
        color,
        size: rand(2, 5),
      });
    }
  }

  // --- Drawing helpers ---
  function drawGradientRect(x, y, w, h, c1, c2, vertical = true) {
    const grad = vertical
      ? ctx.createLinearGradient(x, y, x, y + h)
      : ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  function drawText(text, x, y, size, color, align = 'left', font = 'Orbitron') {
    ctx.font = `bold ${size}px ${font}, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  // --- Draw background ---
  function drawBackground() {
    // Dark sky gradient
    drawGradientRect(0, 0, W, GROUND_Y + 10, '#0a0a1a', '#151528');

    // Stars in sky
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137 + bgOffset1 * 0.1) % (W + 20)) - 10;
      const sy = (i * 73) % (GROUND_Y - 50) + 10;
      const ss = (i % 3) + 1;
      ctx.fillRect(sx, sy, ss, ss);
    }

    // Parallax mountain layer (far)
    ctx.fillStyle = '#12121f';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= W; x += 60) {
      const h = Math.sin((x + bgOffset1 * 0.3) * 0.008) * 60 + Math.sin((x + bgOffset1 * 0.3) * 0.015) * 30;
      ctx.lineTo(x, GROUND_Y - 80 - h);
    }
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Parallax hills (mid)
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= W; x += 40) {
      const h = Math.sin((x + bgOffset2 * 0.6) * 0.012) * 40 + Math.sin((x + bgOffset2 * 0.6) * 0.025) * 20;
      ctx.lineTo(x, GROUND_Y - 40 - h);
    }
    ctx.lineTo(W, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Background muscle girl image (fading in/out)
    if (currentBgImg && bgImgAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = bgImgAlpha * 0.15;
      const img = currentBgImg;
      const imgAspect = img.width / img.height;
      const drawH = GROUND_Y * 0.85;
      const drawW = drawH * imgAspect;
      const drawX = W / 2 - drawW / 2;
      const drawY = GROUND_Y - drawH;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    // Ground
    drawGradientRect(0, GROUND_Y, W, H - GROUND_Y, '#1e1e3a', '#14142a');

    // Ground line
    ctx.strokeStyle = '#ff2d95';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff2d95';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(W, GROUND_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ground decorations (dashes)
    ctx.strokeStyle = 'rgba(0,255,255,0.15)';
    ctx.lineWidth = 1;
    for (const d of groundDeco) {
      const dx = ((d.x - bgOffset3) % (W + 200));
      const adjustedX = dx < -100 ? dx + W + 200 : dx;
      if (d.type === 0) {
        ctx.beginPath();
        ctx.moveTo(adjustedX, GROUND_Y + 15);
        ctx.lineTo(adjustedX + 20, GROUND_Y + 15);
        ctx.stroke();
      } else if (d.type === 1) {
        ctx.beginPath();
        ctx.moveTo(adjustedX, GROUND_Y + 25);
        ctx.lineTo(adjustedX + 10, GROUND_Y + 25);
        ctx.stroke();
      }
    }
  }

  // --- Draw player ---
  function drawPlayer() {
    const px = player.x;
    const py = player.y;

    // Running animation: bob up and down
    const bob = player.onGround ? Math.sin(player.frame * 0.3) * 3 : 0;
    const drawY = py - player.h + bob;

    // Shadow on ground
    ctx.fillStyle = 'rgba(255, 45, 149, 0.15)';
    ctx.beginPath();
    ctx.ellipse(px + player.w / 2, GROUND_Y + 2, player.w * 0.6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (silhouette style)
    ctx.save();

    // Glow
    ctx.shadowColor = '#ff2d95';
    ctx.shadowBlur = 15;

    // Body
    ctx.fillStyle = '#ff2d95';
    const bodyX = px + 8;
    const bodyW = 24;
    const bodyH = 28;
    const bodyY = drawY + 10;
    roundRect(bodyX, bodyY, bodyW, bodyH, 5);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(px + player.w / 2, drawY + 6, 10, 0, Math.PI * 2);
    ctx.fill();

    // Arms - pump animation
    const armSwing = Math.sin(player.frame * 0.3) * 12;
    ctx.strokeStyle = '#ff2d95';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Left arm
    ctx.beginPath();
    ctx.moveTo(bodyX, bodyY + 6);
    ctx.lineTo(bodyX - 8, bodyY + 14 + armSwing);
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW, bodyY + 6);
    ctx.lineTo(bodyX + bodyW + 8, bodyY + 14 - armSwing);
    ctx.stroke();

    // Legs
    const legSwing = Math.sin(player.frame * 0.3) * 10;
    ctx.beginPath();
    ctx.moveTo(bodyX + 6, bodyY + bodyH);
    ctx.lineTo(bodyX + 2, bodyY + bodyH + 14 + legSwing);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bodyX + bodyW - 6, bodyY + bodyH);
    ctx.lineTo(bodyX + bodyW - 2, bodyY + bodyH + 14 - legSwing);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Flexing arm muscle emoji
    ctx.font = '16px serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('💪', px + player.w - 2, drawY + 4);

    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // --- Draw obstacle ---
  function drawObstacle(obs) {
    ctx.save();

    if (obs.type === 'dumbbell') {
      // Dumbbell: center bar + two weight plates
      const cx = obs.x + obs.w / 2;
      const cy = obs.y + obs.h / 2;

      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 10;

      // Bar
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, cy);
      ctx.lineTo(obs.x + obs.w - 4, cy);
      ctx.stroke();

      // Left plate
      ctx.fillStyle = '#00ffff';
      roundRect(obs.x, obs.y + 4, 10, obs.h - 8, 2);
      ctx.fill();

      // Right plate
      roundRect(obs.x + obs.w - 10, obs.y + 4, 10, obs.h - 8, 2);
      ctx.fill();

      // Emoji
      ctx.shadowBlur = 0;
      ctx.font = `${Math.min(obs.h - 4, 24)}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🏋️', cx, cy + 6);
    } else {
      // Barbell: long bar with plates on ends
      const cy = obs.y + obs.h / 2;

      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;

      // Bar
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(obs.x, cy);
      ctx.lineTo(obs.x + obs.w, cy);
      ctx.stroke();

      // Plates
      ctx.fillStyle = '#00ffff';
      roundRect(obs.x, obs.y, 8, obs.h, 2);
      ctx.fill();
      roundRect(obs.x + 8, obs.y + 3, 6, obs.h - 6, 2);
      ctx.fill();
      roundRect(obs.x + obs.w - 8, obs.y, 8, obs.h, 2);
      ctx.fill();
      roundRect(obs.x + obs.w - 14, obs.y + 3, 6, obs.h - 6, 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Draw collectible ---
  function drawCollectible(col) {
    const bobY = Math.sin(col.bobPhase + frameCount * 0.05) * 5;
    const cx = col.x + col.w / 2;
    const cy = col.y + col.h / 2 + bobY;

    ctx.save();

    if (col.type === 'protein') {
      ctx.shadowColor = '#ff2d95';
      ctx.shadowBlur = 12;
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🥤', cx, cy + 8);
    } else {
      ctx.shadowColor = '#ffdd00';
      ctx.shadowBlur = 15;
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.fillText('⭐', cx, cy + 8);
    }

    ctx.restore();
  }

  // --- Draw particles ---
  function drawParticles() {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color.replace('1)', `${alpha})`);
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  // --- Collision detection ---
  function boxCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function getPlayerBox() {
    // Slightly smaller hitbox for fairness
    return {
      x: player.x + 10,
      y: player.y - player.h + 8,
      w: player.w - 16,
      h: player.h - 10,
    };
  }

  // --- Update game ---
  function update() {
    if (state !== 'playing') return;

    frameCount++;

    // Speed increase over time
    speed = 5 + frameCount * 0.002;
    if (speed > 16) speed = 16;

    // Distance
    distance += speed * 0.1;

    // Player physics
    if (!player.onGround) {
      // Hold jump for higher
      if (jumpHeld && holdFrames < MAX_HOLD_FRAMES) {
        player.vy += HOLD_FORCE;
        holdFrames++;
      }
      player.vy += GRAVITY;
      player.y += player.vy;

      if (player.y >= GROUND_Y) {
        player.y = GROUND_Y;
        player.vy = 0;
        player.onGround = true;
        holdFrames = 0;
      }
    }

    player.frame++;

    // Parallax
    bgOffset1 += speed * 0.3;
    bgOffset2 += speed * 0.6;
    bgOffset3 += speed;

    // Background image cycling
    bgImgTimer++;
    const imgCycleTotal = BG_IMG_FADE_IN + BG_IMG_HOLD + BG_IMG_FADE_OUT;
    const timeSinceStart = bgImgTimer % BG_IMG_INTERVAL;

    if (timeSinceStart === 0 && imagesLoaded > 0) {
      bgImgIndex = (bgImgIndex + 1) % bgImages.length;
      currentBgImg = bgImages[bgImgIndex];
    }

    if (currentBgImg) {
      const phase = bgImgTimer % BG_IMG_INTERVAL;
      if (phase < BG_IMG_FADE_IN) {
        bgImgAlpha = phase / BG_IMG_FADE_IN;
      } else if (phase < BG_IMG_FADE_IN + BG_IMG_HOLD) {
        bgImgAlpha = 1;
      } else if (phase < imgCycleTotal) {
        bgImgAlpha = 1 - (phase - BG_IMG_FADE_IN - BG_IMG_HOLD) / BG_IMG_FADE_OUT;
      } else {
        bgImgAlpha = 0;
      }
    }

    // Spawn obstacles
    if (frameCount % Math.max(60, Math.floor(120 - frameCount * 0.03)) === 0) {
      spawnObstacle();
    }

    // Spawn collectibles
    if (frameCount % Math.max(80, Math.floor(150 - frameCount * 0.02)) === 0) {
      spawnCollectible();
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speed;
      if (obstacles[i].x + obstacles[i].w < -50) {
        obstacles.splice(i, 1);
      }
    }

    // Move collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
      collectibles[i].x -= speed;
      if (collectibles[i].x + collectibles[i].w < -50) {
        collectibles.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Collision with obstacles
    const pBox = getPlayerBox();
    for (const obs of obstacles) {
      if (boxCollide(pBox, obs)) {
        gameOver();
        return;
      }
    }

    // Collision with collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const col = collectibles[i];
      const colBox = { x: col.x, y: col.y, w: col.w, h: col.h };
      if (boxCollide(pBox, colBox)) {
        if (col.type === 'protein') {
          proteinCount++;
          sfxCollect();
          addParticles(col.x + col.w / 2, col.y + col.h / 2, 'rgba(255,45,149,1)', 8);
        } else {
          starCount++;
          sfxStar();
          addParticles(col.x + col.w / 2, col.y + col.h / 2, 'rgba(255,221,0,1)', 10);
        }
        collectibles.splice(i, 1);
      }
    }

    // Update HUD
    hudDist.textContent = Math.floor(distance);
    hudProtein.textContent = proteinCount;
    hudStars.textContent = starCount;
  }

  // --- Draw frame ---
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    if (state === 'playing' || state === 'gameover') {
      for (const obs of obstacles) drawObstacle(obs);
      for (const col of collectibles) drawCollectible(col);
      drawPlayer();
      drawParticles();
    }

    if (state === 'title') {
      // Animated title bg
      drawBackground();
    }
  }

  // --- Game loop ---
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // --- Start game ---
  function startGame() {
    initAudio();
    resetGame();
    state = 'playing';
    titleScreen.classList.add('hidden');
    gameoverScreen.classList.remove('show');
    hudEl.style.display = 'flex';
  }

  // --- Game over ---
  function gameOver() {
    state = 'gameover';
    sfxCrash();
    addParticles(player.x + player.w / 2, player.y - player.h / 2, 'rgba(255,45,149,1)', 20);
    addParticles(player.x + player.w / 2, player.y - player.h / 2, 'rgba(0,255,255,1)', 15);

    const dist = Math.floor(distance);
    const isNewBest = dist > bestDistance;
    if (isNewBest) {
      bestDistance = dist;
      localStorage.setItem('muscleRunnerBest', String(dist));
    }

    resDist.textContent = dist;
    resProtein.textContent = proteinCount;
    resStars.textContent = starCount;
    resBest.style.display = isNewBest ? 'inline' : 'none';

    setTimeout(() => {
      gameoverScreen.classList.add('show');
    }, 500);
  }

  // --- Jump ---
  function doJump() {
    if (state === 'playing' && player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      holdFrames = 0;
      jumpHeld = true;
      sfxJump();
    }
  }

  function releaseJump() {
    jumpHeld = false;
  }

  // --- Share ---
  function shareToX() {
    const dist = Math.floor(distance);
    const text = `【筋肉ランナー】${dist}m走破！💪 プロテイン${proteinCount}個 ⭐${starCount}個ゲット！\n#MuscleLove #筋肉ランナー`;
    const url = 'https://www.patreon.com/cw/MuscleLove';
    const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  }

  // --- Event listeners ---
  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (state === 'title') {
        startGame();
      } else if (state === 'gameover') {
        startGame();
      } else {
        doJump();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      releaseJump();
    }
  });

  // Touch / Click
  canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (state === 'playing') doJump();
  });

  canvas.addEventListener('mouseup', () => releaseJump());

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (state === 'playing') doJump();
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    releaseJump();
  }, { passive: false });

  // Buttons
  btnStart.addEventListener('click', startGame);
  btnRetry.addEventListener('click', startGame);
  btnShare.addEventListener('click', shareToX);

  // --- Init ---
  resetGame();
  loop();
})();
