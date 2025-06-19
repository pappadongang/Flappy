export function setupFullscreen(canvas, btn, onChange) {
  btn.addEventListener("click", toggleFullscreen);

  document.addEventListener("fullscreenchange", () => {
    onChange(!!document.fullscreenElement);
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyF") {
      toggleFullscreen();
    } else if (e.code === "Escape" && document.fullscreenElement) {
      document.exitFullscreen();
    }
  });

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }
}
