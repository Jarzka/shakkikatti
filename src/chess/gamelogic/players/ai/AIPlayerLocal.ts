import { Gameboard } from "../../Gameboard";
import { AbstractPlayer } from "../AbstractPlayer";
import { PlayerStatePlayAI } from "./PlayerStatePlayAI";
import { AIAlgorithm } from "./aiTypes";

export class AIPlayerLocal extends AbstractPlayer {
  private readonly algorithm: AIAlgorithm;

  constructor(
    playerNumber: number,
    gameboard: Gameboard,
    algorithm: AIAlgorithm = AIAlgorithm.BEST_RESPONSE,
  ) {
    super(playerNumber, gameboard);
    this.algorithm = algorithm;
  }

  changeStateToPlay(): void {
    this.changeState(new PlayerStatePlayAI(this, this.algorithm));
  }

  isHuman(): boolean {
    return false;
  }
}
