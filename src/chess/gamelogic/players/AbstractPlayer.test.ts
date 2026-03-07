import { describe, it, expect, beforeEach } from "vitest";
import { Cell } from "../Cell";
import { Gameboard } from "../Gameboard";
import { HumanPlayerLocal } from "./HumanPlayerLocal";

describe("AbstractPlayer — move repetition rule", () => {
  let gameboard: Gameboard;
  let player: HumanPlayerLocal;

  const a = new Cell(7, 1);
  const b = new Cell(6, 1);

  beforeEach(() => {
    gameboard = new Gameboard();
    player = new HumanPlayerLocal(1, gameboard, {} as never);
  });

  it("a move is not banned before any history", () => {
    expect(player.isMoveRepeatBanned(a, b)).toBe(false);
  });

  it("a move is not banned after being made once", () => {
    player.recordMove(a, b);
    expect(player.isMoveRepeatBanned(a, b)).toBe(false);
  });

  it("a move is banned after being made twice in the last 4 turns", () => {
    player.recordMove(a, b);
    player.recordMove(b, a); // return move
    player.recordMove(a, b); // second time same move
    expect(player.isMoveRepeatBanned(a, b)).toBe(true);
  });

  it("ban does not apply to a different target cell", () => {
    const c = new Cell(5, 1);
    player.recordMove(a, b);
    player.recordMove(b, a);
    player.recordMove(a, b);
    expect(player.isMoveRepeatBanned(a, c)).toBe(false);
  });

  it("ban does not apply to a different source cell", () => {
    const c = new Cell(7, 2);
    player.recordMove(a, b);
    player.recordMove(b, a);
    player.recordMove(a, b);
    expect(player.isMoveRepeatBanned(c, b)).toBe(false);
  });

  it("old occurrences outside the last 4 turns are ignored", () => {
    // a→b twice, then 4 other moves push them out of the window
    player.recordMove(a, b);
    player.recordMove(b, a);
    player.recordMove(a, b); // 2nd time — would be banned if in window
    player.recordMove(b, a);
    player.recordMove(a, b); // now only 1 of the a→b moves is in window
    player.recordMove(b, a);
    player.recordMove(b, a);
    // Window of last 4: [a→b(3), b→a, b→a, b→a] — a→b appears once → not banned
    expect(player.isMoveRepeatBanned(a, b)).toBe(false);
  });

  it("exactly 2 occurrences in the last 4 triggers the ban", () => {
    // Fill window with alternating a→b, b→a
    player.recordMove(a, b);
    player.recordMove(b, a);
    player.recordMove(a, b);
    player.recordMove(b, a);
    // Last 4: [a→b, b→a, a→b, b→a] — a→b appears 2 times
    expect(player.isMoveRepeatBanned(a, b)).toBe(true);
    expect(player.isMoveRepeatBanned(b, a)).toBe(true);
  });
});

describe("AbstractPlayer — isLastMoveThreefoldRepetition", () => {
  let gameboard: Gameboard;
  let player: HumanPlayerLocal;

  const a = new Cell(7, 1);
  const b = new Cell(6, 1);

  beforeEach(() => {
    gameboard = new Gameboard();
    player = new HumanPlayerLocal(1, gameboard, {} as never);
  });

  it("returns false when history is empty", () => {
    expect(player.isLastMoveThreefoldRepetition()).toBe(false);
  });

  it("returns false after a move is recorded only once", () => {
    player.recordMove(a, b);
    expect(player.isLastMoveThreefoldRepetition()).toBe(false);
  });

  it("returns false after a move is recorded twice", () => {
    player.recordMove(a, b);
    player.recordMove(b, a);
    player.recordMove(a, b); // 2nd time a→b, last move is a→b
    expect(player.isLastMoveThreefoldRepetition()).toBe(false);
  });

  it("returns true after a move is recorded three times", () => {
    player.recordMove(a, b);
    player.recordMove(b, a);
    player.recordMove(a, b);
    player.recordMove(b, a);
    player.recordMove(a, b); // 3rd time a→b, last move is a→b
    expect(player.isLastMoveThreefoldRepetition()).toBe(true);
  });

  it("returns false when the last move differs from the repeated one", () => {
    const c = new Cell(5, 1);
    const d = new Cell(4, 1);
    player.recordMove(a, b);
    player.recordMove(b, a);
    player.recordMove(a, b); // 2 times a→b in history
    player.recordMove(c, d); // last move is a different move entirely
    expect(player.isLastMoveThreefoldRepetition()).toBe(false);
  });
});

describe("Gameboard — cross marked cells", () => {
  let gameboard: Gameboard;

  beforeEach(() => {
    gameboard = new Gameboard();
  });

  it("starts with no cross marked cells", () => {
    expect(gameboard.crossMarkedCells).toHaveLength(0);
  });

  it("setCrossMarkedCells stores the cells", () => {
    const cells = [new Cell(3, 4), new Cell(5, 6)];
    gameboard.crossMarkedCells = cells;
    const stored = gameboard.crossMarkedCells;
    expect(stored).toHaveLength(2);
    expect(stored[0].hasSameRowAndColumn(new Cell(3, 4))).toBe(true);
    expect(stored[1].hasSameRowAndColumn(new Cell(5, 6))).toBe(true);
  });

  it("markAllPiecesUnselected clears cross marked cells", () => {
    gameboard.crossMarkedCells = [new Cell(3, 4)];
    gameboard.markAllPiecesUnselected();
    expect(gameboard.crossMarkedCells).toHaveLength(0);
  });
});
