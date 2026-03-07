import { describe, it, expect } from "vitest";
import { Gameboard } from "../../Gameboard";
import { Cell } from "../../Cell";
import { Move } from "../../Move";
import { Pawn } from "../../pieces/Pawn";
import { Rook } from "../../pieces/Rook";
import { Knight } from "../../pieces/Knight";
import { Bishop } from "../../pieces/Bishop";
import { Queen } from "../../pieces/Queen";
import { King } from "../../pieces/King";
import { runAI } from "./AILogicBestResponse";

describe("AI move tests", () => {
  it("testAIBestMove - queen should capture pawn", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Queen(2), 5, 5);
    gameboard.insertPieceToTile(new Pawn(1), 4, 5);

    const move = runAI(gameboard, 2, 1, 2000);

    expect(move).toBeDefined();
    expect(move!.source.row).toBe(5);
    expect(move!.source.column).toBe(5);
    expect(move!.target.row).toBe(4);
    expect(move!.target.column).toBe(5);
  });

  it("testAIFindsAnswer - complex position", () => {
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
    gameboard.insertPieceToTile(new Queen(1), 8, 4);
    gameboard.insertPieceToTile(new King(1), 8, 5);
    gameboard.insertPieceToTile(new Bishop(1), 8, 6);
    gameboard.insertPieceToTile(new Knight(1), 8, 7);
    gameboard.insertPieceToTile(new Rook(1), 8, 8);

    const move = runAI(gameboard, 2, 1, 2000);

    expect(move).toBeDefined();
  }, 15000);

  it("testAIDoesNotMoveRook - opening position with knights moved", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    gameboard.movePieceImmediately(new Move(new Cell(8, 7), new Cell(6, 6)));
    gameboard.movePieceImmediately(new Move(new Cell(1, 7), new Cell(3, 6)));
    gameboard.movePieceImmediately(new Move(new Cell(8, 2), new Cell(6, 3)));
    gameboard.movePieceImmediately(new Move(new Cell(1, 2), new Cell(3, 3)));

    const move = runAI(gameboard, 2, 1, 2000);

    expect(move).toBeDefined();
    // AI should not move a rook in the opening
    const isRookMove =
      (move!.source.row === 1 && move!.source.column === 1) ||
      (move!.source.row === 1 && move!.source.column === 8);
    expect(isRookMove).toBe(false);
  });
});
