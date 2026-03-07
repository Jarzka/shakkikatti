import { describe, it, expect, beforeEach } from "vitest";
import { GameSession, GameSessionStateGameOver } from "./GameSession";

describe("GameSession — halfMoveClock", () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
  });

  it("starts at zero", () => {
    expect(session.halfMoveClock).toBe(0);
  });

  it("increments on a non-pawn non-capture move", () => {
    session.updateHalfMoveClock(false, false);
    expect(session.halfMoveClock).toBe(1);
  });

  it("increments multiple times in a row", () => {
    session.updateHalfMoveClock(false, false);
    session.updateHalfMoveClock(false, false);
    session.updateHalfMoveClock(false, false);
    expect(session.halfMoveClock).toBe(3);
  });

  it("resets to zero on a capture", () => {
    session.updateHalfMoveClock(false, false);
    session.updateHalfMoveClock(false, false);
    session.updateHalfMoveClock(true, false); // capture
    expect(session.halfMoveClock).toBe(0);
  });

  it("resets to zero on a pawn move", () => {
    session.updateHalfMoveClock(false, false);
    session.updateHalfMoveClock(false, false);
    session.updateHalfMoveClock(false, true); // pawn move
    expect(session.halfMoveClock).toBe(0);
  });

  it("resets to zero when both capture and pawn move are flagged", () => {
    session.updateHalfMoveClock(false, false);
    session.updateHalfMoveClock(true, true);
    expect(session.halfMoveClock).toBe(0);
  });

  it("increments again after a reset", () => {
    session.updateHalfMoveClock(false, false);
    session.updateHalfMoveClock(true, false); // reset
    session.updateHalfMoveClock(false, false);
    expect(session.halfMoveClock).toBe(1);
  });
});

describe("GameSession — drawReason", () => {
  let session: GameSession;

  beforeEach(() => {
    session = new GameSession();
  });

  it("is null initially", () => {
    expect(session.drawReason).toBeNull();
  });

  it("setDrawReason does nothing when the game is still in progress", () => {
    session.setDrawReason("threefold");
    expect(session.drawReason).toBeNull();
  });

  it("setDrawReason stores the reason after game over", () => {
    session.changeState(new GameSessionStateGameOver(session));
    session.setDrawReason("threefold");
    expect(session.drawReason).toBe("threefold");
  });

  it("setDrawReason stores seventy-five-move reason", () => {
    session.changeState(new GameSessionStateGameOver(session));
    session.setDrawReason("seventy-five-move");
    expect(session.drawReason).toBe("seventy-five-move");
  });
});

describe("GameSession — reset", () => {
  it("clears drawReason on reset", () => {
    const session = new GameSession();
    session.changeState(new GameSessionStateGameOver(session));
    session.setDrawReason("threefold");
    session.reset();
    expect(session.drawReason).toBeNull();
  });

  it("clears halfMoveClock on reset", () => {
    const session = new GameSession();
    session.updateHalfMoveClock(false, false);
    session.updateHalfMoveClock(false, false);
    session.reset();
    expect(session.halfMoveClock).toBe(0);
  });
});
