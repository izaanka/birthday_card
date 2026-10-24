# 🎂 Elegant Interactive Birthday Card

A modern, responsive, and mobile-friendly interactive birthday card webpage built with **pure CSS art, SVG, and vanilla JavaScript**. No AI-generated images or bulky external dependencies required!

---

## ✨ Features

- **Scene 1: Interactive Birthday Cake**
  - Elegant two-tiered CSS-art cake on a porcelain & gold stand with frosting and sprinkles.
  - Realistic candles with dynamic flickering flames and glowing ambient reflections.
  - **Touch & Mouse friendly**: Tap, click, or swipe your finger across multiple flames to blow them out in one natural sweep!
  - Animated rising smoke plumes and glowing embers as each candle is extinguished.
  - Live status indicator badge tracking the candles.
- **Scene 2: Elegant Birthday Card**
  - Smooth 3D card unfold and reveal once all candles are blown out.
  - Shimmering gold calligraphy, metallic corner flourishes (SVG), and customized greeting.
  - Built-in physics confetti celebration that cascades and flutters dynamically.
  - **"Make Another Wish"** replay button to re-light the candles and experience the moment again.
- **Synthesized Audio (Web Audio API)**
  - Gentle breath/puff sound when extinguishing candles.
  - Celestial chime fanfare when the card unfolds.
  - Unobtrusive sound toggle (🔊 / 🔇) at the top-right corner.
  - 100% self-contained — no broken audio URLs, CORS blocks, or missing files.

---

## 🛠️ Personalization

All customizable text and settings are neatly organized in [`config.js`](file:///home/izaan/Documents/bday/config.js):

```javascript
const BIRTHDAY_CONFIG = {
  // 1. Recipient Name
  recipientName: "Ayesha",

  // 2. Greeting Headline
  cardHeader: "Happy Birthday",

  // 3. Personalized Message (Line breaks \n are preserved)
  message:
    "Wishing you a day filled with boundless joy, warm laughter, and all the sweet moments you deserve.\n\nMay this coming year bring you closer to every dream your heart holds!",

  // 4. Closing Signature
  signature: "With love & heartfelt wishes,\nAlways ❤️",

  // 5. Number of candles (recommended: 3 to 7)
  candleCount: 5,

  // 6. Sound Effects (true / false)
  soundEffects: true
};
```

---

## 🚀 How to Run & Preview

1. **Directly in your browser**:
   Double-click [`index.html`](file:///home/izaan/Documents/bday/index.html) or open it with any web browser (Chrome, Safari, Firefox, Edge).

2. **Using a local web server (optional)**:
   ```bash
   python3 -m http.server 8080
   ```
   Then open `http://localhost:8080` in your browser.

3. **Instant Card Preview**:
   Add `#preview` to the URL (e.g. `index.html#preview`) to directly view the revealed card without blowing out the candles.
