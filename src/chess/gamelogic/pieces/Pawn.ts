import { Cell } from "../Cell";
import { Move } from "../Move";
import { MoveType } from "../enums";
import { Piece } from "./Piece";
import { PieceName } from "./types";

export class Pawn extends Piece {
  constructor(ownerPlayer: number) {
    super(ownerPlayer);
  }

  clone(): Pawn {
    const copy = new Pawn(this.ownerPlayerNumber);
    copy.hasMoved = this.hasMoved;
    return copy;
  }

  get name(): PieceName {
    return PieceName.PAWN;
  }

  get fightingValue(): number {
    return 1;
  }

  /** Forward direction: white moves toward row 1 (−1), black toward row 8 (+1). */
  private get forwardDir(): number {
    return this.ownerPlayerNumber === 1 ? -1 : 1;
  }

  /** Starting row for a double-step move. */
  private get startingRow(): number {
    return this.ownerPlayerNumber === 1 ? 7 : 2;
  }

  protected findPossibleRegularMoves(): Move[] {
    return [
      ...this.findSingleStep(),
      ...this.findDoubleStep(),
    ];
  }

  protected findPossibleAttackMoves(): Move[] {
    return [
      ...this.findDiagonalAttack(-1),
      ...this.findDiagonalAttack(1),
    ];
  }

  protected findPossibleSpecialMoves(): Move[] {
    return this.findEnPassantMoves();
  }

  private findSingleStep(): Move[] {
    const nextTile = this.ownerTile!.getAdjacentTile(this.forwardDir, 0);
    if (nextTile === undefined || nextTile.hasPiece()) return [];
    return [
      new Move(
        new Cell(this.ownerTile!.position),
        new Cell(this.row + this.forwardDir, this.column),
      ),
    ];
  }

  private findDoubleStep(): Move[] {
    if (this.row !== this.startingRow) return [];

    const nextTile = this.ownerTile!.getAdjacentTile(this.forwardDir, 0);
    if (nextTile === undefined || nextTile.hasPiece()) return [];

    const nextNextTile = nextTile.getAdjacentTile(this.forwardDir, 0);
    if (nextNextTile === undefined || nextNextTile.hasPiece()) return [];

    return [
      new Move(
        new Cell(this.ownerTile!.position),
        new Cell(this.row + 2 * this.forwardDir, this.column),
      ),
    ];
  }

  private findDiagonalAttack(colDir: number): Move[] {
    const adjTile = this.ownerTile!.getAdjacentTile(this.forwardDir, colDir);
    if (adjTile === undefined || !adjTile.hasPiece()) return [];
    if (adjTile.piece!.ownerPlayerNumber === this.ownerPlayerNumber) return [];
    return [
      new Move(
        new Cell(this.ownerTile!.position),
        new Cell(this.row + this.forwardDir, this.column + colDir),
      ),
    ];
  }

  /**
   * En passant: this pawn must be on the correct rank and the opponent's
   * pawn must have just double-stepped to an adjacent column.
   */
  private findEnPassantMoves(): Move[] {
    // White must be on row 4; black on row 5.
    const enPassantRow = this.ownerPlayerNumber === 1 ? 4 : 5;
    if (this.row !== enPassantRow) return [];

    const opponentFromRow = this.ownerPlayerNumber === 1 ? 2 : 7;
    const opponentToRow = this.ownerPlayerNumber === 1 ? 4 : 5;

    const gameboard = this.ownerTile!.ownerGameboard!;
    const lastMove = gameboard.lastMove;
    if (lastMove === undefined) return [];

    const isDoubleStep =
      lastMove.source.row === opponentFromRow &&
      lastMove.target.row === opponentToRow;
    if (!isDoubleStep) return [];

    if (Math.abs(lastMove.target.column - this.column) !== 1) return [];

    // Confirm the piece that moved is an opponent pawn.
    const capturedPawnTile = gameboard.getTileAtPosition(
      opponentToRow,
      lastMove.target.column,
    );
    const capturedPiece = capturedPawnTile?.piece;
    if (
      capturedPiece === undefined ||
      capturedPiece.name !== PieceName.PAWN ||
      capturedPiece.ownerPlayerNumber === this.ownerPlayerNumber
    ) {
      return [];
    }

    return [
      new Move(
        new Cell(this.row, this.column),
        new Cell(this.row + this.forwardDir, lastMove.target.column),
        this.ownerPlayerNumber,
        MoveType.SPECIAL_EN_PASSANT,
      ),
    ];
  }

  /** Promotes the pawn to a Queen. */
  promote(): void {
    this.ownerTile!.ownerGameboard!.changePieceType(this, PieceName.QUEEN);
  }
}
