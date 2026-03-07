import { describe, it, expect } from "vitest";
import { Gameboard } from "../Gameboard";
import { Queen } from "./Queen";
import { Pawn } from "./Pawn";
import { Rook } from "./Rook";
import { Knight } from "./Knight";
import { Bishop } from "./Bishop";
import { King } from "./King";
import type { Piece } from "./Piece";

describe("Queen moves", () => {
  it("testWhiteQueenMovement - near corner", () => {
    const gameboard = new Gameboard();
    const queen: Piece = new Queen(1);
    gameboard.insertPieceToTile(queen, 2, 2);

    expect(queen.findPossibleMoves(false).length).toBe(23);
  });

  it("testWhiteQueenMovement2 - blocked by own pawn", () => {
    const gameboard = new Gameboard();
    const queen: Piece = new Queen(1);
    gameboard.insertPieceToTile(queen, 2, 2);
    gameboard.insertPieceToTile(new Pawn(1), 1, 2);

    expect(queen.findPossibleMoves(false).length).toBe(22);
  });

  it("testWhiteQueenMovement3 - full board setup", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Rook(2), 1, 1);
    gameboard.insertPieceToTile(new Knight(2), 1, 2);
    gameboard.insertPieceToTile(new Bishop(2), 1, 3);
    gameboard.insertPieceToTile(new Queen(2), 1, 4);
    gameboard.insertPieceToTile(new King(2), 1, 5);
    gameboard.insertPieceToTile(new Bishop(2), 1, 6);
    gameboard.insertPieceToTile(new Rook(2), 1, 8);

    gameboard.insertPieceToTile(new Pawn(2), 2, 1);
    gameboard.insertPieceToTile(new Pawn(2), 2, 2);
    gameboard.insertPieceToTile(new Pawn(2), 2, 5);
    gameboard.insertPieceToTile(new Pawn(2), 2, 6);
    gameboard.insertPieceToTile(new Pawn(2), 2, 7);
    gameboard.insertPieceToTile(new Pawn(2), 2, 8);

    gameboard.insertPieceToTile(new Pawn(2), 3, 5);
    gameboard.insertPieceToTile(new Knight(2), 3, 8);

    gameboard.insertPieceToTile(new Pawn(2), 4, 3);

    gameboard.insertPieceToTile(new Pawn(1), 5, 4);

    gameboard.insertPieceToTile(new Pawn(1), 7, 1);
    gameboard.insertPieceToTile(new Pawn(1), 7, 2);
    gameboard.insertPieceToTile(new Pawn(1), 7, 3);
    gameboard.insertPieceToTile(new Pawn(1), 7, 6);
    gameboard.insertPieceToTile(new Pawn(1), 7, 7);
    gameboard.insertPieceToTile(new Pawn(1), 7, 8);

    gameboard.insertPieceToTile(new Rook(1), 8, 1);
    gameboard.insertPieceToTile(new Knight(1), 8, 2);
    gameboard.insertPieceToTile(new Bishop(1), 8, 3);
    const queen: Piece = new Queen(1);
    gameboard.insertPieceToTile(queen, 8, 4);
    gameboard.insertPieceToTile(new King(1), 8, 5);
    gameboard.insertPieceToTile(new Bishop(1), 8, 6);
    gameboard.insertPieceToTile(new Knight(1), 8, 7);
    gameboard.insertPieceToTile(new Rook(1), 8, 8);

    expect(queen.findPossibleMoves(false).length).toBe(6);
  });
});
