export function createPipe(xPos, canvasHeight) {
  const pipeGap = 180;
  const minPipeHeight = 50;
  const maxPipeHeight = canvasHeight - pipeGap - minPipeHeight;
  const pipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight)) + minPipeHeight;

  return {
    x: xPos,
    height: pipeHeight,
    passed: false,
  };
}
