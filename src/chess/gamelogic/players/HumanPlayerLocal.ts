import { Gameboard } from "../Gameboard";
import type { ChessMouse } from "../../inputdevices/ChessMouse";
import { AbstractPlayer } from "./AbstractPlayer";
import { PlayerStatePlayHuman } from "./PlayerStatePlayHuman";

export class HumanPlayerLocal extends AbstractPlayer {
  private mouse: ChessMouse;

  constructor(playerNumber: number, gameboard: Gameboard, mouse: ChessMouse) {
    super(playerNumber, gameboard);
    this.mouse = mouse;
  }

  changeStateToPlay(): void {
    this.changeState(new PlayerStatePlayHuman(this, this.mouse));
  }

  isHuman(): boolean {
    return true;
  }
}
