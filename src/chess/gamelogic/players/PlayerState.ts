import type { AbstractPlayer } from "./AbstractPlayer";
import { PlayerStateName } from "./PlayerStateName";

export abstract class AbstractPlayerState {
  protected ownerPlayer: AbstractPlayer;

  constructor(owner: AbstractPlayer) {
    this.ownerPlayer = owner;
  }

  abstract updateState(): void;
  abstract get stateName(): PlayerStateName;
}

export class PlayerStateIdle extends AbstractPlayerState {
  constructor(owner: AbstractPlayer) {
    super(owner);
  }

  updateState(): void {
    // No need to do anything
  }

  get stateName(): PlayerStateName {
    return PlayerStateName.IDLE;
  }
}

export abstract class PlayerStatePlay extends AbstractPlayerState {
  constructor(owner: AbstractPlayer) {
    super(owner);
  }

  get stateName(): PlayerStateName {
    return PlayerStateName.PLAY;
  }
}
