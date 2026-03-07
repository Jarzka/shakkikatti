/**
 * AI Web Worker — runs the AI tree search off the main thread.
 */
import type {
  AIWorkerRequest,
  AIWorkerResponse,
  SerializedMove,
} from "./aiTypes";
import { AIAlgorithm } from "./aiTypes";
import { deserializeGameboard } from "./gameboardSerializer";
import { runAI } from "./AILogicBestResponse";

const AI_TIME_LIMIT_MS = 2000;

self.onmessage = (e: MessageEvent<AIWorkerRequest>) => {
  const { gameboardData, playerNumber, turnNumber, moveHistoryData, algorithm } = e.data;

  // Reconstruct gameboard from serialized data
  const gameboard = deserializeGameboard(gameboardData);

  // Run AI (synchronous, blocking in the worker — that's fine)
  const bestMove = runAI(
    gameboard,
    playerNumber,
    turnNumber,
    AI_TIME_LIMIT_MS,
    moveHistoryData ?? [],
    algorithm ?? AIAlgorithm.BEST_RESPONSE,
  );

  let moveData: SerializedMove | undefined;
  if (bestMove !== undefined) {
    moveData = {
      sourceRow: bestMove.source.row,
      sourceColumn: bestMove.source.column,
      targetRow: bestMove.target.row,
      targetColumn: bestMove.target.column,
      playerNumber,
      type: bestMove.type,
    };
  }

  const response: AIWorkerResponse = {
    type: "bestMoveFound",
    move: moveData,
  };

  self.postMessage(response);
};
