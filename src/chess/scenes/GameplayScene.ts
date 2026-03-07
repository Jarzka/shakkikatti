import { Scene } from "../../engine/Scene";
import { SpriteContainer } from "../../engine/SpriteContainer";
import { GameSession } from "../gamelogic/GameSession";
import { GameSessionStateName } from "../gamelogic/enums";
import { TileColor } from "../gamelogic/enums";
import type { Piece } from "../gamelogic/pieces/Piece";
import { PieceStateName } from "../gamelogic/pieces/types";
import { PlayerStateName } from "../gamelogic/players/PlayerStateName";
import { HumanPlayerLocal } from "../gamelogic/players/HumanPlayerLocal";
import { AIPlayerLocal } from "../gamelogic/players/ai/AIPlayerLocal";
import { getTileSize } from "../inputdevices/ChessMouse";
import type { ChessMouse } from "../inputdevices/ChessMouse";
import { AIAlgorithm } from "../gamelogic/players/ai";
import { generateFEN, parseFEN } from "../gamelogic/fen";
import { Colors } from "../ui/colors";
import { PieceName } from "../gamelogic/pieces/types";
import { Bishop } from "../gamelogic/pieces/Bishop";
import { King } from "../gamelogic/pieces/King";
import { Knight } from "../gamelogic/pieces/Knight";
import { Pawn } from "../gamelogic/pieces/Pawn";
import { Queen } from "../gamelogic/pieces/Queen";
import { Rook } from "../gamelogic/pieces/Rook";

export type PlayerType = "human" | "ai";

export interface PlayerConfig {
  type: PlayerType;
  algorithm: AIAlgorithm;
}

export interface GameConfig {
  white: PlayerConfig;
  black: PlayerConfig;
  fen?: string;
}

export class GameplayScene extends Scene {
  private gameSession: GameSession;
  private sprites: SpriteContainer;
  private loadingOverlay: HTMLElement | null;
  private pauseOverlay: HTMLDivElement | undefined;
  private isPaused = false;
  private escHandler: ((e: KeyboardEvent) => void) | undefined;
  timeDelta = 0;

  constructor(
    sprites: SpriteContainer,
    config: GameConfig,
    mouse: ChessMouse,
  ) {
    super();
    this.sprites = sprites;
    this.loadingOverlay = document.getElementById("loading-overlay");
    this.gameSession = new GameSession(this);

    const gb = this.gameSession.gameboard;

    const makePlayer = (playerNumber: number, cfg: PlayerConfig) =>
      cfg.type === "human"
        ? new HumanPlayerLocal(playerNumber, gb, mouse)
        : new AIPlayerLocal(playerNumber, gb, cfg.algorithm);

    this.gameSession.addPlayer(makePlayer(1, config.white));
    this.gameSession.addPlayer(makePlayer(2, config.black));

    if (config.fen) {
      this.loadPositionFromFEN(config.fen);
    } else {
      this.gameSession.resetPiecesToInitialPosition();
    }

    this.escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") this.togglePause();
    };
    document.addEventListener("keydown", this.escHandler);
  }

  private loadPositionFromFEN(fen: string): void {
    const parsed = parseFEN(fen);
    const gb = this.gameSession.gameboard;

    gb.removePieces();

    for (const tileData of parsed.tiles) {
      const piece = createPiece(tileData.pieceName, tileData.ownerPlayer);
      piece.hasMoved = tileData.hasMoved;
      gb.insertPieceToTile(piece, tileData.row, tileData.column);
    }

    if (parsed.lastMove !== undefined) {
      gb.lastMove = parsed.lastMove;
    }
    gb.performedMoves = parsed.performedMoves;
    this.gameSession.turnManager.setTurn(parsed.activePlayer);
  }

  getName(): string {
    return "GAMEPLAY";
  }

  /** Clean up event listeners when leaving this scene. */
  destroy(): void {
    if (this.escHandler) {
      document.removeEventListener("keydown", this.escHandler);
      this.escHandler = undefined;
    }
    this.closePauseMenu();
  }

  update(timeDeltaMs: number): void {
    this.timeDelta = timeDeltaMs;
    if (!this.isPaused) {
      this.gameSession.updateState();
      this.updateLoadingOverlay();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawTiles(ctx);
    this.drawSelections(ctx);
    this.drawPieces(ctx);
    this.drawEndStateText(ctx);
  }

  // --- Pause menu ---

  private togglePause(): void {
    if (this.isPaused) {
      this.closePauseMenu();
    } else {
      this.openPauseMenu();
    }
  }

  private openPauseMenu(): void {
    if (this.pauseOverlay !== undefined) return;
    this.isPaused = true;
    if (this.loadingOverlay) this.loadingOverlay.style.visibility = "hidden";

    // Outer wrapper fills the game container and uses flexbox to center the popup.
    // The popup itself carries the animation, avoiding a transform conflict with
    // the translate(-50%, -50%) centering trick.
    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "20",
    });

    const popup = document.createElement("div");
    Object.assign(popup.style, {
      width: "300px",
      background: Colors.POPUP_BG,
      borderRadius: "12px",
      border: `1px solid ${Colors.POPUP_BORDER}`,
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
      fontFamily: Colors.FONT_FAMILY,
      animation: "shakkiLogoIn 0.35s ease-out both",
    });

    const title = document.createElement("p");
    title.textContent = "Game Paused";
    Object.assign(title.style, {
      color: Colors.TEXT_PRIMARY,
      fontSize: "20px",
      fontWeight: "bold",
      margin: "0 0 4px",
    });
    popup.appendChild(title);

    const btnRow = document.createElement("div");
    Object.assign(btnRow.style, { display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" });

    const copyBtn = this.createButton("Copy FEN to Clipboard");
    copyBtn.addEventListener("click", () => this.copyFENToClipboard(fenCopiedMsg));
    btnRow.appendChild(copyBtn);

    const closeBtn = this.createButton("Close");
    closeBtn.addEventListener("click", () => this.closePauseMenu());
    btnRow.appendChild(closeBtn);

    popup.appendChild(btnRow);

    const fenCopiedMsg = document.createElement("p");
    fenCopiedMsg.textContent = "FEN copied to clipboard";
    Object.assign(fenCopiedMsg.style, {
      color: Colors.TEXT_SECONDARY,
      fontSize: "13px",
      margin: "0",
      visibility: "hidden",
    });
    popup.appendChild(fenCopiedMsg);

    wrapper.appendChild(popup);

    const gameContainer = document.getElementById("game-container");
    (gameContainer ?? document.body).appendChild(wrapper);
    this.pauseOverlay = wrapper;
  }

  private closePauseMenu(): void {
    if (this.pauseOverlay === undefined) return;

    const wrapper = this.pauseOverlay;
    // Animate the popup (first child) out
    const popup = wrapper.firstElementChild as HTMLElement | null;
    if (popup) popup.style.animation = "shakkiLogoOut 0.3s ease-in both";
    setTimeout(() => wrapper.remove(), 310);

    this.pauseOverlay = undefined;
    this.isPaused = false;
  }

  private copyFENToClipboard(msg: HTMLElement): void {
    const activePlayer = this.gameSession.turnManager.current;
    const fen = generateFEN(this.gameSession.gameboard, activePlayer);
    navigator.clipboard.writeText(fen).then(() => {
      msg.style.visibility = "visible";
      setTimeout(() => { msg.style.visibility = "hidden"; }, 1500);
    });
  }

  private createButton(label: string): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: "10px 20px",
      fontSize: "15px",
      cursor: "pointer",
      border: "none",
      borderRadius: "6px",
      background: Colors.BUTTON_PRIMARY,
      color: Colors.TEXT_PRIMARY,
      fontFamily: Colors.FONT_FAMILY,
    });
    btn.addEventListener("mouseenter", () => { btn.style.background = Colors.BUTTON_PRIMARY_HOVER; });
    btn.addEventListener("mouseleave", () => { btn.style.background = Colors.BUTTON_PRIMARY; });
    return btn;
  }

  // --- Rendering ---

  private drawTiles(ctx: CanvasRenderingContext2D): void {
    const TILE_SIZE = getTileSize();
    const gb = this.gameSession.gameboard;

    for (const tile of gb.getTiles()) {
      const spriteName =
        tile.color === TileColor.WHITE ? "tile_white" : "tile_black";
      const sprite = this.sprites.getSprite(spriteName);
      if (sprite !== undefined) {
        sprite.draw(
          ctx,
          gb.positionX + (tile.position.column - 1) * TILE_SIZE,
          gb.positionY + (tile.position.row - 1) * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        );
      }
    }
  }

  private drawSelections(ctx: CanvasRenderingContext2D): void {
    const TILE_SIZE = getTileSize();
    const gb = this.gameSession.gameboard;

    for (const piece of gb.getPieces()) {
      if (piece.isSelected) {
        const sprite = this.sprites.getSprite("selected_pawn");
        if (sprite !== undefined) {
          sprite.draw(
            ctx,
            gb.positionX + (piece.column - 1) * TILE_SIZE,
            gb.positionY + (piece.row - 1) * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE,
          );
        }
      }
    }

    if (this.sprites.hasSprite("cross")) {
      const crossSprite = this.sprites.getSprite("cross");
      for (const cell of gb.crossMarkedCells) {
        crossSprite.draw(
          ctx,
          gb.positionX + (cell.column - 1) * TILE_SIZE,
          gb.positionY + (cell.row - 1) * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        );
      }
    }
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    const TILE_SIZE = getTileSize();
    const gb = this.gameSession.gameboard;

    for (const piece of gb.getPieces()) {
      const spriteName = this.getSpriteNameForPiece(piece);
      const sprite = this.sprites.getSprite(spriteName);
      if (sprite === undefined) continue;

      if (piece.stateName === PieceStateName.MOVING) {
        const sourceX = gb.positionX + (piece.getAnimationSourceColumn() - 1) * TILE_SIZE;
        const targetX = gb.positionX + (piece.targetColumn! - 1) * TILE_SIZE;
        const posX = sourceX + (targetX - sourceX) * (piece.movementProgress / 100);

        const sourceY = gb.positionY + (piece.getAnimationSourceRow() - 1) * TILE_SIZE;
        const targetY = gb.positionY + (piece.targetRow! - 1) * TILE_SIZE;
        const posY = sourceY + (targetY - sourceY) * (piece.movementProgress / 100);

        sprite.draw(ctx, posX, posY, TILE_SIZE, TILE_SIZE);
      } else {
        sprite.draw(
          ctx,
          gb.positionX + (piece.column - 1) * TILE_SIZE,
          gb.positionY + (piece.row - 1) * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE,
        );
      }
    }
  }

  private updateLoadingOverlay(): void {
    if (!this.loadingOverlay) return;
    let aiThinking = false;
    for (const player of this.gameSession.players) {
      if (!player.isHuman() && player.stateName === PlayerStateName.PLAY) {
        aiThinking = true;
        break;
      }
    }
    this.loadingOverlay.style.visibility = aiThinking ? "visible" : "hidden";
  }

  private drawEndStateText(ctx: CanvasRenderingContext2D): void {
    if (this.gameSession.stateName !== GameSessionStateName.GAME_OVER)
      return;

    let text: string;
    if (this.gameSession.drawReason === "threefold") {
      text = "Draw by threefold repetition!";
    } else if (this.gameSession.drawReason === "seventy-five-move") {
      text = "Draw by 75-move rule!";
    } else if (this.gameSession.drawReason !== null) {
      text = "Draw!";
    } else if (this.gameSession.winner === 0) {
      text = "Stalemate!";
    } else {
      text = `${this.gameSession.winnerSide} won the match!`;
    }

    ctx.save();
    ctx.font = "bold 28px sans-serif";

    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 28;
    const padding = 20;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = textHeight + padding * 2;
    const boxX = ctx.canvas.width / 2 - boxWidth / 2;
    const boxY = ctx.canvas.height / 2 - boxHeight / 2;
    const radius = 10;

    const isBlackWin = this.gameSession.winner === 2;
    ctx.fillStyle = isBlackWin ? "rgba(255, 255, 255, 0.72)" : "rgba(0, 0, 0, 0.72)";
    ctx.beginPath();
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxWidth - radius, boxY);
    ctx.arcTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius, radius);
    ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
    ctx.arcTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight, radius);
    ctx.lineTo(boxX + radius, boxY + boxHeight);
    ctx.arcTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius, radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.arcTo(boxX, boxY, boxX + radius, boxY, radius);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = isBlackWin ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (this.gameSession.drawReason !== null || this.gameSession.winner === 0) {
      ctx.fillStyle = "#ff6b6b";
    } else if (this.gameSession.winner === 1) {
      ctx.fillStyle = "white";
    } else {
      ctx.fillStyle = "black";
    }

    ctx.fillText(
      text,
      ctx.canvas.width / 2 - textWidth / 2,
      ctx.canvas.height / 2 + textHeight / 2,
    );

    ctx.restore();
  }

  private getSpriteNameForPiece(piece: Piece): string {
    const color = piece.ownerPlayerNumber === 1 ? "white" : "black";
    const name = piece.name.toLowerCase();
    return `${name}_${color}`;
  }

  getGameSession(): GameSession {
    return this.gameSession;
  }
}

function createPiece(name: PieceName, ownerPlayer: number) {
  switch (name) {
    case PieceName.KING:   return new King(ownerPlayer);
    case PieceName.QUEEN:  return new Queen(ownerPlayer);
    case PieceName.ROOK:   return new Rook(ownerPlayer);
    case PieceName.BISHOP: return new Bishop(ownerPlayer);
    case PieceName.KNIGHT: return new Knight(ownerPlayer);
    case PieceName.PAWN:   return new Pawn(ownerPlayer);
    default: throw new Error(`Unknown piece: ${name}`);
  }
}
