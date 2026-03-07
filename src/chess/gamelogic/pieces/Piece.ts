import { ChessException } from "../../exceptions";
import { Cell } from "../Cell";
import { Move } from "../Move";
import { MoveType } from "../enums";
import { Tile } from "../Tile";
import {
  AbstractPieceState,
  PieceStateIdle,
  PieceStateMove,
  PieceStateMoveVisualOnly,
} from "./PieceState";
import { Direction, PieceName, PieceStateName } from "./types";
import type { Gameboard } from "../Gameboard";

/**
 * This class represents a piece in the gameboard.
 * The piece knows the player number who owns this piece.
 * The piece also knows its owner tile.
 */
export abstract class Piece {
  private stateCurrent: AbstractPieceState = new PieceStateIdle(this);
  ownerTile: Tile | undefined;
  private _ownerPlayer = 0; // Should always be 1 or 2
  private _target: Cell | undefined;
  private _isSelected = false;
  private _hasMoved = false;

  constructor(ownerPlayer?: number) {
    if (ownerPlayer !== undefined) {
      this.ownerPlayer = ownerPlayer;
    }
  }

  abstract clone(): Piece;
  abstract get name(): PieceName;
  abstract get fightingValue(): number;
  protected abstract findPossibleRegularMoves(): Move[];
  protected abstract findPossibleAttackMoves(): Move[];
  protected abstract findPossibleSpecialMoves(): Move[];

  private get ownerGameboard(): Gameboard {
    return this.ownerTile!.ownerGameboard!;
  }

  private filterMovesThatWouldLeaveKingInCheck(moves: Move[]): Move[] {
    return moves.filter((move) => {
      const gameboardClone = this.ownerGameboard.clone();
      gameboardClone.movePieceImmediately(move);
      try {
        return !gameboardClone.findKing(this.ownerPlayerNumber).isInCheck();
      } catch {
        return true; // King not found, allow move
      }
    });
  }

  get position(): Cell {
    return this.ownerTile!.position;
  }

  get row(): number {
    return this.position.row;
  }

  get column(): number {
    return this.position.column;
  }

  get targetRow(): number | undefined {
    return this._target?.row;
  }

  get targetColumn(): number | undefined {
    return this._target?.column;
  }

  get movementProgress(): number {
    return this.stateCurrent.getMovementProgress();
  }

  die(): void {
    this.ownerTile!.ownerGameboard!.removePiece(this);
  }

  changeState(newState: AbstractPieceState): void {
    if (newState.getStateName() === PieceStateName.IDLE) {
      this._target = undefined;
    }
    this.stateCurrent = newState;
  }

  moveAnimated(target: Cell, moveType: MoveType = MoveType.REGULAR): void {
    if (this.stateCurrent.getStateName() === PieceStateName.IDLE) {
      this.changeState(
        new PieceStateMove(this, this.ownerTile!.position, target, moveType),
      );
      this._target = target;
    }
  }

  /**
   * Starts a purely visual animation toward `target` without modifying the
   * board state on completion. Used for the rook during castling so that both
   * the king and rook animate simultaneously while board state is handled by
   * the king's movePieceImmediately call.
   */
  moveAnimatedVisualOnly(target: Cell): void {
    if (this.stateCurrent.getStateName() === PieceStateName.IDLE) {
      this.changeState(
        new PieceStateMoveVisualOnly(this, this.ownerTile!.position, target),
      );
      this._target = target;
    }
  }

  /**
   * Returns the row of the cell where the current animation started.
   * Falls back to the piece's actual tile row when not animating.
   * Use this (instead of row) as the interpolation start in renderers.
   */
  getAnimationSourceRow(): number {
    return this.stateCurrent.getAnimationSource()?.row ?? this.row;
  }

  /**
   * Returns the column of the cell where the current animation started.
   * Falls back to the piece's actual tile column when not animating.
   */
  getAnimationSourceColumn(): number {
    return this.stateCurrent.getAnimationSource()?.column ?? this.column;
  }

  updateState(timeDelta: number): void {
    this.stateCurrent.updateState(timeDelta);
  }

  get stateName(): PieceStateName {
    return this.stateCurrent.getStateName();
  }

  get ownerPlayerNumber(): number {
    return this._ownerPlayer;
  }

  set ownerPlayer(playerOwner: number) {
    if (playerOwner !== 1 && playerOwner !== 2) {
      throw new ChessException("Piece's owner player number should be 1 or 2!");
    }
    this._ownerPlayer = playerOwner;
  }

  get isSelected(): boolean {
    return this._isSelected;
  }

  set isSelected(value: boolean) {
    this._isSelected = value;
  }

  get hasMoved(): boolean {
    return this._hasMoved;
  }

  set hasMoved(value: boolean) {
    this._hasMoved = value;
  }

  /**
   * This piece can kill another piece if this piece can move to a cell where an opponent piece is.
   */
  findPiecesThatCanBeKilledByThisPiece(includeCheck: boolean): Piece[] {
    return this.findPossibleMoves(includeCheck)
      .map((move) =>
        this.ownerTile!.ownerGameboard!.getTileAtPosition(
          move.target.row,
          move.target.column,
        )?.piece,
      )
      .filter(
        (p): p is Piece =>
          p !== undefined && p.ownerPlayerNumber !== this.ownerPlayerNumber,
      );
  }

  findPiecesThatCanKillThisPiece(includeCheck: boolean): Piece[] {
    return this.ownerTile!.ownerGameboard!
      .findPiecesOwnedByPlayer(this.findOpponentPlayerNumber())
      .filter((enemy) =>
        enemy.findPiecesThatCanBeKilledByThisPiece(includeCheck).includes(this),
      );
  }

  findProtectors(): Piece[] {
    const originalOwner = this._ownerPlayer;
    // Temporarily flip ownership so findPiecesThatCanKillThisPiece finds
    // "attackers" who are really the same-side protectors.
    this._ownerPlayer = this.findOpponentPlayerNumber();
    try {
      return this.findPiecesThatCanKillThisPiece(false);
    } finally {
      this._ownerPlayer = originalOwner;
    }
  }

  protected findOpponentPlayerNumber(): number {
    return this.ownerPlayerNumber === 1 ? 2 : 1;
  }

  findPossibleMoves(includeCheck: boolean): Move[] {
    const moves: Move[] = [
      ...this.findPossibleRegularMoves(),
      ...this.findPossibleAttackMoves(),
      ...this.findPossibleSpecialMoves(),
    ];
    return includeCheck
      ? this.filterMovesThatWouldLeaveKingInCheck(moves)
      : moves;
  }

  protected nextCellFromSource(direction: Direction, i: number): Cell {
    switch (direction) {
      case Direction.DOWN_LEFT:
        return new Cell(this.row + i, this.column - i);
      case Direction.DOWN_RIGHT:
        return new Cell(this.row + i, this.column + i);
      case Direction.UP_LEFT:
        return new Cell(this.row - i, this.column - i);
      case Direction.UP_RIGHT:
        return new Cell(this.row - i, this.column + i);
      case Direction.LEFT:
        return new Cell(this.row, this.column - i);
      case Direction.UP:
        return new Cell(this.row - i, this.column);
      case Direction.RIGHT:
        return new Cell(this.row, this.column + i);
      case Direction.DOWN:
        return new Cell(this.row + i, this.column);
    }
  }

  /**
   * Generates regular (non-capturing) moves for a sliding piece along the
   * given directions. Each direction continues until the board edge or an
   * occupied tile is hit.
   */
  protected findSlidingRegularMoves(directions: Direction[]): Move[] {
    const gb = this.ownerTile!.ownerGameboard!;
    const source = new Cell(this.row, this.column);
    const moves: Move[] = [];

    for (const direction of directions) {
      for (let i = 1; i <= 7; i++) {
        const target = this.nextCellFromSource(direction, i);
        const tile = gb.getTileAtPosition(target.row, target.column);
        if (tile === undefined) break;
        if (tile.hasPiece()) break;
        moves.push(new Move(source, target));
      }
    }

    return moves;
  }

  /**
   * Generates attack (capturing) moves for a sliding piece along the given
   * directions. Stops at the first occupied tile; adds a move only when the
   * occupant belongs to the opponent.
   */
  protected findSlidingAttackMoves(directions: Direction[]): Move[] {
    const gb = this.ownerTile!.ownerGameboard!;
    const source = new Cell(this.row, this.column);
    const moves: Move[] = [];

    for (const direction of directions) {
      for (let i = 1; i <= 7; i++) {
        const target = this.nextCellFromSource(direction, i);
        const tile = gb.getTileAtPosition(target.row, target.column);
        if (tile === undefined) break;

        const piece = tile.piece;
        if (piece !== undefined) {
          if (piece.ownerPlayerNumber !== this.ownerPlayerNumber) {
            moves.push(new Move(source, target));
          }
          break;
        }
      }
    }

    return moves;
  }
}
