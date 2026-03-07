export class TurnManager {
  private _current = 1;

  get current(): number {
    return this._current;
  }

  nextTurn(): void {
    this._current = this._current === 1 ? 2 : 1;
  }

  /** Sets the current turn number to 1. */
  reset(): void {
    this._current = 1;
  }

  /** Sets the current turn to a specific player number (used when loading a FEN position). */
  setTurn(player: number): void {
    this._current = player;
  }
}
