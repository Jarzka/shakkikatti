import { Move } from "../../Move";

/**
 * Selects which AI search algorithm the worker should run.
 *
 * BEST_RESPONSE — Original best-response tree expansion from 2014
 * ALPHA_SONNE  — Full-blown alpha-beta pruning with heuristics and optimizations
 */
export enum AIAlgorithm {
  BEST_RESPONSE = "best_response",
  ALPHA_SONNE = "alpha_sonne",
}

/**
 * Serializable types for communication between main thread and AI web worker.
 */
export interface AIWorkerRequest {
  type: "findBestMove";
  /** Serialized gameboard tiles with piece info */
  gameboardData: SerializedGameboard;
  playerNumber: number;
  turnNumber: number;
  /**
   * The player's last N moves (source/target cells) used to enforce the
   * move-repetition rule inside the search tree.
   */
  moveHistoryData: Array<{
    sourceRow: number;
    sourceColumn: number;
    targetRow: number;
    targetColumn: number;
  }>;
  /** Which search algorithm to use. Defaults to BEST_RESPONSE if omitted. */
  algorithm?: AIAlgorithm;
}

export interface AIWorkerResponse {
  type: "bestMoveFound";
  move: SerializedMove | undefined;
}

export interface SerializedMove {
  sourceRow: number;
  sourceColumn: number;
  targetRow: number;
  targetColumn: number;
  playerNumber: number;
  type: string;
}

export interface SerializedPiece {
  name: string;
  ownerPlayer: number;
  hasMoved: boolean;
}

export interface SerializedTile {
  row: number;
  column: number;
  piece: SerializedPiece | undefined;
}

export interface SerializedGameboard {
  tiles: SerializedTile[];
  countPerformedMoves: number;
  lastMove: SerializedMove | undefined;
}

export function serializeMove(move: Move): SerializedMove {
  return {
    sourceRow: move.source.row,
    sourceColumn: move.source.column,
    targetRow: move.target.row,
    targetColumn: move.target.column,
    playerNumber: move.playerNumber,
    type: move.type,
  };
}
