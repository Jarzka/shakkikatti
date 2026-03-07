import { describe, it, expect } from "vitest";
import { Gameboard } from "../Gameboard";
import { Cell } from "../Cell";
import { Move } from "../Move";
import { MoveType } from "../enums";
import { Pawn } from "./Pawn";
import { King } from "./King";
import { PieceStateName } from "./types";

describe("Pawn moves", () => {
  it("testWhitePawnMovementStart", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 7, 1);

    expect(pawn.findPossibleMoves(false).length).toBe(2);

    for (const move of pawn.findPossibleMoves(false)) {
      expect(move.target.row).toBeLessThan(pawn.ownerTile!.position.row);
      expect(move.target.column).toBe(pawn.ownerTile!.position.column);
    }
  });

  it("testBlackPawnMovementStart", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(2);
    gameboard.insertPieceToTile(pawn, 2, 1);

    expect(pawn.findPossibleMoves(false).length).toBe(2);

    for (const move of pawn.findPossibleMoves(false)) {
      expect(move.target.row).toBeGreaterThan(pawn.ownerTile!.position.row);
      expect(move.target.column).toBe(pawn.ownerTile!.position.column);
    }
  });

  it("testWhitePawnMovementStartBlockedByWhitePawn", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 7, 1);
    const pawn2 = new Pawn(1);
    gameboard.insertPieceToTile(pawn2, 6, 1);

    expect(pawn.findPossibleMoves(false).length).toBe(0);
  });

  it("testBlackPawnMovementStartBlockedByBlackPawn", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(2);
    gameboard.insertPieceToTile(pawn, 2, 1);
    const pawn2 = new Pawn(2);
    gameboard.insertPieceToTile(pawn2, 3, 1);

    expect(pawn.findPossibleMoves(false).length).toBe(0);
  });

  it("testWhitePawnMovementStartBlockedByBlackPawn", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 7, 1);
    const pawn2 = new Pawn(2);
    gameboard.insertPieceToTile(pawn2, 6, 1);

    expect(pawn.findPossibleMoves(false).length).toBe(0);
  });

  it("testWhitePawnMovementStartAttack", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 7, 3);
    const pawn2 = new Pawn(2);
    gameboard.insertPieceToTile(pawn2, 6, 2);
    const pawn3 = new Pawn(2);
    gameboard.insertPieceToTile(pawn3, 6, 4);

    expect(pawn.findPossibleMoves(false).length).toBe(4);
  });

  it("testBlackPawnMovementStartAttack", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(2);
    gameboard.insertPieceToTile(pawn, 2, 3);
    const pawn2 = new Pawn(1);
    gameboard.insertPieceToTile(pawn2, 3, 2);
    const pawn3 = new Pawn(1);
    gameboard.insertPieceToTile(pawn3, 3, 4);

    expect(pawn.findPossibleMoves(false).length).toBe(4);
  });

  it("testBlackPawnMovementStartAttack2", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(2);
    gameboard.insertPieceToTile(pawn, 2, 3);
    const pawn2 = new Pawn(1);
    gameboard.insertPieceToTile(pawn2, 3, 2);

    expect(pawn.findPossibleMoves(false).length).toBe(3);
  });

  it("testWhitePawnMovementMiddle", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 2, 4);

    expect(pawn.findPossibleMoves(false).length).toBe(1);

    for (const move of pawn.findPossibleMoves(false)) {
      expect(move.target.row).toBeLessThan(pawn.ownerTile!.position.row);
      expect(move.target.column).toBe(pawn.ownerTile!.position.column);
    }
  });

  it("testWhitePawnMovementMiddleBlockedByWhitePawn", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 4, 4);
    const pawn2 = new Pawn(1);
    gameboard.insertPieceToTile(pawn2, 3, 4);

    expect(pawn.findPossibleMoves(false).length).toBe(0);
  });

  it("testBlackPawnMovementKillWhiteKing", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 4, 4);
    const king = new King(1);
    gameboard.insertPieceToTile(king, 3, 3);
    const pawn2 = new Pawn(2);
    gameboard.insertPieceToTile(pawn2, 2, 2);

    expect(pawn2.findPossibleMoves(false).length).toBe(3);
  });

  it("testWhitePawnMovementMiddleBlockedByBlackPawn", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 4, 4);
    const pawn2 = new Pawn(2);
    gameboard.insertPieceToTile(pawn2, 3, 4);

    expect(pawn.findPossibleMoves(false).length).toBe(0);
  });

  it("testFindPiecesThatCanBeKilledByThisPiece", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 7, 3);
    const pawn2 = new Pawn(2);
    gameboard.insertPieceToTile(pawn2, 6, 2);
    const pawn3 = new Pawn(2);
    gameboard.insertPieceToTile(pawn3, 6, 4);

    expect(pawn.findPiecesThatCanBeKilledByThisPiece(false).length).toBe(2);
  });

  it("testFindPiecesThatCanBeKilledByThisPiece2", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 7, 2);
    const pawn2 = new Pawn(2);
    gameboard.insertPieceToTile(pawn2, 6, 2);
    const pawn3 = new Pawn(2);
    gameboard.insertPieceToTile(pawn3, 6, 4);

    expect(pawn2.findPiecesThatCanBeKilledByThisPiece(true).length).toBe(0);
  });

  it("testFindPiecesThatCanKillThisPiece", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 7, 3);
    const pawn2 = new Pawn(2);
    gameboard.insertPieceToTile(pawn2, 6, 2);
    const pawn3 = new Pawn(2);
    gameboard.insertPieceToTile(pawn3, 6, 4);

    expect(pawn2.findPiecesThatCanKillThisPiece(false).length).toBe(1);
    expect(pawn2.findPiecesThatCanKillThisPiece(false)[0]).toBe(pawn);
  });

  it("testWhitePawnMovementWhileWhiteKingIsInCheck", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 4, 4);
    const king = new King(1);
    gameboard.insertPieceToTile(king, 3, 3);
    const pawn2 = new Pawn(2);
    gameboard.insertPieceToTile(pawn2, 2, 2);

    expect(pawn.findPossibleMoves(true).length).toBe(0);
  });

  it("testBlackPawnMovement", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 2, 7);

    expect(pawn.findPossibleMoves(false).length).toBe(1);
  });

  it("testFindProtectors", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 7, 3);
    const pawn2 = new Pawn(1);
    gameboard.insertPieceToTile(pawn2, 6, 2);
    const pawn3 = new Pawn(1);
    gameboard.insertPieceToTile(pawn3, 6, 4);

    expect(pawn.findProtectors().length).toBe(0);
  });

  it("testFindProtectors2", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(1);
    gameboard.insertPieceToTile(pawn, 7, 3);
    const pawn2 = new Pawn(1);
    gameboard.insertPieceToTile(pawn2, 6, 2);
    const pawn3 = new Pawn(1);
    gameboard.insertPieceToTile(pawn3, 6, 4);

    expect(pawn2.findProtectors().length).toBe(1);
  });
});

describe("Pawn smoke tests", () => {
  it("testPawnConstructorOwnerPlayer - invalid 9", () => {
    expect(() => new Pawn(9)).toThrow();
  });

  it("testPawnConstructorOwnerPlayer - invalid 0", () => {
    expect(() => new Pawn(0)).toThrow();
  });

  it("testPawnConstructorOwnerPlayer - invalid -2", () => {
    expect(() => new Pawn(-2)).toThrow();
  });

  it("testPawnClone", () => {
    const gameboard = new Gameboard();
    const pawnSource = new Pawn(1);
    gameboard.insertPieceToTile(pawnSource, 1, 1);

    const pawnClone = pawnSource.clone();

    expect(pawnSource.ownerPlayerNumber).toBe(
      pawnClone.ownerPlayerNumber,
    );
    // Clone does not copy ownerTile (it gets set when inserted into a gameboard)
    expect(pawnClone.ownerTile).toBeUndefined();
  });

  it("testChangeStateToMove", () => {
    const gameboard = new Gameboard();
    const pawn = new Pawn(2);
    gameboard.insertPieceToTile(pawn, 2, 1);
    pawn.moveAnimated(new Cell(3, 1));

    expect(pawn.stateName).toBe(PieceStateName.MOVING);
  });
});

describe("Pawn – en passant", () => {
  it("white pawn can capture en passant to the left after black double-step", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(1), 8, 5);
    gameboard.insertPieceToTile(new King(2), 1, 5);

    const whitePawn = new Pawn(1);
    gameboard.insertPieceToTile(whitePawn, 4, 5);

    // Simulate black pawn double-stepping from row 2 to row 4
    const blackPawn = new Pawn(2);
    gameboard.insertPieceToTile(blackPawn, 2, 4);
    gameboard.movePieceImmediately(new Move(new Cell(2, 4), new Cell(4, 4), 2));

    const epMoves = whitePawn.findPossibleMoves(false).filter(
      (m) => m.type === MoveType.SPECIAL_EN_PASSANT
    );

    expect(epMoves).toHaveLength(1);
    expect(epMoves[0].target.row).toBe(3);
    expect(epMoves[0].target.column).toBe(4);
  });

  it("white pawn can capture en passant to the right after black double-step", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(1), 8, 5);
    gameboard.insertPieceToTile(new King(2), 1, 5);

    const whitePawn = new Pawn(1);
    gameboard.insertPieceToTile(whitePawn, 4, 5);

    const blackPawn = new Pawn(2);
    gameboard.insertPieceToTile(blackPawn, 2, 6);
    gameboard.movePieceImmediately(new Move(new Cell(2, 6), new Cell(4, 6), 2));

    const epMoves = whitePawn.findPossibleMoves(false).filter(
      (m) => m.type === MoveType.SPECIAL_EN_PASSANT
    );

    expect(epMoves).toHaveLength(1);
    expect(epMoves[0].target.row).toBe(3);
    expect(epMoves[0].target.column).toBe(6);
  });

  it("black pawn can capture en passant after white double-step", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(1), 8, 5);
    gameboard.insertPieceToTile(new King(2), 1, 5);

    const blackPawn = new Pawn(2);
    gameboard.insertPieceToTile(blackPawn, 5, 4);

    const whitePawn = new Pawn(1);
    gameboard.insertPieceToTile(whitePawn, 7, 5);
    gameboard.movePieceImmediately(new Move(new Cell(7, 5), new Cell(5, 5), 1));

    const epMoves = blackPawn.findPossibleMoves(false).filter(
      (m) => m.type === MoveType.SPECIAL_EN_PASSANT
    );

    expect(epMoves).toHaveLength(1);
    expect(epMoves[0].target.row).toBe(6);
    expect(epMoves[0].target.column).toBe(5);
  });

  it("no en passant when double-step was not the last move", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(1), 8, 5);
    gameboard.insertPieceToTile(new King(2), 1, 5);

    const whitePawn = new Pawn(1);
    gameboard.insertPieceToTile(whitePawn, 4, 5);

    // Black pawn double-steps
    const blackPawn = new Pawn(2);
    gameboard.insertPieceToTile(blackPawn, 2, 6);
    gameboard.movePieceImmediately(new Move(new Cell(2, 6), new Cell(4, 6), 2));
    // Then another move happens (white king moves), ending the en passant window
    gameboard.movePieceImmediately(new Move(new Cell(8, 5), new Cell(8, 4), 1));

    const epMoves = whitePawn.findPossibleMoves(false).filter(
      (m) => m.type === MoveType.SPECIAL_EN_PASSANT
    );
    expect(epMoves).toHaveLength(0);
  });

  it("en passant move removes the captured pawn from the board", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(1), 8, 5);
    gameboard.insertPieceToTile(new King(2), 1, 5);

    const whitePawn = new Pawn(1);
    gameboard.insertPieceToTile(whitePawn, 4, 5);

    const blackPawn = new Pawn(2);
    gameboard.insertPieceToTile(blackPawn, 2, 6);
    gameboard.movePieceImmediately(new Move(new Cell(2, 6), new Cell(4, 6), 2));

    const epMoves = whitePawn.findPossibleMoves(false).filter(
      (m) => m.type === MoveType.SPECIAL_EN_PASSANT
    );
    expect(epMoves).toHaveLength(1);
    gameboard.movePieceImmediately(epMoves[0]);

    // White pawn should be at (3, 6)
    expect(gameboard.getTileAtPosition(3, 6)?.piece).toBe(whitePawn);
    // Black pawn should be removed from (4, 6)
    expect(gameboard.getTileAtPosition(4, 6)?.piece).toBeUndefined();
  });
});
