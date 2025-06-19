const beepSound = new Audio("assets/countdown-beep.mp3");
const flapSound = new Audio("assets/flap.mp3");

export function playBeep() {
  beepSound.play().catch(() => {});
}

export function playFlap() {
  flapSound.currentTime = 0; // rewind to allow rapid flaps
  flapSound.play().catch(() => {});
}
