import { MouseButtonState, Point } from "./types";

export class Mouse {
  private _leftButtonState = MouseButtonState.RELEASED;
  private _rightButtonState = MouseButtonState.RELEASED;
  private _position: Point = { x: 0, y: 0 };
  private _leftClickTimestamp = 0;
  private _rightClickTimestamp = 0;

  get leftButtonState(): MouseButtonState {
    return this._leftButtonState;
  }

  get rightButtonState(): MouseButtonState {
    return this._rightButtonState;
  }

  get x(): number {
    return this._position.x;
  }

  get y(): number {
    return this._position.y;
  }

  /** Returns true if the left button was recently pressed (within 50ms). */
  clickedLeftButton(): boolean {
    return performance.now() - this._leftClickTimestamp < 50;
  }

  /** Returns true if the right button was recently pressed (within 50ms). */
  clickedRightButton(): boolean {
    return performance.now() - this._rightClickTimestamp < 50;
  }

  attachToCanvas(canvas: HTMLCanvasElement): void {
    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        this._leftButtonState = MouseButtonState.PRESSED;
        this._leftClickTimestamp = performance.now();
      } else if (e.button === 2) {
        this._rightButtonState = MouseButtonState.PRESSED;
        this._rightClickTimestamp = performance.now();
      }
    });

    canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        this._leftButtonState = MouseButtonState.RELEASED;
      } else if (e.button === 2) {
        this._rightButtonState = MouseButtonState.RELEASED;
      }
    });

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      this._position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    });

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }
}
