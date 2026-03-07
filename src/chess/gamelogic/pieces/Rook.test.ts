import { describe, it, expect } from "vitest";
import { Gameboard } from "../Gameboard";
import { Rook } from "./Rook";
import { Pawn } from "./Pawn";
import { King } from "./King";

describe("Rook moves", () => {
  it("testWhiteRookMovement - center", () => {
    const gameboard = new Gameboard();
    const rook = new Rook(1);
    gameboard.insertPieceToTile(rook, 3, 3);

    expect(rook.findPossibleMoves(false).length).toBe(14);
  });

  it("testWhiteRookMovementBlockedByWhitePawn", () => {
    const gameboard = new Gameboard();
    const rook = new Rook(1);
    gameboard.insertPieceToTile(rook, 3, 3);
    gameboard.insertPieceToTile(new Pawn(1), 2, 3);
    gameboard.insertPieceToTile(new Pawn(1), 3, 2);

    expect(rook.findPossibleMoves(false).length).toBe(10);
  });

  it("testWhiteRookMovementBlockedByWhitePawnAndWhiteKing", () => {
    const gameboard = new Gameboard();
    const rook = new Rook(1);
    gameboard.insertPieceToTile(rook, 3, 3);
    gameboard.insertPieceToTile(new Pawn(1), 2, 3);
    gameboard.insertPieceToTile(new King(1), 3, 2);

    expect(rook.findPossibleMoves(true).length).toBe(10);
  });

  it("testWhiteRookMovementBlockedByWhitePawnAndBlackKing", () => {
    const gameboard = new Gameboard();
    const rook = new Rook(1);
    gameboard.insertPieceToTile(rook, 3, 3);
    gameboard.insertPieceToTile(new Pawn(1), 2, 3);
    gameboard.insertPieceToTile(new King(2), 3, 2);

    expect(rook.findPossibleMoves(false).length).toBe(11);
  });

  it("testWhiteRookMovementBlockedByBlackPawn", () => {
    const gameboard = new Gameboard();
    const rook = new Rook(1);
    gameboard.insertPieceToTile(rook, 3, 3);
    gameboard.insertPieceToTile(new Pawn(2), 2, 3);
    gameboard.insertPieceToTile(new Pawn(2), 3, 2);

    expect(rook.findPossibleMoves(false).length).toBe(12);
  });

  it("testBlackRookMovementBlockedByBlackPawn", () => {
    const gameboard = new Gameboard();
    const rook = new Rook(2);
    gameboard.insertPieceToTile(rook, 1, 1);
    gameboard.insertPieceToTile(new Pawn(2), 1, 2);
    gameboard.insertPieceToTile(new Pawn(2), 2, 1);
    gameboard.insertPieceToTile(new Pawn(1), 1, 8);

    expect(rook.findPossibleMoves(false).length).toBe(0);
  });
});
