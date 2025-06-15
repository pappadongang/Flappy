const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas to fullscreen size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let gameState = "start";
let countdown = 3;
let countdownStartTime = 0;
let lastSecond = null;

let birdX = 100;
let birdY = canvas.height / 2;
let velocity = 0;
const gravity = 0.8;

let pipes = [];
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

let pipeSpeed = 2;
const speedIncreaseInterval = 5000;
let lastSpeedIncreaseTime = 0;
const maxPipeSpeed = 6;

const birdRadius = 20;
const pipePadding = 10;         // Horizontal hitbox shrink
const pipeVerticalPadding = 5;  // Vertical hitbox shrink

const birdImg = new Image();
const pipeImg = new Image();
birdImg.src = "bird.png";
pipeImg.src = "pipe.png";

const beepSound = new Audio("countdown-beep.mp3");

const fullscreenBtn = document.getElementById("fullscreenBtn");
fullscreenBtn.addEventListener("click", toggleFullscreen);

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    canvas.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener("fullscreenchange", () => {
  resizeCanvas();

  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "gameover") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBird();
    drawPipes();
    drawScore();
    drawGameOver();
  } else if (gameState === "playing") {
    requestAnimationFrame(gameLoop);
  }

  fullscreenBtn.innerText = document.fullscreenElement ? "❎" : "🔳";
});

let deathTime = 0;
let canFlap = false;

document.addEventListener("keydown", (e) => {
  const now = Date.now();

  if (e.code === "Space") {
    if (gameState === "start") {
      gameState = "countdown";
      countdown = 3;
      lastSecond = null;
      countdownStartTime = now;
      countdownLoop();
      canFlap = false;
    } else if (gameState === "gameover") {
      if (now - deathTime >= 500) {
        resetGame();
        gameState = "start";
        drawStartScreen();
        canFlap = false;
      }
    } else if (gameState === "playing") {
      if (canFlap) velocity = -10;
    }
  } else if (e.code === "KeyF") {
    toggleFullscreen();
  } else if (e.code === "Escape") {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }
});

birdImg.onload = pipeImg.onload = () => {
  resetGame();
  drawStartScreen();
};

function resetGame() {
  birdY = canvas.height / 2;
  velocity = 0;
  pipes = [];
  score = 0;
  pipeSpeed = 2;
  lastSpeedIncreaseTime = Date.now();

  pipes.push(createPipe(canvas.width + 50));
  canFlap = false;
}

function createPipe(xPos) {
  const pipeGap = 180;
  const minPipeHeight = 50;
  const maxPipeHeight = canvas.height - pipeGap - minPipeHeight;
  const pipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight)) + minPipeHeight;

  return {
    x: xPos,
    height: pipeHeight,
    passed: false,
  };
}

function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(birdImg, birdX, birdY, 50, 50);
  ctx.fillStyle = "black";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press SPACE to Start", canvas.width / 2, canvas.height / 2 + 60);
}

function countdownLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBird();
  drawPipes();
  drawScore();

  const elapsed = Date.now() - countdownStartTime;
  const secondsLeft = 3 - Math.floor(elapsed / 1000);
  const fade = 1 - (elapsed % 1000) / 1000;

  if (secondsLeft !== lastSecond) {
    if (secondsLeft > 0) beepSound.play().catch(() => {});
    lastSecond = secondsLeft;
  }

  ctx.save();
  if (secondsLeft > 0) {
    ctx.globalAlpha = fade;
    ctx.fillStyle = "black";
    ctx.font = "72px Arial";
    ctx.textAlign = "center";
    ctx.fillText(secondsLeft, canvas.width / 2, canvas.height / 2);
  } else {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "green";
    ctx.font = "72px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Go!", canvas.width / 2, canvas.height / 2);
  }
  ctx.restore();

  if (elapsed >= 4000) {
    gameState = "playing";
    canFlap = true;
    gameLoop();
    return;
  }

  requestAnimationFrame(countdownLoop);
}

function drawBird() {
  ctx.drawImage(birdImg, birdX, birdY, 50, 50);
}

function drawPipes() {
  const gap = 180;
  pipes.forEach(pipe => {
    ctx.save();
    ctx.translate(pipe.x + 25, pipe.height);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, -25, 0, 50, pipe.height);
    ctx.restore();

    ctx.drawImage(pipeImg, pipe.x, pipe.height + gap, 50, canvas.height - pipe.height - gap);
  });
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("High Score: " + highScore, 20, 70);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 30);
  ctx.fillText("High Score: " + highScore, canvas.width / 2, canvas.height / 2 + 60);
  ctx.fillText("Press SPACE to Restart", canvas.width / 2, canvas.height / 2 + 100);
}

function circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx * dx + dy * dy) < (radius * radius);
}

function updateGame() {
  if (gameState !== "playing") return;

  velocity += gravity;
  birdY += velocity;

  if (birdY < 0) birdY = 0;
  if (birdY + 50 > canvas.height) {
    gameState = "gameover";
    deathTime = Date.now();
    canFlap = false;
  }

  const birdCenterX = birdX + 25;
  const birdCenterY = birdY + 25;

  if (Date.now() - lastSpeedIncreaseTime > speedIncreaseInterval && pipeSpeed < maxPipeSpeed) {
    pipeSpeed += 0.3;
    lastSpeedIncreaseTime = Date.now();
  }

  const pipeGap = 180;
  pipes.forEach(pipe => {
    pipe.x -= pipeSpeed;

    const topPipeRect = {
      x: pipe.x + pipePadding,
      y: pipeVerticalPadding,
      width: 50 - 2 * pipePadding,
      height: pipe.height - 2 * pipeVerticalPadding
    };

    const bottomPipeRect = {
      x: pipe.x + pipePadding,
      y: pipe.height + pipeGap + pipeVerticalPadding,
      width: 50 - 2 * pipePadding,
      height: canvas.height - pipe.height - pipeGap - 2 * pipeVerticalPadding
    };

    if (
      circleRectCollision(birdCenterX, birdCenterY, birdRadius, topPipeRect.x, topPipeRect.y, topPipeRect.width, topPipeRect.height) ||
      circleRectCollision(birdCenterX, birdCenterY, birdRadius, bottomPipeRect.x, bottomPipeRect.y, bottomPipeRect.width, bottomPipeRect.height)
    ) {
      gameState = "gameover";
      deathTime = Date.now();
      canFlap = false;
    }

    if (!pipe.passed && pipe.x + 50 < birdX) {
      score++;
      pipe.passed = true;
    }
  });

  pipes = pipes.filter(pipe => pipe.x + 50 > 0);

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 400) {
    pipes.push(createPipe(canvas.width + 50));
  }

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBird();
  drawPipes();
  drawScore();
  updateGame();

  if (gameState === "playing") {
    requestAnimationFrame(gameLoop);
  } else if (gameState === "gameover") {
    drawGameOver();
  }
}
