import { Move } from "../Move";
import { Piece } from "./Piece";
import { Direction, PieceName } from "./types";

const DIAGONAL_DIRECTIONS = [
  Direction.DOWN_LEFT,
  Direction.DOWN_RIGHT,
  Direction.UP_LEFT,
  Direction.UP_RIGHT,
] as const;

export class Bishop extends Piece {
  constructor(ownerPlayer: number) {
    super(ownerPlayer);
  }

  clone(): Bishop {
    const copy = new Bishop(this.ownerPlayerNumber);
    copy.hasMoved = this.hasMoved;
    return copy;
  }

  get name(): PieceName {
    return PieceName.BISHOP;
  }

  get fightingValue(): number {
    return 3;
  }

  protected findPossibleRegularMoves(): Move[] {
    return this.findSlidingRegularMoves([...DIAGONAL_DIRECTIONS]);
  }

  protected findPossibleAttackMoves(): Move[] {
    return this.findSlidingAttackMoves([...DIAGONAL_DIRECTIONS]);
  }

  protected findPossibleSpecialMoves(): Move[] {
    return [];
  }
}
