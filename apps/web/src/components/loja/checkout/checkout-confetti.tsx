'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function CheckoutConfetti() {
  useEffect(() => {
    confetti({
      particleCount: 180,
      spread: 70,
      origin: { y: 0.75 },
      scalar: 0.9,
    });
  }, []);

  return null;
}
