import { Move } from "../Move";
import { Piece } from "./Piece";
import { Direction, PieceName } from "./types";

const STRAIGHT_DIRECTIONS = [
  Direction.UP,
  Direction.RIGHT,
  Direction.DOWN,
  Direction.LEFT,
] as const;

export class Rook extends Piece {
  constructor(ownerPlayer: number) {
    super(ownerPlayer);
  }

  clone(): Rook {
    const copy = new Rook(this.ownerPlayerNumber);
    copy.hasMoved = this.hasMoved;
    return copy;
  }

  get name(): PieceName {
    return PieceName.ROOK;
  }

  get fightingValue(): number {
    return 5;
  }

  protected findPossibleRegularMoves(): Move[] {
    return this.findSlidingRegularMoves([...STRAIGHT_DIRECTIONS]);
  }

  protected findPossibleAttackMoves(): Move[] {
    return this.findSlidingAttackMoves([...STRAIGHT_DIRECTIONS]);
  }

  protected findPossibleSpecialMoves(): Move[] {
    return [];
  }
}
