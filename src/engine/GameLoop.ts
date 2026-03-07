import { Scene } from "./Scene";

export class GameLoop {
  private scene: Scene | undefined;
  private ctx: CanvasRenderingContext2D;
  private lastTimestamp = 0;
  private running = false;
  private frameCount = 0;
  private fpsTimestamp = 0;
  fps = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  setScene(scene: Scene): void {
    this.scene = scene;
  }

  start(): void {
    this.running = true;
    this.lastTimestamp = performance.now();
    this.fpsTimestamp = performance.now();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  stop(): void {
    this.running = false;
  }

  private loop(timestamp: number): void {
    if (!this.running) return;

    const timeDelta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    if (this.scene) {
      this.scene.update(timeDelta);

      this.ctx.fillStyle = "black";
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

      this.scene.render(this.ctx);
    }

    // FPS counting
    this.frameCount++;
    if (timestamp - this.fpsTimestamp >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimestamp = timestamp;
    }

    requestAnimationFrame((ts) => this.loop(ts));
  }
}
