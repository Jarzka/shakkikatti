import { ChessException } from "../../exceptions";
import { Cell } from "../Cell";
import { MoveType } from "../enums";
import { Gameboard } from "../Gameboard";
import { Move } from "../Move";
import { Piece } from "../pieces/Piece";
import { PieceStateIdle } from "../pieces/PieceState";
import { PieceStateName } from "../pieces/types";
import { AbstractPlayerState, PlayerStateIdle } from "./PlayerState";
import { PlayerStateName } from "./PlayerStateName";

/**
 * The player is moving a piece (animated).
 */
export class PlayerStateMoving extends AbstractPlayerState {
  private pieceMoving: Piece;

  constructor(owner: AbstractPlayer, pieceMoving: Piece) {
    super(owner);
    this.pieceMoving = pieceMoving;
  }

  updateState(): void {
    if (this.pieceMoving.stateName === PieceStateName.MOVED) {
      this.ownerPlayer.changeState(
        new PlayerStateFinal(this.ownerPlayer, this.pieceMoving),
      );
      this.pieceMoving.changeState(new PieceStateIdle(this.pieceMoving));
    }
  }

  get stateName(): PlayerStateName {
    return PlayerStateName.MOVING;
  }
}

/**
 * The player has just moved a piece.
 */
export class PlayerStateFinal extends AbstractPlayerState {
  constructor(owner: AbstractPlayer, _pieceMoved: Piece) {
    super(owner);
  }

  updateState(): void {
    // Do nothing
  }

  get stateName(): PlayerStateName {
    return PlayerStateName.FINAL;
  }
}

/**
 * Abstract base for all players.
 */
export abstract class AbstractPlayer {
  private _number: number;
  private _gameboard: Gameboard;
  private stateCurrent: AbstractPlayerState;
  /** Last N move records used to detect repetition. */
  private moveHistory: { source: Cell; target: Cell }[] = [];

  constructor(playerNumber: number, gameboard: Gameboard) {
    this._number = this.validateNumber(playerNumber);
    this._gameboard = gameboard;
    this.stateCurrent = new PlayerStateIdle(this);
  }

  get number(): number {
    return this._number;
  }

  private validateNumber(num: number): number {
    if (num !== 1 && num !== 2) {
      throw new ChessException("Player number should be 1 or 2");
    }
    return num;
  }

  get gameboard(): Gameboard {
    return this._gameboard;
  }

  setGameboard(gameboard: Gameboard): void {
    this._gameboard = gameboard;
  }

  static findOpponentForPlayer(playerNumber: number): number {
    return playerNumber === 1 ? 2 : 1;
  }

  get stateName(): PlayerStateName {
    return this.stateCurrent.stateName;
  }

  changeState(state: AbstractPlayerState): void {
    this.stateCurrent = state;
  }

  updateState(): void {
    this.stateCurrent.updateState();
  }

  /**
   * Returns the last `count` move records in a plain serializable form.
   */
  getRecentMoveHistory(
    count: number,
  ): Array<{
    sourceRow: number;
    sourceColumn: number;
    targetRow: number;
    targetColumn: number;
  }> {
    return this.moveHistory.slice(-count).map((m) => ({
      sourceRow: m.source.row,
      sourceColumn: m.source.column,
      targetRow: m.target.row,
      targetColumn: m.target.column,
    }));
  }

  /**
   * Records a move into the player's personal history.
   * Only the source and target cells are stored (not piece type).
   */
  recordMove(source: Cell, target: Cell): void {
    this.moveHistory.push({ source: source.clone(), target: target.clone() });
  }

  /**
   * Returns true if the given source→target move has already been made
   * 2 or more times within the player's last 4 turns, making a 3rd attempt banned.
   */
  isMoveRepeatBanned(source: Cell, target: Cell): boolean {
    const recentMoves = this.moveHistory.slice(-4);
    const count = recentMoves.filter(
      (m) =>
        m.source.hasSameRowAndColumn(source) &&
        m.target.hasSameRowAndColumn(target),
    ).length;
    return count >= 2;
  }

  isLastMoveThreefoldRepetition(): boolean {
    if (this.moveHistory.length === 0) return false;
    const last = this.moveHistory[this.moveHistory.length - 1];
    const count = this.moveHistory.filter(
      (m) =>
        m.source.hasSameRowAndColumn(last.source) &&
        m.target.hasSameRowAndColumn(last.target),
    ).length;
    return count >= 3;
  }

  performMove(piece: Piece, move: Move): void {
    this.recordMove(move.source, move.target);
    piece.isSelected = false;
    piece.moveAnimated(move.target, move.type);
    this.changeState(new PlayerStateMoving(this, piece));

    // For castling, also start the rook's visual animation in parallel so
    // both pieces slide to their destinations at the same time.
    // The rook's board position is handled by movePieceImmediately when
    // the king's animation completes; this is purely visual.
    if (move.type === MoveType.SPECIAL_CASTLING) {
      const row = move.target.row;
      const isKingSide = move.target.column > move.source.column;
      const rookSourceColumn = isKingSide ? 8 : 1;
      const rookTargetColumn = isKingSide
        ? move.target.column - 1
        : move.target.column + 1;
      const rookTile = this._gameboard.getTileAtPosition(row, rookSourceColumn);
      if (rookTile?.piece !== undefined) {
        rookTile.piece.moveAnimatedVisualOnly(
          new Cell(row, rookTargetColumn),
        );
      }
    }
  }

  abstract changeStateToPlay(): void;
  abstract isHuman(): boolean;
}
