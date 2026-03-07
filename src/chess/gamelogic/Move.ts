import { Cell } from "./Cell";
import { MoveType } from "./enums";

export class Move {
  playerNumber: number;
  source: Cell;
  target: Cell;
  type: MoveType;

  constructor();
  constructor(source: Cell, target: Cell);
  constructor(source: Cell, target: Cell, playerNumber: number);
  constructor(source: Cell, target: Cell, playerNumber: number, type: MoveType);
  constructor(
    source?: Cell,
    target?: Cell,
    playerNumber?: number,
    type?: MoveType,
  ) {
    this.source = source ?? new Cell(0, 0);
    this.target = target ?? new Cell(0, 0);
    this.playerNumber = playerNumber ?? 0;
    this.type = type ?? MoveType.REGULAR;
  }

  get targetColumn(): number {
    return this.target.column;
  }
}
