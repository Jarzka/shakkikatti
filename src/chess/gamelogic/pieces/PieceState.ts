import { PieceStateName } from "./types";
import type { Piece } from "./Piece";
import type { Cell } from "../Cell";
import { Move } from "../Move";
import { MoveType } from "../enums";

// ── Abstract piece state ──

export abstract class AbstractPieceState {
  protected ownerPiece: Piece;

  constructor(owner: Piece) {
    this.ownerPiece = owner;
  }

  abstract updateState(timeDelta: number): void;
  abstract getStateName(): PieceStateName;

  getMovementProgress(): number {
    return 0;
  }

  getAnimationSource(): Cell | undefined {
    return undefined;
  }
}

// ── Idle state ──

export class PieceStateIdle extends AbstractPieceState {
  constructor(owner: Piece) {
    super(owner);
  }

  updateState(_timeDelta: number): void {
    // Do nothing
  }

  getStateName(): PieceStateName {
    return PieceStateName.IDLE;
  }
}

// ── Move state (animated movement) ──

export class PieceStateMove extends AbstractPieceState {
  private moveProgressPercentage = 0;
  readonly source: Cell;
  readonly target: Cell;
  private readonly moveType: MoveType;
  private speed = 0.2;

  constructor(owner: Piece, source: Cell, target: Cell, moveType: MoveType = MoveType.REGULAR) {
    super(owner);
    this.source = source;
    this.target = target;
    this.moveType = moveType;
  }

  getAnimationSource(): Cell {
    return this.source;
  }

  updateState(timeDelta: number): void {
    this.move(timeDelta);
    this.checkTargetCellReached();
  }

  private move(timeDelta: number): void {
    this.moveProgressPercentage += this.speed * timeDelta;
  }

  private checkTargetCellReached(): void {
    if (this.moveProgressPercentage >= 100) {
      this.ownerPiece.changeState(new PieceStateFinal(this.ownerPiece));
      this.ownerPiece.ownerTile!.ownerGameboard!.movePieceImmediately(
        new Move(this.source, this.target, 0, this.moveType),
      );
    }
  }

  getStateName(): PieceStateName {
    return PieceStateName.MOVING;
  }

  getMovementProgress(): number {
    return this.moveProgressPercentage;
  }
}

// ── Visual-only move state (animates piece without touching board state) ──
// Used for the rook during castling so both king and rook animate simultaneously.
// Board state is already updated by the king's movePieceImmediately call.

export class PieceStateMoveVisualOnly extends AbstractPieceState {
  private moveProgressPercentage = 0;
  readonly source: Cell;
  readonly target: Cell;
  private speed = 0.2;

  constructor(owner: Piece, source: Cell, target: Cell) {
    super(owner);
    this.source = source;
    this.target = target;
  }

  /** Returns the cell where this animation started (independent of ownerTile). */
  getAnimationSource(): Cell {
    return this.source;
  }

  updateState(timeDelta: number): void {
    this.moveProgressPercentage += this.speed * timeDelta;
    if (this.moveProgressPercentage >= 100) {
      // Transition back to idle — board is already in the correct state.
      this.ownerPiece.changeState(new PieceStateIdle(this.ownerPiece));
    }
  }

  getStateName(): PieceStateName {
    return PieceStateName.MOVING;
  }

  getMovementProgress(): number {
    return this.moveProgressPercentage;
  }
}

// ── Final state (piece reached its target) ──

export class PieceStateFinal extends AbstractPieceState {
  constructor(owner: Piece) {
    super(owner);
  }

  updateState(_timeDelta: number): void {
    // Do nothing
  }

  getStateName(): PieceStateName {
    return PieceStateName.MOVED;
  }
}
