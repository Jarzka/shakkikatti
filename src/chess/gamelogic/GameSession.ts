import { ChessException } from "../exceptions";
import { GameSessionStateName } from "./enums";
import { Gameboard } from "./Gameboard";
import { King } from "./pieces/King";
import { PieceName } from "./pieces/types";
import { AbstractPlayer } from "./players/AbstractPlayer";
import { PlayerStateIdle } from "./players/PlayerState";
import { PlayerStateName } from "./players/PlayerStateName";
import { TurnManager } from "./TurnManager";

export interface SceneContext {
  timeDelta: number;
}

// --- GameSession State base ---

export abstract class GameSessionState {
  protected ownerGameSession: GameSession;

  constructor(ownerGameSession: GameSession) {
    this.ownerGameSession = ownerGameSession;
  }

  abstract updateState(): void;
  abstract get stateName(): GameSessionStateName;
}

// --- Play state ---

export class GameSessionStatePlay extends GameSessionState {
  constructor(ownerGameSession: GameSession) {
    super(ownerGameSession);
  }

  updateState(): void {
    this.updatePlayers();
    this.updatePieces();
    const turnAdvanced = this.updateTurn();
    if (turnAdvanced) {
      this.checkEnd();
    }
  }

  private checkEnd(): void {
    if (this.ownerGameSession.stateName !== GameSessionStateName.GAME_OVER) {
      this.updateHalfMoveClock();
      this.checkDraw();
    }
    if (this.ownerGameSession.stateName !== GameSessionStateName.GAME_OVER) {
      this.checkCheckMate();
      this.checkStalemate();
    }
  }

  private updateHalfMoveClock(): void {
    const gb = this.ownerGameSession.gameboard;
    this.ownerGameSession.updateHalfMoveClock(
      gb.lastMoveWasCapture,
      gb.lastMovedPieceName === PieceName.PAWN,
    );
  }

  private checkDraw(): void {
    // 75-move rule: 150 half-moves without a pawn move or capture
    if (this.ownerGameSession.halfMoveClock >= 150) {
      this.ownerGameSession.changeState(
        new GameSessionStateGameOver(this.ownerGameSession),
      );
      this.ownerGameSession.setDrawReason("seventy-five-move");
      return;
    }

    // Threefold repetition: only triggers when a human player makes their 3rd repetition
    const currentTurn = this.ownerGameSession.turnManager.current;
    const justMovedNumber = AbstractPlayer.findOpponentForPlayer(currentTurn);
    const justMovedPlayer = this.ownerGameSession.players.find(
      (p) => p.number === justMovedNumber,
    );
    if (
      justMovedPlayer?.isHuman() &&
      justMovedPlayer.isLastMoveThreefoldRepetition()
    ) {
      this.ownerGameSession.changeState(
        new GameSessionStateGameOver(this.ownerGameSession),
      );
      this.ownerGameSession.setDrawReason("threefold");
    }
  }

  private checkCheckMate(): void {
    try {
      for (const playerNumber of [1, 2]) {
        const king = this.ownerGameSession.gameboard.findKing(playerNumber);
        if (king.isInCheckMate()) {
          this.ownerGameSession.changeState(
            new GameSessionStateGameOver(this.ownerGameSession),
          );
          this.ownerGameSession.setWinner(playerNumber === 1 ? 2 : 1);
          return;
        }
      }
    } catch {
      // King not found, continue
    }
  }

  private checkStalemate(): boolean {
    let king: King;
    const currentPlayer = this.getCurrentlyPlayingPlayer();
    try {
      king = this.ownerGameSession.gameboard.findKing(currentPlayer.number);
    } catch {
      return false;
    }

    if (king.isInCheck()) return false;

    const playersPieces = this.ownerGameSession.gameboard.findPiecesOwnedByPlayer(
      currentPlayer.number,
    );
    for (const piece of playersPieces) {
      if (piece.findPossibleMoves(true).length > 0) {
        return false;
      }
    }

    this.ownerGameSession.changeState(
      new GameSessionStateGameOver(this.ownerGameSession),
    );
    return true;
  }

  private getCurrentlyPlayingPlayer(): AbstractPlayer {
    const currentTurn = this.ownerGameSession.turnManager.current;
    const player = this.ownerGameSession.players.find(
      (p) => p.number === currentTurn,
    );
    if (player === undefined) {
      throw new ChessException("Currently no-one is playing the game.");
    }
    return player;
  }

  private updatePlayers(): void {
    const currentTurn = this.ownerGameSession.turnManager.current;
    for (const player of this.ownerGameSession.players) {
      if (player.number === currentTurn) {
        if (player.stateName === PlayerStateName.IDLE) {
          player.changeStateToPlay();
        }
        player.updateState();
        break;
      }
    }
  }

  private updatePieces(): void {
    const timeDelta = this.ownerGameSession.ownerScene?.timeDelta ?? 16;
    for (const piece of this.ownerGameSession.gameboard.getPieces()) {
      piece.updateState(timeDelta);
    }
  }

  private updateTurn(): boolean {
    for (const player of this.ownerGameSession.players) {
      if (player.stateName === PlayerStateName.FINAL) {
        player.changeState(new PlayerStateIdle(player));
        this.ownerGameSession.turnManager.nextTurn();
        return true;
      }
    }
    return false;
  }

  get stateName(): GameSessionStateName {
    return GameSessionStateName.PLAY;
  }
}

// --- Game over state ---

export class GameSessionStateGameOver extends GameSessionState {
  constructor(ownerGameSession: GameSession) {
    super(ownerGameSession);
  }

  updateState(): void {
    // Do nothing
  }

  get stateName(): GameSessionStateName {
    return GameSessionStateName.GAME_OVER;
  }
}

// --- GameSession ---

export class GameSession {
  ownerScene: SceneContext | undefined;
  private _gameboard: Gameboard;
  private _players: AbstractPlayer[] = [];
  private _turnManager = new TurnManager();
  private stateCurrent: GameSessionState;
  private _winner = 0;
  private _drawReason: string | null = null;
  private _halfMoveClock = 0;

  constructor(ownerScene?: SceneContext) {
    this.ownerScene = ownerScene;
    this._gameboard = new Gameboard(this);
    this.stateCurrent = new GameSessionStatePlay(this);
  }

  resetPiecesToInitialPosition(): void {
    this._gameboard.resetGameboard();
  }

  addPlayer(player: AbstractPlayer): void {
    this._players.push(player);
  }

  get players(): AbstractPlayer[] {
    return this._players;
  }

  updateState(): void {
    this.stateCurrent.updateState();
  }

  changeState(newState: GameSessionState): void {
    this.stateCurrent = newState;
  }

  get gameboard(): Gameboard {
    return this._gameboard;
  }

  get turnManager(): TurnManager {
    return this._turnManager;
  }

  get stateName(): GameSessionStateName {
    return this.stateCurrent.stateName;
  }

  get winner(): number {
    return this._winner;
  }

  get winnerSide(): string {
    return this._winner === 1 ? "White" : "Black";
  }

  setWinner(winner: number): void {
    if (this.stateCurrent.stateName === GameSessionStateName.GAME_OVER) {
      this._winner = winner;
    }
  }

  get drawReason(): string | null {
    return this._drawReason;
  }

  setDrawReason(reason: string): void {
    if (this.stateCurrent.stateName === GameSessionStateName.GAME_OVER) {
      this._drawReason = reason;
    }
  }

  get halfMoveClock(): number {
    return this._halfMoveClock;
  }

  updateHalfMoveClock(wasCapture: boolean, wasPawnMove: boolean): void {
    if (wasCapture || wasPawnMove) {
      this._halfMoveClock = 0;
    } else {
      this._halfMoveClock++;
    }
  }

  reset(): void {
    this._gameboard.resetGameboard();
    this.resetPlayers();
    this._turnManager.reset();
    this.stateCurrent = new GameSessionStatePlay(this);
    this._drawReason = null;
    this._halfMoveClock = 0;
  }

  private resetPlayers(): void {
    for (const player of this._players) {
      player.changeState(new PlayerStateIdle(player));
    }
  }
}
