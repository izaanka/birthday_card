

(function () {
  'use strict';

  // Fallback defaults only used if config.js is missing
  const customConfig = (typeof window !== 'undefined' && window.BIRTHDAY_CONFIG) 
    ? window.BIRTHDAY_CONFIG 
    : (typeof BIRTHDAY_CONFIG !== 'undefined' ? BIRTHDAY_CONFIG : {});

  const config = Object.assign(
    {
      recipientName: "Friend",
      cardHeader: "Happy Birthday",
      message: "Wishing you a wonderful birthday filled with joy and happiness!",
      signature: "With love",
      candleCount: 5,
      soundEffects: true,
      theme: "vanilla-berry"
    },
    customConfig
  );

  // State
  let audioCtx = null;
  let isSoundMuted = !config.soundEffects;
  let isMouseDown = false;
  let remainingCandles = config.candleCount;
  let isTransitioning = false;
  let confettiAnimationId = null;

  // DOM Elements
  const cakeScene = document.getElementById('cakeScene');
  const cardScene = document.getElementById('cardScene');
  const candlesContainer = document.getElementById('candlesContainer');
  const counterText = document.getElementById('counterText');
  const soundToggle = document.getElementById('soundToggle');
  const relightBtn = document.getElementById('relightBtn');
  const confettiCanvas = document.getElementById('confettiCanvas');

  // Card Content Elements
  const cardGreeting = document.getElementById('cardGreeting');
  const cardRecipient = document.getElementById('cardRecipient');
  const cardMessage = document.getElementById('cardMessage');
  const cardSignature = document.getElementById('cardSignature');


  function init() {
    // Inject Config Data into Card
    if (cardGreeting) cardGreeting.textContent = config.cardHeader || "Happy Birthday";
    if (cardRecipient) cardRecipient.textContent = config.recipientName || "Friend";
    if (cardMessage) cardMessage.textContent = config.message || "";
    if (cardSignature) cardSignature.textContent = config.signature || "";

    // Set page title to match recipient
    document.title = `Happy Birthday ${config.recipientName}`;

    // Initialize Audio Toggle state
    updateSoundButtonUI();

    // Render Candles
    renderCandles();

    // Setup Event Listeners
    setupAudioUnlock();
    setupCandleInteractions();
    setupReplayButton();
    setupResizeListener();
  }


  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Synthesize realistic candle blow sound (filtered noise puff)
  function playBlowSound() {
    if (isSoundMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const duration = 0.35;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate pinkish/white noise for breath sound
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.11;
        b2 = 0.85 * b2 + white * 0.25;
        data[i] = (b0 + b1 + b2 + white * 0.1) * 0.4;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to sculpt the puff frequency
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(550, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + duration);
      filter.Q.value = 1.2;

      // Gain envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // Synthesize celebratory chime fanfare on card reveal
  function playFanfareSound() {
    if (isSoundMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Arpeggio notes: C5, E5, G5, C6, E6
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        const startTime = now + idx * 0.12;
        const noteDuration = 1.2;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + noteDuration);
      });
    } catch (e) {
      console.warn('Fanfare audio error:', e);
    }
  }

  function updateSoundButtonUI() {
    if (!soundToggle) return;
    const svgOn = soundToggle.querySelector('.svg-sound-on');
    const svgOff = soundToggle.querySelector('.svg-sound-off');
    const text = soundToggle.querySelector('.sound-text');
    if (isSoundMuted) {
      soundToggle.classList.add('muted');
      if (svgOn) svgOn.classList.add('hidden');
      if (svgOff) svgOff.classList.remove('hidden');
      if (text) text.textContent = 'Sound OFF';
      soundToggle.title = 'Sound is OFF (click to enable)';
    } else {
      soundToggle.classList.remove('muted');
      if (svgOn) svgOn.classList.remove('hidden');
      if (svgOff) svgOff.classList.add('hidden');
      if (text) text.textContent = 'Sound ON';
      soundToggle.title = 'Sound is ON (click to mute)';
    }
  }

  function setupAudioUnlock() {
    // Resume audio on first user gesture
    const unlock = () => {
      getAudioContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });

    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        getAudioContext();
        isSoundMuted = !isSoundMuted;
        updateSoundButtonUI();
      });
    }
  }

  function renderCandles() {
    if (!candlesContainer) return;
    candlesContainer.innerHTML = '';
    const count = Math.max(1, Math.min(10, config.candleCount || 5));
    remainingCandles = count;

    for (let i = 0; i < count; i++) {
      const candle = document.createElement('div');
      candle.className = 'candle';
      candle.dataset.index = i;
      candle.setAttribute('role', 'button');
      candle.setAttribute('aria-label', `Candle ${i + 1}`);

      // Internal Candle Structure
      candle.innerHTML = `
        <div class="candle-flame"></div>
        <div class="candle-wick"></div>
        <div class="candle-stick"></div>
      `;

      candlesContainer.appendChild(candle);
    }

    updateCounterText();
  }

  function updateCounterText() {
    if (!counterText) return;
    if (remainingCandles === 0) {
      counterText.textContent = "All wishes made";
    } else if (remainingCandles === 1) {
      counterText.textContent = "1 candle remaining";
    } else {
      counterText.textContent = `${remainingCandles} candles glowing`;
    }
  }

  function extinguishCandle(candleEl) {
    if (!candleEl || candleEl.classList.contains('is-extinguished')) return;

    candleEl.classList.add('is-extinguished');
    remainingCandles--;

    // Spawn animated smoke wisps
    spawnSmoke(candleEl);

    // Audio effect
    playBlowSound();

    // Update Counter
    updateCounterText();

    // Check if all candles are extinguished
    if (remainingCandles === 0 && !isTransitioning) {
      isTransitioning = true;
      setTimeout(revealBirthdayCard, 650);
    }
  }

  function spawnSmoke(candleEl) {
    const flameEl = candleEl.querySelector('.candle-flame') || candleEl;
    for (let i = 0; i < 3; i++) {
      const smoke = document.createElement('div');
      smoke.className = 'smoke-particle';
      smoke.style.animationDelay = `${i * 120}ms`;
      smoke.style.left = `${45 + (Math.random() * 10)}%`;
      candleEl.appendChild(smoke);

      // Clean up DOM after animation completes
      setTimeout(() => {
        if (smoke.parentNode) smoke.parentNode.removeChild(smoke);
      }, 1600);
    }
  }


  function setupCandleInteractions() {
    const stage = document.getElementById('cakeStage');
    if (!stage) return;

    // Helper: test if coordinate (x, y) overlaps any candle flame/wick
    function testAndExtinguishAtPoint(clientX, clientY) {
      const candles = candlesContainer.querySelectorAll('.candle:not(.is-extinguished)');
      for (const candle of candles) {
        const rect = candle.getBoundingClientRect();
        // Generous hitbox for easy finger swiping on mobile
        const hitMarginX = 14;
        const hitMarginY = 24;

        if (
          clientX >= rect.left - hitMarginX &&
          clientX <= rect.right + hitMarginX &&
          clientY >= rect.top - hitMarginY &&
          clientY <= rect.bottom + hitMarginY
        ) {
          extinguishCandle(candle);
        }
      }
    }

    // Touch Events: Tap and Swipe across candles
    stage.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        testAndExtinguishAtPoint(t.clientX, t.clientY);
      }
    }, { passive: true });

    stage.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        testAndExtinguishAtPoint(t.clientX, t.clientY);
      }
    }, { passive: true });

    // Mouse Events: Click and Drag across candles
    stage.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      testAndExtinguishAtPoint(e.clientX, e.clientY);
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      testAndExtinguishAtPoint(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    // Individual click fallback for keyboards/accessibility
    candlesContainer.addEventListener('click', (e) => {
      const candle = e.target.closest('.candle');
      if (candle) extinguishCandle(candle);
    });
  }


  function revealBirthdayCard() {
    // 1. Fade out Cake Scene
    cakeScene.classList.remove('active');
    cakeScene.classList.add('hidden');

    // 2. Reveal Card Scene
    cardScene.classList.remove('hidden');
    cardScene.removeAttribute('aria-hidden');
    // Force layout reflow for animation trigger
    void cardScene.offsetWidth;
    cardScene.classList.add('active');

    // 3. Play sound effects
    playFanfareSound();

    // 4. Launch Confetti Cannon
    startConfettiCelebration();
  }

  function setupReplayButton() {
    if (!relightBtn) return;
    relightBtn.addEventListener('click', () => {
      // Stop Confetti
      stopConfettiCelebration();

      // Reset Scene
      cardScene.classList.remove('active');
      cardScene.classList.add('hidden');
      cardScene.setAttribute('aria-hidden', 'true');

      cakeScene.classList.remove('hidden');
      void cakeScene.offsetWidth;
      cakeScene.classList.add('active');

      // Re-light candles
      isTransitioning = false;
      renderCandles();
    });
  }


  const CONFETTI_COLORS = [
    '#ffd700', '#f48fb1', '#dfa84a', '#ff9aa2',
    '#b5ead7', '#c7ceea', '#ffffff', '#ff6b6b'
  ];

  let particles = [];

  function setupResizeListener() {
    function resizeCanvas() {
      if (!confettiCanvas) return;
      confettiCanvas.width = window.innerWidth * window.devicePixelRatio;
      confettiCanvas.height = window.innerHeight * window.devicePixelRatio;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  function startConfettiCelebration() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth * dpr;
    const height = window.innerHeight * dpr;

    confettiCanvas.width = width;
    confettiCanvas.height = height;

    particles = [];
    const count = Math.min(120, Math.floor(window.innerWidth / 4));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: -20 * dpr - Math.random() * height * 0.4,
        size: (Math.random() * 8 + 6) * dpr,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        velX: (Math.random() - 0.5) * 4 * dpr,
        velY: (Math.random() * 4 + 3) * dpr,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
        isCircle: Math.random() > 0.6
      });
    }

    let startTime = performance.now();
    const duration = 7500; // 7.5 seconds of joyful flutter

    function loop(currentTime) {
      const elapsed = currentTime - startTime;
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.velX;
        p.y += p.velY;
        p.rot += p.rotSpeed;

        // Gentle sinusoidal sway
        p.x += Math.sin(p.y / 30) * 1.5;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;

        // Fade out toward end
        if (elapsed > duration * 0.65) {
          ctx.globalAlpha = Math.max(0, 1 - (elapsed - duration * 0.65) / (duration * 0.35));
        }

        if (p.isCircle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);
        }
        ctx.restore();
      });

      if (elapsed < duration) {
        confettiAnimationId = requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = requestAnimationFrame(loop);
  }

  function stopConfettiCelebration() {
    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
    }
    if (confettiCanvas) {
      const ctx = confettiCanvas.getContext('2d');
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // Expose helper for testing / previewing
  window.birthdayCardApp = {
    revealCard: revealBirthdayCard,
    extinguishAll: () => {
      document.querySelectorAll('.candle:not(.is-extinguished)').forEach(extinguishCandle);
    }
  };

  // Kickoff on DOM Ready
  function start() {
    init();
    if (window.location.hash === '#preview' || window.location.search.includes('preview=card')) {
      revealBirthdayCard();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
