export function setupInput(onFlap, onToggleFullscreen) {
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      onFlap();
    }
  });

  // Touch support: tap anywhere on canvas to flap
  document.getElementById("gameCanvas").addEventListener("touchstart", (e) => {
    e.preventDefault();
    onFlap();
  }, { passive: false });

  // Optional: toggle fullscreen on double tap
  /*
  let lastTap = 0;
  document.getElementById("gameCanvas").addEventListener("touchend", (e) => {
    const currentTime = Date.now();
    if (currentTime - lastTap < 300) {
      onToggleFullscreen();
    }
    lastTap = currentTime;
  });
  */
}
