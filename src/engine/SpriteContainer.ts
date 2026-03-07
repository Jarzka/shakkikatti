import { Sprite, loadSprite } from "./Sprite";

export class SpriteContainer {
  private sprites = new Map<string, Sprite>();

  getSprite(name: string): Sprite {
    const sprite = this.sprites.get(name);
    if (sprite === undefined) {
      const loaded = Array.from(this.sprites.keys()).join(", ");
      throw new Error(`Sprite "${name}" not found! Loaded sprites: ${loaded}`);
    }
    return sprite;
  }

  hasSprite(name: string): boolean {
    return this.sprites.has(name);
  }

  async loadSprite(name: string, url: string): Promise<Sprite> {
    const sprite = await loadSprite(url);
    this.sprites.set(name, sprite);
    return sprite;
  }

  async loadAllGameboardSprites(): Promise<void> {
    const pieceNames = ["pawn", "rook", "knight", "bishop", "queen", "king"];
    const colors = ["white", "black"];
    const promises: Promise<Sprite>[] = [];

    for (const piece of pieceNames) {
      for (const color of colors) {
        const name = `${piece}_${color}`;
        promises.push(this.loadSprite(name, `assets/gameboard/${name}.png`));
      }
    }

    promises.push(
      this.loadSprite("tile_white", "assets/gameboard/tile_white.png"),
    );
    promises.push(
      this.loadSprite("tile_black", "assets/gameboard/tile_black.png"),
    );
    promises.push(
      this.loadSprite("selected_cell", "assets/gameboard/selected_cell.png"),
    );
    promises.push(
      this.loadSprite("selected_pawn", "assets/gameboard/selected_pawn.png"),
    );
    promises.push(
      this.loadSprite("cross", "assets/gameboard/cross.png"),
    );

    await Promise.all(promises);
  }

}
