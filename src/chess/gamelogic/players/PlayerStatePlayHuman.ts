import { AbstractPlayer } from "./AbstractPlayer";
import { PlayerStatePlay } from "./PlayerState";
import type { ChessMouse } from "../../inputdevices/ChessMouse";

/**
 * Human player's play state:
 * Handles piece selection and move execution via mouse input.
 */
export class PlayerStatePlayHuman extends PlayerStatePlay {
  private mouse: ChessMouse;

  constructor(owner: AbstractPlayer, mouse: ChessMouse) {
    super(owner);
    this.mouse = mouse;
  }

  updateState(): void {
    this.handleEventPlayerCancelsSelection();
    this.handleEventPlayerSelectsPiece();
    this.handleEventPlayerMovesPiece();
  }

  private handleEventPlayerCancelsSelection(): void {
    if (!this.mouse.justRightClicked()) return;
    this.ownerPlayer.gameboard.markAllPiecesUnselected();
  }

  private handleEventPlayerSelectsPiece(): boolean {
    if (!this.mouse.justClicked()) return false;

    for (const piece of this.ownerPlayer.gameboard.findPiecesOwnedByPlayer(
      this.ownerPlayer.number,
    )) {
      if (this.mouse.isOnTile(piece.ownerTile!) && !piece.isSelected) {
        const player = this.ownerPlayer;
        player.gameboard.markAllPiecesUnselected();
        piece.isSelected = true;
        return true;
      }
    }

    return false;
  }

  private handleEventPlayerMovesPiece(): boolean {
    if (!this.mouse.justClicked()) return false;

    for (const piece of this.ownerPlayer.gameboard.findPiecesOwnedByPlayer(
      this.ownerPlayer.number,
    )) {
      if (piece.isSelected) {
        const player = this.ownerPlayer;
        for (const move of piece.findPossibleMoves(true)) {
          const targetTile = player.gameboard.getTileAtPosition(
            move.target.row,
            move.target.column,
          );
          if (targetTile !== undefined && this.mouse.isOnTile(targetTile)) {
            player.performMove(piece, move);
          }
        }
        return true;
      }
    }

    return true;
  }
}
