import { Cell } from "../Cell";
import { Move } from "../Move";
import { Piece } from "./Piece";
import { PieceName } from "./types";

const KNIGHT_OFFSETS: [number, number][] = [
  [-2, -1], [-1, -2], [-1, 2], [-2, 1],
  [2, 1], [1, 2], [1, -2], [2, -1],
];

export class Knight extends Piece {
  constructor(ownerPlayer: number) {
    super(ownerPlayer);
  }

  clone(): Knight {
    const copy = new Knight(this.ownerPlayerNumber);
    copy.hasMoved = this.hasMoved;
    return copy;
  }

  get name(): PieceName {
    return PieceName.KNIGHT;
  }

  get fightingValue(): number {
    return 3;
  }

  protected findPossibleRegularMoves(): Move[] {
    return KNIGHT_OFFSETS.flatMap(([dr, dc]) => this.findRegularMove(dr, dc));
  }

  protected findPossibleAttackMoves(): Move[] {
    return KNIGHT_OFFSETS.flatMap(([dr, dc]) => this.findAttackMove(dr, dc));
  }

  protected findPossibleSpecialMoves(): Move[] {
    return [];
  }

  private findRegularMove(rowOffset: number, colOffset: number): Move[] {
    const adjTile = this.ownerTile!.getAdjacentTile(rowOffset, colOffset);
    if (adjTile === undefined || adjTile.hasPiece()) return [];
    return [
      new Move(
        new Cell(this.ownerTile!.position),
        new Cell(
          this.ownerTile!.position.row + rowOffset,
          this.ownerTile!.position.column + colOffset,
        ),
      ),
    ];
  }

  private findAttackMove(rowOffset: number, colOffset: number): Move[] {
    const adjTile = this.ownerTile!.getAdjacentTile(rowOffset, colOffset);
    if (adjTile === undefined || !adjTile.hasPiece()) return [];
    if (adjTile.piece!.ownerPlayerNumber === this.ownerPlayerNumber) return [];
    return [
      new Move(
        new Cell(this.ownerTile!.position),
        new Cell(
          this.ownerTile!.position.row + rowOffset,
          this.ownerTile!.position.column + colOffset,
        ),
      ),
    ];
  }
}
