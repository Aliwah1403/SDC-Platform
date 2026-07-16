export const pressSpring = { type: "spring", damping: 20, stiffness: 300 }; // press feedback
export const enterTiming = { type: "timing", duration: 220 };               // standard entrance
export const exitTiming = { type: "timing", duration: 150 };                // exits ~0.7x enter
export const celebrationSpring = { type: "spring", damping: 14, stiffness: 120 }; // rare moments
export const STAGGER_MS = 40;   // per-item stagger, cap total cascade at 300 ms
