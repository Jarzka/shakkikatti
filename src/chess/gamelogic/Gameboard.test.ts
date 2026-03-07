import { describe, it, expect } from "vitest";
import { Gameboard } from "./Gameboard";
import { Cell } from "./Cell";
import { GamePhase, MoveType } from "./enums";
import { Move } from "./Move";
import { Pawn } from "./pieces/Pawn";
import { Rook } from "./pieces/Rook";
import { Knight } from "./pieces/Knight";
import { Bishop } from "./pieces/Bishop";
import { Queen } from "./pieces/Queen";
import { King } from "./pieces/King";
import { PieceName } from "./pieces/types";

describe("Gameboard", () => {
  it("testClone", () => {
    const source = new Gameboard();
    source.resetGameboard();

    const clone = source.clone();

    expect(clone.getTiles().length).toBe(source.getTiles().length);
    expect(clone.getPieces().length).toBe(source.getPieces().length);

    // DEEP COPY TEST: no tile in clone is the same object as source
    for (const tileClone of clone.getTiles()) {
      for (const tileSource of source.getTiles()) {
        expect(tileClone).not.toBe(tileSource);
      }
    }

    for (const pieceClone of clone.getPieces()) {
      for (const pieceSource of source.getPieces()) {
        expect(pieceClone).not.toBe(pieceSource);
      }
    }

    // No piece in clone references a tile in source
    for (const pieceClone of clone.getPieces()) {
      for (const tileSource of source.getTiles()) {
        expect(pieceClone.ownerTile).not.toBe(tileSource);
      }
    }

    expect(source.getCurrentGamePhase()).toBe(clone.getCurrentGamePhase());
    expect(source.performedMoves).toBe(
      clone.performedMoves,
    );
  });

  it("testReturnPiecesByPlayerNumber1", () => {
    const source = new Gameboard();
    source.insertPieceToTile(new Pawn(1), new Cell(1, 1));
    source.insertPieceToTile(new Pawn(1), new Cell(2, 2));
    source.insertPieceToTile(new Pawn(2), new Cell(3, 3));

    expect(source.findPiecesOwnedByPlayer(1).length).toBe(2);
  });

  it("testGamePhase - opening", () => {
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

    expect(gameboard.getCurrentGamePhase()).toBe(GamePhase.OPENING);
  });

  it("tesGetTileAtPosition - row 1 col 2", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    const tile = gameboard.getTileAtPosition(1, 2)!;
    expect(tile.getRow()).toBe(1);
    expect(tile.getColumn()).toBe(2);
  });

  it("tesGetTileAtPosition2 - row 3 col 5", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    const tile = gameboard.getTileAtPosition(3, 5)!;
    expect(tile.getRow()).toBe(3);
    expect(tile.getColumn()).toBe(5);
  });

  it("tesGetTileAtPosition3 - row 8 col 8", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    const tile = gameboard.getTileAtPosition(8, 8)!;
    expect(tile.getRow()).toBe(8);
    expect(tile.getColumn()).toBe(8);
  });

  it("tesGetTileAtPosition4 - row 2 col 4", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    const tile = gameboard.getTileAtPosition(2, 4)!;
    expect(tile.getRow()).toBe(2);
    expect(tile.getColumn()).toBe(4);
  });

  it("tesGetTileAtPosition5 - row 7 col 3", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    const tile = gameboard.getTileAtPosition(7, 3)!;
    expect(tile.getRow()).toBe(7);
    expect(tile.getColumn()).toBe(3);
  });

  it("tesGetTileAtPosition6 - row 1 col 3", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    const tile = gameboard.getTileAtPosition(1, 3)!;
    expect(tile.getRow()).toBe(1);
    expect(tile.getColumn()).toBe(3);
  });

  it("tesGetTileAtPosition7 - row 3 col 8", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    const tile = gameboard.getTileAtPosition(3, 8)!;
    expect(tile.getRow()).toBe(3);
    expect(tile.getColumn()).toBe(8);
  });

  it("tesGetTileAtPosition8 - row 4 col 1", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    const tile = gameboard.getTileAtPosition(4, 1)!;
    expect(tile.getRow()).toBe(4);
    expect(tile.getColumn()).toBe(1);
  });

  it("tesGetTileAtPosition9 - row 1 col 1", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    const tile = gameboard.getTileAtPosition(1, 1)!;
    expect(tile.getRow()).toBe(1);
    expect(tile.getColumn()).toBe(1);
  });
});

describe("Gameboard — move tracking (lastMoveWasCapture / lastMovedPieceName)", () => {
  it("lastMoveWasCapture is false initially", () => {
    const gb = new Gameboard();
    expect(gb.lastMoveWasCapture).toBe(false);
  });

  it("lastMovedPieceName is undefined initially", () => {
    const gb = new Gameboard();
    expect(gb.lastMovedPieceName).toBeUndefined();
  });

  it("records a non-capture rook move", () => {
    const gb = new Gameboard();
    gb.insertPieceToTile(new Rook(1), new Cell(4, 4));
    gb.movePieceImmediately(
      new Move(new Cell(4, 4), new Cell(4, 5), 1, MoveType.REGULAR),
    );
    expect(gb.lastMoveWasCapture).toBe(false);
    expect(gb.lastMovedPieceName).toBe(PieceName.ROOK);
  });

  it("records a capture move", () => {
    const gb = new Gameboard();
    gb.insertPieceToTile(new Rook(1), new Cell(4, 4));
    gb.insertPieceToTile(new Pawn(2), new Cell(4, 5)); // enemy piece at target
    gb.movePieceImmediately(
      new Move(new Cell(4, 4), new Cell(4, 5), 1, MoveType.REGULAR),
    );
    expect(gb.lastMoveWasCapture).toBe(true);
    expect(gb.lastMovedPieceName).toBe(PieceName.ROOK);
  });

  it("records a pawn move (non-capture)", () => {
    const gb = new Gameboard();
    gb.insertPieceToTile(new Pawn(1), new Cell(6, 3));
    gb.movePieceImmediately(
      new Move(new Cell(6, 3), new Cell(5, 3), 1, MoveType.REGULAR),
    );
    expect(gb.lastMoveWasCapture).toBe(false);
    expect(gb.lastMovedPieceName).toBe(PieceName.PAWN);
  });

  it("en passant counts as a capture", () => {
    const gb = new Gameboard();
    gb.insertPieceToTile(new Pawn(1), new Cell(4, 4));
    gb.insertPieceToTile(new Pawn(2), new Cell(4, 5)); // captured pawn beside
    gb.movePieceImmediately(
      new Move(new Cell(4, 4), new Cell(3, 5), 1, MoveType.SPECIAL_EN_PASSANT),
    );
    expect(gb.lastMoveWasCapture).toBe(true);
  });

  it("resetGameboard clears both tracking fields", () => {
    const gb = new Gameboard();
    gb.insertPieceToTile(new Rook(1), new Cell(4, 4));
    gb.insertPieceToTile(new Pawn(2), new Cell(4, 5));
    gb.movePieceImmediately(
      new Move(new Cell(4, 4), new Cell(4, 5), 1, MoveType.REGULAR),
    );
    gb.resetGameboard();
    expect(gb.lastMoveWasCapture).toBe(false);
    expect(gb.lastMovedPieceName).toBeUndefined();
  });
});
