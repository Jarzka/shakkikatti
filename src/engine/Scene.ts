export abstract class Scene {
  abstract update(timeDelta: number): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract getName(): string;
}
