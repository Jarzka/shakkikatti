import { describe, it, expect } from "vitest";
import { Gameboard } from "../Gameboard";
import { Bishop } from "./Bishop";

describe("Bishop moves", () => {
  it("testWhiteBishopMovement - near corner", () => {
    const gameboard = new Gameboard();
    const bishop = new Bishop(1);
    gameboard.insertPieceToTile(bishop, 2, 2);

    expect(bishop.findPossibleMoves(false).length).toBe(9);
  });

  it("testWhiteBishopMovement2 - bottom-right corner", () => {
    const gameboard = new Gameboard();
    const bishop = new Bishop(1);
    gameboard.insertPieceToTile(bishop, 8, 8);

    expect(bishop.findPossibleMoves(false).length).toBe(7);
  });

  it("testWhiteBishopMovement3 - bottom-left corner", () => {
    const gameboard = new Gameboard();
    const bishop = new Bishop(1);
    gameboard.insertPieceToTile(bishop, 8, 1);

    expect(bishop.findPossibleMoves(false).length).toBe(7);
  });

  it("testWhiteBishopMovementBlockedByWhiteBishop", () => {
    const gameboard = new Gameboard();
    const bishop = new Bishop(1);
    gameboard.insertPieceToTile(bishop, 8, 8);
    const bishop2 = new Bishop(1);
    gameboard.insertPieceToTile(bishop2, 7, 7);

    expect(bishop.findPossibleMoves(false).length).toBe(0);
  });

  it("testWhiteBishopMovementBlockedByBlackBishop - can capture", () => {
    const gameboard = new Gameboard();
    const bishop = new Bishop(1);
    gameboard.insertPieceToTile(bishop, 8, 8);
    const bishop2 = new Bishop(2);
    gameboard.insertPieceToTile(bishop2, 6, 6);

    expect(bishop.findPossibleMoves(false).length).toBe(2);
  });
});
