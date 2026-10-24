# Birthday Card

An interactive, mobile-friendly birthday card webpage with virtual candles and a reveal animation. Built with vanilla HTML, CSS, and JavaScript.

## How It Works

1. Open `index.html` in any web browser.
2. Tap, click, or swipe across the candles to extinguish them.
3. Once all candles are out, the personalized card is revealed with a confetti animation and fanfare.

## Personalization

All settings and text are configured in `config.js`:

```javascript
window.BIRTHDAY_CONFIG = {
  recipientName: "Name",
  cardHeader: "Happy Birthday",
  message: "Your personalized message here.",
  signature: "Your signature",
  candleCount: 5,
  soundEffects: true
};
