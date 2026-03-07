export class Sprite {
  readonly image: HTMLImageElement;
  readonly width: number;
  readonly height: number;

  constructor(image: HTMLImageElement) {
    this.image = image;
    this.width = image.width;
    this.height = image.height;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width?: number,
    height?: number,
  ): void {
    if (width !== undefined && height !== undefined) {
      ctx.drawImage(this.image, x, y, width, height);
    } else {
      ctx.drawImage(this.image, x, y);
    }
  }
}

export async function loadSprite(url: string): Promise<Sprite> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(new Sprite(image));
    image.onerror = () => reject(new Error(`Failed to load sprite: ${url}`));
    image.src = url;
  });
}
