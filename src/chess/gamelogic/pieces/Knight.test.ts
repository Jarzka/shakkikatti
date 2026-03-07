import { describe, it, expect } from "vitest";
import { Gameboard } from "../Gameboard";
import { Knight } from "./Knight";
import { Pawn } from "./Pawn";
import { Queen } from "./Queen";
import { Rook } from "./Rook";

describe("Knight moves", () => {
  it("testWhiteKnightMovement - corner", () => {
    const gameboard = new Gameboard();
    const knight = new Knight(1);
    gameboard.insertPieceToTile(knight, 2, 2);

    expect(knight.findPossibleMoves(false).length).toBe(4);
  });

  it("testWhiteKnightMovement2 - center", () => {
    const gameboard = new Gameboard();
    const knight = new Knight(1);
    gameboard.insertPieceToTile(knight, 4, 4);

    expect(knight.findPossibleMoves(false).length).toBe(8);
  });

  it("testWhiteKnightMovement3 - top-left corner", () => {
    const gameboard = new Gameboard();
    const knight = new Knight(1);
    gameboard.insertPieceToTile(knight, 1, 1);

    expect(knight.findPossibleMoves(false).length).toBe(2);
  });

  it("testWhiteKnightMovementAttack - all targets are enemies", () => {
    const gameboard = new Gameboard();
    const knight = new Knight(1);
    gameboard.insertPieceToTile(knight, 4, 4);
    gameboard.insertPieceToTile(new Pawn(2), 2, 3);
    gameboard.insertPieceToTile(new Pawn(2), 3, 2);
    gameboard.insertPieceToTile(new Pawn(2), 2, 5);
    gameboard.insertPieceToTile(new Pawn(2), 3, 6);
    gameboard.insertPieceToTile(new Pawn(2), 5, 6);
    gameboard.insertPieceToTile(new Pawn(2), 6, 5);
    gameboard.insertPieceToTile(new Pawn(2), 5, 2);
    gameboard.insertPieceToTile(new Pawn(2), 6, 3);

    expect(knight.findPossibleMoves(false).length).toBe(8);
  });

  it("testFindProtectors - 1 pawn protects", () => {
    const gameboard = new Gameboard();
    const knight = new Knight(1);
    gameboard.insertPieceToTile(knight, 1, 1);
    gameboard.insertPieceToTile(new Pawn(1), 2, 2);

    expect(knight.findProtectors().length).toBe(1);
  });

  it("testFindProtectors2 - pawn + queen + rook protect", () => {
    const gameboard = new Gameboard();
    const knight = new Knight(1);
    gameboard.insertPieceToTile(knight, 1, 1);
    gameboard.insertPieceToTile(new Pawn(1), 2, 2);
    gameboard.insertPieceToTile(new Queen(1), 1, 8);
    gameboard.insertPieceToTile(new Rook(1), 8, 1);

    expect(knight.findProtectors().length).toBe(3);
  });

  it("testFindProtectors3 - opponent queen does not protect", () => {
    const gameboard = new Gameboard();
    const knight = new Knight(1);
    gameboard.insertPieceToTile(knight, 1, 1);
    gameboard.insertPieceToTile(new Pawn(1), 2, 2);
    gameboard.insertPieceToTile(new Queen(2), 1, 8);
    gameboard.insertPieceToTile(new Rook(1), 8, 1);

    expect(knight.findProtectors().length).toBe(2);
  });

  it("testFindProtectors4 - pawn blocks rook protection", () => {
    const gameboard = new Gameboard();
    const knight = new Knight(1);
    gameboard.insertPieceToTile(knight, 1, 1);
    gameboard.insertPieceToTile(new Pawn(1), 2, 2);
    gameboard.insertPieceToTile(new Queen(1), 1, 8);
    gameboard.insertPieceToTile(new Rook(1), 8, 1);
    gameboard.insertPieceToTile(new Pawn(2), 5, 1);

    expect(knight.findProtectors().length).toBe(2);
  });
});
