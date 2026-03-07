import { Cell } from "../../Cell";
import { Move } from "../../Move";
import { MoveType } from "../../enums";
import { AbstractPlayer } from "../AbstractPlayer";
import { PlayerStatePlay } from "../PlayerState";
import type { AIWorkerResponse } from "./aiTypes";
import { AIAlgorithm } from "./aiTypes";
import { serializeGameboard } from "./gameboardSerializer";

/**
 * AI player's play state — dispatches work to a Web Worker and polls for the result.
 */
export class PlayerStatePlayAI extends PlayerStatePlay {
  private worker: Worker | undefined;
  private aiMove: Move | undefined;
  private readonly algorithm: AIAlgorithm;

  constructor(owner: AbstractPlayer, algorithm: AIAlgorithm = AIAlgorithm.BEST_RESPONSE) {
    super(owner);
    this.algorithm = algorithm;
  }

  updateState(): void {
    this.findBestMove();
    this.handleLoadingIcon();
  }

  private findBestMove(): void {
    if (this.isAIAnswerFound()) {
      this.performTheBestMove();
    } else if (this.worker === undefined) {
      this.startWorker();
    }
  }

  private handleLoadingIcon(): void {
    // The animation is updated in the scene's render loop, nothing needed here
  }

  private startWorker(): void {
    this.worker = new Worker(new URL("./ai.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (e: MessageEvent<AIWorkerResponse>) => {
      if (e.data.type === "bestMoveFound") {
        if (e.data.move !== undefined) {
          const m = e.data.move;
          this.aiMove = new Move(
            new Cell(m.sourceRow, m.sourceColumn),
            new Cell(m.targetRow, m.targetColumn),
            m.playerNumber,
            (m.type as MoveType) ?? MoveType.REGULAR,
          );
        }
        this.worker?.terminate();
        this.worker = undefined;
      }
    };

    const player = this.ownerPlayer;
    const gb = player.gameboard;
    this.worker.postMessage({
      type: "findBestMove",
      gameboardData: serializeGameboard(gb),
      playerNumber: player.number,
      turnNumber: gb.performedMoves,
      moveHistoryData: player.getRecentMoveHistory(4),
      algorithm: this.algorithm,
    });
  }

  private performTheBestMove(): void {
    if (this.aiMove !== undefined) {
      const player = this.ownerPlayer;
      const piece = player
        .gameboard
        .getTileAtPosition(
          this.aiMove.source.row,
          this.aiMove.source.column,
        )?.piece;
      if (piece !== undefined) {
        player.performMove(piece, this.aiMove);
      }
      this.aiMove = undefined;
    }
  }

  isAIAnswerFound(): boolean {
    return this.aiMove !== undefined;
  }
}
