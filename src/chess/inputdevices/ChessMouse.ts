import { Tile } from "../gamelogic/Tile";

/** Tile size in pixels — set at startup. */
let tileSize = 64;

export function setTileSize(size: number): void {
  tileSize = size;
}

export function getTileSize(): number {
  return tileSize;
}

export class ChessMouse {
  private x = 0;
  private y = 0;
  private leftPressed = false;
  /** Timestamp of last left click (mouse-up). */
  private lastClickTime = 0;
  /** Timestamp of last left press (mouse-down). */
  private lastPressTime = 0;
  /** Timestamp of last right click (mouse-up). */
  private lastRightClickTime = 0;
  private static readonly CLICK_WINDOW_MS = 80;

  attachToCanvas(canvas: HTMLCanvasElement): void {
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this.x = e.clientX - rect.left;
      this.y = e.clientY - rect.top;
    });

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this.leftPressed = true;
        this.lastPressTime = performance.now();
      }
    });

    canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this.leftPressed = false;
        this.lastClickTime = performance.now();
      } else if (e.button === 2) {
        this.lastRightClickTime = performance.now();
      }
    });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Register globally so PlayerStatePlayHuman can find it
    (globalThis as Record<string, unknown>).__chessMouse = this;
  }

  clickedLeftButton(): boolean {
    return this.leftPressed;
  }

  justClicked(): boolean {
    return performance.now() - this.lastClickTime < ChessMouse.CLICK_WINDOW_MS;
  }

  justPressed(): boolean {
    return performance.now() - this.lastPressTime < ChessMouse.CLICK_WINDOW_MS;
  }

  justRightClicked(): boolean {
    return performance.now() - this.lastRightClickTime < ChessMouse.CLICK_WINDOW_MS;
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  isOnTile(tile: Tile): boolean {
    const gb = tile.ownerGameboard!;
    const col0 = gb.positionX + (tile.position.column - 1) * tileSize;
    const row0 = gb.positionY + (tile.position.row - 1) * tileSize;

    return (
      this.x >= col0 &&
      this.x <= col0 + tileSize &&
      this.y >= row0 &&
      this.y <= row0 + tileSize
    );
  }
}
