import { describe, it, expect } from "vitest";
import { Gameboard } from "../Gameboard";
import { King } from "./King";
import { Knight } from "./Knight";
import { Pawn } from "./Pawn";
import { Rook } from "./Rook";
import { MoveType } from "../enums";

describe("King moves", () => {
  it("testWhiteKingMovement - center", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);

    expect(king.findPossibleMoves(true).length).toBe(8);
  });

  it("testWhiteKingMovement2 - bottom-left with own pawn", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 1);
    gameboard.insertPieceToTile(new Pawn(1), 7, 1);

    expect(king.findPossibleMoves(true).length).toBe(2);
  });

  it("testWhiteKingMovementBlockedByWhitePawn", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);
    gameboard.insertPieceToTile(new Pawn(1), 3, 3);

    expect(king.findPossibleMoves(true).length).toBe(7);
  });

  it("testWhiteKingCheckedByBlackPawn", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);
    gameboard.insertPieceToTile(new Pawn(2), 3, 3);

    expect(king.isInCheck()).toBe(true);
  });

  it("testWhiteKingCheckedByBlackPawn2", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);
    gameboard.insertPieceToTile(new Pawn(2), 3, 5);

    expect(king.isInCheck()).toBe(true);
  });

  it("testWhiteKingIsNotInCheck - pawn directly above", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);
    gameboard.insertPieceToTile(new Pawn(2), 3, 4);

    expect(king.isInCheck()).toBe(false);
  });

  it("testWhiteKingIsNotInCheck2 - own pawn diagonal", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);
    gameboard.insertPieceToTile(new Pawn(1), 3, 3);

    expect(king.isInCheck()).toBe(false);
  });

  it("testWhiteKingMovementBlockedByBlackPawn - far pawn", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);
    gameboard.insertPieceToTile(new Pawn(2), 3, 2);

    expect(king.findPossibleMoves(true).length).toBe(7);
  });

  it("testWhiteKingMovementBlockedByBlackPawn2 - pawn above captures tile", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);
    gameboard.insertPieceToTile(new Pawn(2), 3, 4);

    expect(king.findPossibleMoves(true).length).toBe(6);
  });

  it("testWhiteKingMovementBlockedByBlackKing", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);
    const king2 = new King(2);
    gameboard.insertPieceToTile(king2, 2, 4);

    expect(king.findPossibleMoves(true).length).toBe(5);
  });

  it("testWhiteKingMovementBlockedByBlackKingExcludeCheck", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 4, 4);
    const king2 = new King(2);
    gameboard.insertPieceToTile(king2, 2, 4);

    expect(king.findPossibleMoves(false).length).toBe(8);
  });

  it("testWhiteKingIsInCheckMate", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 8);
    gameboard.insertPieceToTile(new Pawn(2), 7, 7);
    gameboard.insertPieceToTile(new Pawn(2), 6, 7);
    gameboard.insertPieceToTile(new Pawn(2), 7, 6);
    gameboard.insertPieceToTile(new Pawn(2), 6, 6);
    // distant white pawn to prevent stalemate detection issues
    gameboard.insertPieceToTile(new Pawn(1), 2, 2);

    expect(king.isInCheckMate()).toBe(true);
  });

  it("testWhiteKingIsNotInCheckMate", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 8);
    gameboard.insertPieceToTile(new Pawn(2), 7, 7);
    gameboard.insertPieceToTile(new Pawn(2), 6, 7);
    gameboard.insertPieceToTile(new Pawn(2), 7, 6);

    expect(king.isInCheckMate()).toBe(false);
  });

  it("testWhiteKingIsNotInCheckMate2", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 8);
    gameboard.insertPieceToTile(new Pawn(2), 7, 7);
    gameboard.insertPieceToTile(new Pawn(2), 6, 6);
    gameboard.insertPieceToTile(new Pawn(1), 8, 6);

    expect(king.isInCheckMate()).toBe(false);
  });

  // --- Castling ---

  it("castling - king-side available when path clear and pieces unmoved", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 5);
    gameboard.insertPieceToTile(new Rook(1), 8, 8);

    const castlingMoves = king
      .findPossibleMoves(true)
      .filter((m) => m.type === MoveType.SPECIAL_CASTLING);
    expect(castlingMoves.length).toBe(1);
    expect(castlingMoves[0].target.column).toBe(7);
  });

  it("castling - queen-side available when path clear and pieces unmoved", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 5);
    gameboard.insertPieceToTile(new Rook(1), 8, 1);

    const castlingMoves = king
      .findPossibleMoves(true)
      .filter((m) => m.type === MoveType.SPECIAL_CASTLING);
    expect(castlingMoves.length).toBe(1);
    expect(castlingMoves[0].target.column).toBe(3);
  });

  it("castling - both sides available when both rooks present and path clear", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 5);
    gameboard.insertPieceToTile(new Rook(1), 8, 1);
    gameboard.insertPieceToTile(new Rook(1), 8, 8);

    const castlingMoves = king
      .findPossibleMoves(true)
      .filter((m) => m.type === MoveType.SPECIAL_CASTLING);
    expect(castlingMoves.length).toBe(2);
  });

  it("castling - not available when king has already moved", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 5);
    gameboard.insertPieceToTile(new Rook(1), 8, 8);
    king.hasMoved = true;

    const castlingMoves = king
      .findPossibleMoves(true)
      .filter((m) => m.type === MoveType.SPECIAL_CASTLING);
    expect(castlingMoves.length).toBe(0);
  });

  it("castling - not available when rook has already moved", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    const rook = new Rook(1);
    gameboard.insertPieceToTile(king, 8, 5);
    gameboard.insertPieceToTile(rook, 8, 8);
    rook.hasMoved = true;

    const castlingMoves = king
      .findPossibleMoves(true)
      .filter((m) => m.type === MoveType.SPECIAL_CASTLING);
    expect(castlingMoves.length).toBe(0);
  });

  it("castling - not available when path is blocked", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 5);
    gameboard.insertPieceToTile(new Rook(1), 8, 8);
    gameboard.insertPieceToTile(new Pawn(1), 8, 6); // blocks the path

    const castlingMoves = king
      .findPossibleMoves(true)
      .filter((m) => m.type === MoveType.SPECIAL_CASTLING);
    expect(castlingMoves.length).toBe(0);
  });

  it("castling - rook and king move to correct squares after execution", () => {
    const gameboard = new Gameboard();
    const king = new King(1);
    gameboard.insertPieceToTile(king, 8, 5);
    gameboard.insertPieceToTile(new Rook(1), 8, 8);

    const castlingMoves = king
      .findPossibleMoves(true)
      .filter((m) => m.type === MoveType.SPECIAL_CASTLING);
    expect(castlingMoves.length).toBe(1);

    gameboard.movePieceImmediately(castlingMoves[0]);

    // King → col 7, rook → col 6
    expect(gameboard.getTileAtPosition(8, 7)?.piece?.name).toBe("KING");
    expect(gameboard.getTileAtPosition(8, 6)?.piece?.name).toBe("ROOK");
    expect(gameboard.getTileAtPosition(8, 5)?.hasPiece()).toBe(false);
    expect(gameboard.getTileAtPosition(8, 8)?.hasPiece()).toBe(false);
  });

  it("smothered mate - black king checkmated by white knight on f7", () => {
    // Classic smothered mate position (board uses 1-indexed rows/columns,
    // row 1 = rank 8, col 1 = file a):
    //
    //   h8 (row 1, col 8) = black king
    //   g8 (row 1, col 7) = black rook  — blocks g8 escape
    //   g7 (row 2, col 7) = black pawn  — blocks g7 escape
    //   h7 (row 2, col 8) = black pawn  — blocks h7 escape
    //   f7 (row 2, col 6) = white knight — delivers check via [-1,+2] offset
    //   e1 (row 8, col 5) = white king   — required for legal move filtering

    const gameboard = new Gameboard();

    // White pieces
    const whiteKing = new King(1);
    gameboard.insertPieceToTile(whiteKing, 8, 5); // e1

    const whiteKnight = new Knight(1);
    gameboard.insertPieceToTile(whiteKnight, 2, 6); // f7

    // Black pieces
    const blackKing = new King(2);
    gameboard.insertPieceToTile(blackKing, 1, 8); // h8

    gameboard.insertPieceToTile(new Rook(2), 1, 7);  // g8 — smothers g-file escape
    gameboard.insertPieceToTile(new Pawn(2), 2, 7);  // g7 — smothers g7 escape
    gameboard.insertPieceToTile(new Pawn(2), 2, 8);  // h7 — smothers h7 escape

    // Knight on f7 attacks h8 via offset (-1, +2): row 2-1=1, col 6+2=8 ✓
    expect(blackKing.isInCheck()).toBe(true);
    expect(blackKing.isInCheckMate()).toBe(true);
  });
});