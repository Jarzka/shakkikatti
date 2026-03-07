import { Move } from "../Move";
import { Piece } from "./Piece";
import { Direction, PieceName } from "./types";

const ALL_DIRECTIONS = [
  Direction.UP,
  Direction.RIGHT,
  Direction.DOWN,
  Direction.LEFT,
  Direction.DOWN_LEFT,
  Direction.DOWN_RIGHT,
  Direction.UP_LEFT,
  Direction.UP_RIGHT,
] as const;

export class Queen extends Piece {
  constructor(ownerPlayer: number) {
    super(ownerPlayer);
  }

  clone(): Queen {
    const copy = new Queen(this.ownerPlayerNumber);
    copy.hasMoved = this.hasMoved;
    return copy;
  }

  get name(): PieceName {
    return PieceName.QUEEN;
  }

  get fightingValue(): number {
    return 9;
  }

  protected findPossibleRegularMoves(): Move[] {
    return this.findSlidingRegularMoves([...ALL_DIRECTIONS]);
  }

  protected findPossibleAttackMoves(): Move[] {
    return this.findSlidingAttackMoves([...ALL_DIRECTIONS]);
  }

  protected findPossibleSpecialMoves(): Move[] {
    return [];
  }
}
