import { circleRectCollision } from './collision.js';
import { createPipe } from './pipe.js';
import { playBeep, playFlap } from './audio.js';
import { setupFullscreen } from './fullscreen.js';
import { setupInput } from './input.js';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const fullscreenBtn = document.getElementById("fullscreenBtn");

let gameState = "start";
let countdownStartTime = 0;
let lastSecond = null;

let birdX = 100;
let birdY = 0;
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
const pipePadding = 10;
const pipeVerticalPadding = 5;

let birdImg = new Image();
let pipeImg = new Image();

let imagesLoaded = 0;
let canFlap = false;
let loopRunning = false;
let restartAvailable = true;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  birdY = canvas.height / 2;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

birdImg.onload = tryStart;
pipeImg.onload = tryStart;
birdImg.onerror = () => console.error("Failed to load bird.png");
pipeImg.onerror = () => console.error("Failed to load pipe.png");

birdImg.src = "assets/bird.png";
pipeImg.src = "assets/pipe.png";

function tryStart() {
  imagesLoaded++;
  if (imagesLoaded === 2) {
    resetGame();
    drawStartScreen();
  }
}

function resetGame() {
  birdY = canvas.height / 2;
  velocity = 0;
  pipes = [];
  score = 0;
  pipeSpeed = 2;
  lastSpeedIncreaseTime = Date.now();
  loopRunning = false;
  gameState = "start";
  canFlap = false;
  restartAvailable = true;
  pipes.push(createPipe(canvas.width + 50, canvas.height));
}

function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBird();
  ctx.fillStyle = "black";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Press SPACE or Tap to Start", canvas.width / 2, canvas.height / 2 + 60);
}

function drawBird() {
  if (birdImg.complete && birdImg.naturalWidth !== 0) {
    ctx.drawImage(birdImg, birdX, birdY, 50, 50);
  } else {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(birdX + 25, birdY + 25, birdRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPipes() {
  const gap = 180;
  pipes.forEach(pipe => {
    if (pipeImg.complete && pipeImg.naturalWidth !== 0) {
      ctx.save();
      ctx.translate(pipe.x + 25, pipe.height);
      ctx.scale(1, -1);
      ctx.drawImage(pipeImg, -25, 0, 50, pipe.height);
      ctx.restore();
      ctx.drawImage(pipeImg, pipe.x, pipe.height + gap, 50, canvas.height - pipe.height - gap);
    } else {
      ctx.fillStyle = "green";
      ctx.fillRect(pipe.x, 0, 50, pipe.height);
      ctx.fillRect(pipe.x, pipe.height + gap, 50, canvas.height - pipe.height - gap);
    }
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

function updateGame() {
  if (gameState !== "playing") return;

  velocity += gravity;
  birdY += velocity;

  if (birdY < 0) birdY = 0;
  if (birdY + 50 > canvas.height) {
    endGame();
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
      endGame();
    }

    if (!pipe.passed && pipe.x + 50 < birdX) {
      score++;
      pipe.passed = true;
    }
  });

  pipes = pipes.filter(pipe => pipe.x + 50 > 0);

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 400) {
    pipes.push(createPipe(canvas.width + 50, canvas.height));
  }

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
}

function endGame() {
  gameState = "gameover";
  canFlap = false;
  restartAvailable = false;
  setTimeout(() => (restartAvailable = true), 500);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPipes();
  drawBird();
  drawScore();
  if (gameState === "gameover") {
    drawGameOver();
  }
}

function gameLoop() {
  if (!loopRunning) return;
  updateGame();
  draw();
  requestAnimationFrame(gameLoop);
}

function flap() {
  if (canFlap) {
    velocity = -10;
    playFlap(); // 🔊 flap sound
  } else if (gameState === "start") {
    startCountdown();
  } else if (gameState === "gameover" && restartAvailable) {
    resetGame();
    startCountdown();
  }
}

function startCountdown() {
  gameState = "countdown";
  countdownStartTime = Date.now();
  lastSecond = null;
  countdownLoop();
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
    if (secondsLeft > 0) playBeep();
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
    loopRunning = true;
    gameLoop();
    return;
  }

  requestAnimationFrame(countdownLoop);
}

setupFullscreen(canvas, fullscreenBtn, (isFullscreen) => {
  resizeCanvas();
  velocity = 0;
  pipeSpeed = 2;
  lastSpeedIncreaseTime = Date.now();

  if (gameState === "start") drawStartScreen();
  else if (gameState === "gameover") {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBird();
    drawPipes();
    drawScore();
    drawGameOver();
  } else if (gameState === "playing") {
    if (!loopRunning) {
      loopRunning = true;
      requestAnimationFrame(gameLoop);
    }
  }

  fullscreenBtn.innerText = isFullscreen ? "❎" : "🔳";
});

setupInput(flap, () =>
  document.fullscreenElement
    ? document.exitFullscreen()
    : canvas.requestFullscreen()
);
