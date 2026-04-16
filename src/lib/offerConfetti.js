import confetti from 'canvas-confetti';

/** Short burst when an application reaches “Offer”. Respects reduced-motion. */
export function celebrateOffer() {
  confetti({
    particleCount: 68,
    spread: 58,
    startVelocity: 28,
    decay: 0.9,
    gravity: 1.05,
    ticks: 140,
    origin: { y: 0.58 },
    scalar: 0.95,
    zIndex: 4000,
    disableForReducedMotion: true,
    colors: ['#6366f1', '#22c55e', '#fbbf24', '#c7d2fe', '#ecfdf5'],
  });
}
