import { Cell } from "../Cell";
import { GamePhase, MoveType } from "../enums";
import { Move } from "../Move";
import { Piece } from "./Piece";
import { Direction, PieceName } from "./types";

export class King extends Piece {
  constructor(ownerPlayer: number) {
    super(ownerPlayer);
  }

  clone(): King {
    const copy = new King(this.ownerPlayerNumber);
    copy.hasMoved = this.hasMoved;
    return copy;
  }

  get name(): PieceName {
    return PieceName.KING;
  }

  get fightingValue(): number {
    if (
      this.ownerTile!.ownerGameboard!.getCurrentGamePhase() ===
      GamePhase.ENDGAME
    ) {
      return 4;
    }
    return 0;
  }

  protected findPossibleRegularMoves(): Move[] {
    const moves: Move[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const target = new Cell(this.row + dr, this.column + dc);
        const tile = this.ownerTile!.ownerGameboard!.getTileAtPosition(
          target.row,
          target.column,
        );
        if (tile === undefined || tile.hasPiece()) continue;
        moves.push(new Move(new Cell(this.row, this.column), target));
      }
    }

    return moves;
  }

  protected findPossibleAttackMoves(): Move[] {
    const moves: Move[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const target = new Cell(this.row + dr, this.column + dc);
        const tile = this.ownerTile!.ownerGameboard!.getTileAtPosition(
          target.row,
          target.column,
        );
        if (tile === undefined) continue;

        const piece = tile.piece;
        if (piece !== undefined && piece.ownerPlayerNumber !== this.ownerPlayerNumber) {
          moves.push(new Move(new Cell(this.row, this.column), target));
        }
      }
    }

    return moves;
  }

  protected findPossibleSpecialMoves(): Move[] {
    const moves: Move[] = [];

    // Cannot castle if the king has already moved or is currently in check.
    if (this.hasMoved || this.isInCheck()) {
      return moves;
    }

    const gb = this.ownerTile!.ownerGameboard!;
    const kingCell = new Cell(this.row, this.column);
    const playerNumber = this.ownerPlayerNumber;

    // Find all rooks owned by this player that haven't yet moved.
    const rooks = gb
      .findPiecesByTypeAndOwnerPlayer(PieceName.ROOK, playerNumber)
      .filter((rook) => !rook.hasMoved);

    for (const rook of rooks) {
      const rookCell = new Cell(rook.row, rook.column);

      // Rook must share the same row as the king (standard chess setup).
      if (rookCell.row !== kingCell.row) continue;

      // All squares between the king and rook must be empty.
      const piecesBetween = gb.findPiecesBetweenCellsInRow(kingCell, rookCell);
      if (piecesBetween.length > 0) continue;

      // Determine castling direction.
      const isKingSide = rookCell.column > kingCell.column;
      const transitColumn = isKingSide ? kingCell.column + 1 : kingCell.column - 1;
      const targetColumn = isKingSide ? kingCell.column + 2 : kingCell.column - 2;

      // The king must not pass through an attacked square.
      const transitCell = new Cell(kingCell.row, transitColumn);
      const gbClone = gb.clone();
      gbClone.movePieceImmediately(
        new Move(kingCell, transitCell, playerNumber, MoveType.REGULAR),
      );
      const kingOnClone = gbClone.findKing(playerNumber);
      if (kingOnClone.isInCheck()) continue;

      // Add the castling move — king moves two squares toward the rook.
      const targetCell = new Cell(kingCell.row, targetColumn);
      moves.push(
        new Move(kingCell, targetCell, playerNumber, MoveType.SPECIAL_CASTLING),
      );
    }

    return moves;
  }

  /**
   * Checks if the king is in check by examining all attack vectors:
   * diagonals (bishop/queen), straights (rook/queen), pawns, knights, king.
   */
  isInCheck(): boolean {
    return (
      this.checkSlidingAttack(
        [Direction.DOWN_LEFT, Direction.DOWN_RIGHT, Direction.UP_LEFT, Direction.UP_RIGHT],
        [PieceName.QUEEN, PieceName.BISHOP],
      ) ||
      this.checkSlidingAttack(
        [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT],
        [PieceName.QUEEN, PieceName.ROOK],
      ) ||
      this.checkPawnAttack() ||
      this.checkKnightAttack() ||
      this.checkKingAttack()
    );
  }

  /**
   * Returns true if any enemy sliding piece matching `pieceNames` attacks this
   * king along one of the given `directions`.
   */
  private checkSlidingAttack(directions: Direction[], pieceNames: PieceName[]): boolean {
    const gb = this.ownerTile!.ownerGameboard!;
    for (const direction of directions) {
      for (let i = 1; i <= 7; i++) {
        const target = this.nextCellFromSource(direction, i);
        const tile = gb.getTileAtPosition(target.row, target.column);
        if (tile === undefined) break;
        if (!tile.hasPiece()) continue;

        const piece = tile.piece!;
        if (piece.ownerPlayerNumber === this.ownerPlayerNumber) break;
        if (pieceNames.includes(piece.name)) return true;
        break; // Blocked by a non-threatening piece
      }
    }
    return false;
  }

  private checkPawnAttack(): boolean {
    // Pawns attack diagonally forward: white attacks upward (row−1), black downward (row+1).
    const dir = this.ownerPlayerNumber === 1 ? -1 : 1;
    const gb = this.ownerTile!.ownerGameboard!;
    for (const dc of [-1, 1]) {
      const piece = gb.getTileAtPosition(this.row + dir, this.column + dc)?.piece;
      if (
        piece !== undefined &&
        piece.ownerPlayerNumber !== this.ownerPlayerNumber &&
        piece.name === PieceName.PAWN
      ) {
        return true;
      }
    }
    return false;
  }

  private checkKnightAttack(): boolean {
    const KNIGHT_OFFSETS: [number, number][] = [
      [-2, -1], [-1, -2], [-1, 2], [-2, 1],
      [2, 1], [1, 2], [1, -2], [2, -1],
    ];
    return KNIGHT_OFFSETS.some(([dr, dc]) => this.isEnemyKnightAt(dr, dc));
  }

  private isEnemyKnightAt(dr: number, dc: number): boolean {
    const adjTile = this.ownerTile!.getAdjacentTile(dr, dc);
    if (adjTile === undefined || !adjTile.hasPiece()) return false;
    const piece = adjTile.piece!;
    return (
      piece.name === PieceName.KNIGHT &&
      piece.ownerPlayerNumber !== this.ownerPlayerNumber
    );
  }

  private checkKingAttack(): boolean {
    const gb = this.ownerTile!.ownerGameboard!;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const tile = gb.getTileAtPosition(this.row + dr, this.column + dc);
        if (tile === undefined || !tile.hasPiece()) continue;
        const piece = tile.piece!;
        if (
          piece.name === PieceName.KING &&
          piece.ownerPlayerNumber !== this.ownerPlayerNumber
        ) {
          return true;
        }
      }
    }
    return false;
  }

  isInCheckMate(): boolean {
    if (!this.isInCheck()) return false;

    const gb = this.ownerTile!.ownerGameboard!;
    for (const piece of gb.findPiecesOwnedByPlayer(this.ownerPlayerNumber)) {
      if (piece.findPossibleMoves(true).length > 0) {
        return false;
      }
    }

    return true;
  }
}
