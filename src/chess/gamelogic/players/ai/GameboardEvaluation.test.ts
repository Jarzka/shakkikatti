import { describe, it, expect } from "vitest";
import { Gameboard } from "../../Gameboard";
import { Pawn } from "../../pieces/Pawn";
import { Knight } from "../../pieces/Knight";
import { Bishop } from "../../pieces/Bishop";
import { Queen } from "../../pieces/Queen";
import { Rook } from "../../pieces/Rook";
import { King } from "../../pieces/King";
import { Cell } from "../../Cell";
import { Move } from "../../Move";

describe("Gameboard evaluation", () => {
  it("testEvaluationWhiteMaterialAdvantage", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Queen(1), 5, 5);
    gameboard.insertPieceToTile(new Pawn(2), 6, 5);

    expect(gameboard.evaluateTotalPositionPoints()).toBeGreaterThan(0);
  });

  it("testEvaluationBlackMaterialAdvantage", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Queen(2), 5, 5);
    gameboard.insertPieceToTile(new Pawn(1), 6, 5);

    expect(gameboard.evaluateTotalPositionPoints()).toBeLessThan(0);
  });

  it("testEvaluationEqual", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 2, 1);
    gameboard.insertPieceToTile(new Pawn(2), 7, 1);

    expect(Math.trunc(gameboard.evaluateTotalPositionPoints())).toBe(0);
  });

  it("testEvaluationEqual2 - starting position", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();

    expect(Math.trunc(gameboard.evaluateTotalPositionPoints())).toBe(0);
  });

  it("testEvaluationEqual3 - starting position + both knights moved", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    gameboard.movePieceImmediately(new Move(new Cell(8, 7), new Cell(6, 6)));
    gameboard.movePieceImmediately(new Move(new Cell(1, 7), new Cell(3, 6)));

    // Math.round can produce -0 in JS; use + 0 to normalize
    expect(Math.round(gameboard.evaluateTotalPositionPoints()) + 0).toBe(0);
  });

  it("testEvaluationBlackMaterialAdvantage2 - extra black knight", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 2, 1);
    gameboard.insertPieceToTile(new Pawn(2), 7, 1);
    // Knight placed at (1,8) — not reachable by the white pawn at (2,1),
    // so the material deficit (-3) is unambiguous and not offset by a free capture.
    gameboard.insertPieceToTile(new Knight(2), 1, 8);

    expect(gameboard.evaluateTotalPositionPoints()).toBeLessThan(0);
  });

  it("testEvaluationBlackProtectionAdvantage", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(2), 2, 1);
    gameboard.insertPieceToTile(new Knight(2), 3, 2);
    gameboard.insertPieceToTile(new Pawn(1), 7, 1);
    gameboard.insertPieceToTile(new Knight(1), 7, 2);

    expect(gameboard.evaluateTotalPositionPoints()).toBeLessThan(0);
  });

  it("testEvaluationWhiteMaterialAdvantage2 - white queen vs black knight", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 2, 1);
    gameboard.insertPieceToTile(new Queen(1), 8, 2);
    gameboard.insertPieceToTile(new Pawn(2), 7, 1);
    gameboard.insertPieceToTile(new Knight(2), 1, 2);

    expect(gameboard.evaluateTotalPositionPoints()).toBeGreaterThan(0);
  });

  it("testEvaluationWhiteAttackAdvantage", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Bishop(2), 2, 2);
    gameboard.insertPieceToTile(new Knight(1), 3, 4);

    expect(gameboard.evaluateTotalPositionPoints()).toBeGreaterThan(0);
  });

  it("testEvaluationBlackAttackAdvantage", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Bishop(1), 2, 2);
    gameboard.insertPieceToTile(new Knight(2), 3, 4);

    expect(gameboard.evaluateTotalPositionPoints()).toBeLessThan(0);
  });

  it("testHangingTargetScoresHigherThanDefendedTarget", () => {
    // Board A: white knight attacks a hanging (undefended) black bishop
    const boardA = new Gameboard();
    boardA.insertPieceToTile(new Knight(1), 3, 4);
    boardA.insertPieceToTile(new Bishop(2), 2, 2);
    const scoreA = boardA.evaluateAttacks();

    // Board B: same positions, but the bishop is now protected by a black knight at (4,3)
    const boardB = new Gameboard();
    boardB.insertPieceToTile(new Knight(1), 3, 4);
    boardB.insertPieceToTile(new Bishop(2), 2, 2);
    boardB.insertPieceToTile(new Knight(2), 4, 3);
    const scoreB = boardB.evaluateAttacks();

    // A hanging target gives a much larger attack bonus than a defended target
    expect(scoreA).toBeGreaterThan(scoreB);
  });

  it("testFavorableExchangeBonus", () => {
    // White pawn (value 1) can capture a black knight (value 3): net gain +2
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 3, 3);
    gameboard.insertPieceToTile(new Knight(2), 2, 4);

    expect(gameboard.evaluateFavorableExchanges()).toBeGreaterThan(0);
  });

  it("testMaterialDominanceBonus", () => {
    // White: rook (5) + pawn (1) = 6, Black: pawn (1), surplus = 5 which is >= 3 threshold
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Rook(1), 5, 1);
    gameboard.insertPieceToTile(new Pawn(1), 5, 2);
    gameboard.insertPieceToTile(new Pawn(2), 5, 8);

    expect(gameboard.evaluateMaterialDominance()).toBeGreaterThan(0);
  });

  it("testEvaluateCheck - white king in check gives negative score", () => {
    // Black rook at (5,1) has clear line of sight to white king at (5,5)
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(1), 5, 5);
    gameboard.insertPieceToTile(new Rook(2), 5, 1);

    expect(gameboard.evaluateCheck()).toBeLessThan(0);
  });

  it("testEvaluateCheck - black king in check gives positive score", () => {
    // White rook at (5,1) has clear line of sight to black king at (5,5)
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(2), 5, 5);
    gameboard.insertPieceToTile(new Rook(1), 5, 1);

    expect(gameboard.evaluateCheck()).toBeGreaterThan(0);
  });

  it("testEvaluateDoubledPawns - doubled pawns score negatively for white", () => {
    // Two white pawns in the same column are doubled; one black pawn not doubled
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 4, 3);
    gameboard.insertPieceToTile(new Pawn(1), 5, 3);
    gameboard.insertPieceToTile(new Pawn(2), 4, 6);

    expect(gameboard.evaluateDoubledPawns()).toBeLessThan(0);
  });

  it("testEvaluateIsolatedPawns - isolated pawn scores negatively", () => {
    // White pawn at (5,5) with no adjacent friendly pieces is isolated
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 5, 5);

    expect(gameboard.evaluateIsolatedPawns()).toBeLessThan(0);
  });

  it("testEvaluateBishopPair - two bishops gives white a bonus", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Bishop(1), 5, 1);
    gameboard.insertPieceToTile(new Bishop(1), 5, 8);

    expect(gameboard.evaluateBishopPair()).toBeGreaterThan(0);
  });

  it("testEvaluateBishopPair - two black bishops gives black a bonus", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Bishop(2), 5, 1);
    gameboard.insertPieceToTile(new Bishop(2), 5, 8);

    expect(gameboard.evaluateBishopPair()).toBeLessThan(0);
  });

  // ---- evaluateDoubledPawns (loop-bound bug fix) ----

  it("testEvaluateDoubledPawns - h-column doubled pawns penalised", () => {
    // Two white pawns on the h-column (column 8) must still receive the doubled-pawn penalty.
    // Before the loop-bound fix the h-column was silently skipped.
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 4, 8);
    gameboard.insertPieceToTile(new Pawn(1), 5, 8);

    expect(gameboard.evaluateDoubledPawns()).toBeLessThan(0);
  });

  it("testEvaluateDoubledPawns - a-column doubled pawns penalised", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 4, 1);
    gameboard.insertPieceToTile(new Pawn(1), 5, 1);

    expect(gameboard.evaluateDoubledPawns()).toBeLessThan(0);
  });

  it("testEvaluateDoubledPawns - single pawn per column has no penalty", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 4, 1);
    gameboard.insertPieceToTile(new Pawn(1), 4, 2);

    expect(gameboard.evaluateDoubledPawns()).toBe(0);
  });

  it("testEvaluateDoubledPawns - black doubled pawns score positively (black advantage penalised)", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(2), 4, 3);
    gameboard.insertPieceToTile(new Pawn(2), 5, 3);

    // Black doubled = positive score because the convention is > 0 = white advantage
    expect(gameboard.evaluateDoubledPawns()).toBeGreaterThan(0);
  });

  // ---- evaluateAdvancedPawns (very-advanced pawn bonus calibration) ----

  it("testEvaluateVeryAdvancedPawns - near-promotion pawn earns more bonus than mid-board pawn", () => {
    const boardNearPromotion = new Gameboard();
    boardNearPromotion.insertPieceToTile(new Pawn(1), 2, 1); // row 2 = one step from promotion

    const boardMidBoard = new Gameboard();
    boardMidBoard.insertPieceToTile(new Pawn(1), 5, 1); // normal advanced pawn

    expect(boardNearPromotion.evaluateAdvancedPawns()).toBeGreaterThan(
      boardMidBoard.evaluateAdvancedPawns(),
    );
  });

  it("testEvaluateVeryAdvancedPawns - black near-promotion pawn is negative", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(2), 7, 1); // row 7 = one step from black promotion

    expect(gameboard.evaluateAdvancedPawns()).toBeLessThan(0);
  });

  // ---- evaluatePassedPawns ----

  it("testEvaluatePassedPawns - isolated white pawn with no blocking opponent pawn is passed", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 5, 4); // no black pawns anywhere near

    expect(gameboard.evaluatePassedPawns()).toBeGreaterThan(0);
  });

  it("testEvaluatePassedPawns - black pawn directly in front of white pawn blocks it", () => {
    // Black pawn at (4, 4) is in front of white pawn at (5, 4) on the same column.
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 5, 4);
    gameboard.insertPieceToTile(new Pawn(2), 4, 4);

    expect(gameboard.evaluatePassedPawns()).toBe(0);
  });

  it("testEvaluatePassedPawns - black pawn on adjacent column in front blocks white pawn", () => {
    // Black pawn at (4, 5) is one column away and ahead of white pawn at (5, 4).
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 5, 4);
    gameboard.insertPieceToTile(new Pawn(2), 4, 5);

    expect(gameboard.evaluatePassedPawns()).toBe(0);
  });

  it("testEvaluatePassedPawns - black pawn behind white pawn does not block it", () => {
    // White at (5,4) advances toward row 1; black at (6,4) advances toward row 8.
    // Each is "behind" the other relative to their own advancing direction, so
    // neither blocks the other. The combined score should equal the sum of the
    // individual passed-pawn scores, proving independence.
    const boardWhiteOnly = new Gameboard();
    boardWhiteOnly.insertPieceToTile(new Pawn(1), 5, 4);

    const boardBlackOnly = new Gameboard();
    boardBlackOnly.insertPieceToTile(new Pawn(2), 6, 4);

    const boardBoth = new Gameboard();
    boardBoth.insertPieceToTile(new Pawn(1), 5, 4);
    boardBoth.insertPieceToTile(new Pawn(2), 6, 4);

    const expectedCombined =
      boardWhiteOnly.evaluatePassedPawns() + boardBlackOnly.evaluatePassedPawns();
    expect(boardBoth.evaluatePassedPawns()).toBeCloseTo(expectedCombined, 5);
  });

  it("testEvaluatePassedPawns - more advanced passed pawn scores more than a less advanced one", () => {
    const boardAdvanced = new Gameboard();
    boardAdvanced.insertPieceToTile(new Pawn(1), 2, 4); // nearly promoting

    const boardNormal = new Gameboard();
    boardNormal.insertPieceToTile(new Pawn(1), 6, 4); // just started

    expect(boardAdvanced.evaluatePassedPawns()).toBeGreaterThan(
      boardNormal.evaluatePassedPawns(),
    );
  });

  it("testEvaluatePassedPawns - symmetric position scores close to zero", () => {
    // White passed pawn at row 5 and black passed pawn at symmetric row 4 should roughly cancel.
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 5, 2);
    gameboard.insertPieceToTile(new Pawn(2), 4, 5);

    // Both are passed and equally advanced from their own baselines, so the sum should be ~0.
    expect(Math.abs(gameboard.evaluatePassedPawns())).toBeLessThan(0.1);
  });

  // ---- evaluateRooksOnOpenColumns ----

  it("testEvaluateRooksOnOpenColumns - rook on open column earns a bonus", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Rook(1), 5, 1); // column 1 has no pawns

    expect(gameboard.evaluateRooksOnOpenColumns()).toBeGreaterThan(0);
  });

  it("testEvaluateRooksOnOpenColumns - rook on semi-open column earns a smaller bonus", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Rook(1), 5, 1);
    gameboard.insertPieceToTile(new Pawn(2), 2, 1); // enemy pawn, no friendly pawn → semi-open

    const semiOpenScore = gameboard.evaluateRooksOnOpenColumns();

    const boardOpen = new Gameboard();
    boardOpen.insertPieceToTile(new Rook(1), 5, 1); // fully open
    const openScore = boardOpen.evaluateRooksOnOpenColumns();

    expect(semiOpenScore).toBeGreaterThan(0);
    expect(openScore).toBeGreaterThan(semiOpenScore);
  });

  it("testEvaluateRooksOnOpenColumns - rook blocked by own pawn gets no bonus", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Rook(1), 5, 1);
    gameboard.insertPieceToTile(new Pawn(1), 6, 1); // friendly pawn on same column

    expect(gameboard.evaluateRooksOnOpenColumns()).toBe(0);
  });

  it("testEvaluateRooksOnOpenColumns - black rook on open column scores negatively", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Rook(2), 5, 1);

    expect(gameboard.evaluateRooksOnOpenColumns()).toBeLessThan(0);
  });

  it("testEvaluateRooksOnOpenColumns - equal open-column rooks cancel each other", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Rook(1), 5, 1);
    gameboard.insertPieceToTile(new Rook(2), 3, 8);

    expect(gameboard.evaluateRooksOnOpenColumns()).toBe(0);
  });

  // ---- evaluatePieceSquareTables ----

  it("testEvaluatePST - white knight in centre scores better than in a corner", () => {
    const boardCenter = new Gameboard();
    boardCenter.insertPieceToTile(new Knight(1), 4, 4); // near centre

    const boardCorner = new Gameboard();
    boardCorner.insertPieceToTile(new Knight(1), 8, 1); // corner

    expect(boardCenter.evaluatePieceSquareTables()).toBeGreaterThan(
      boardCorner.evaluatePieceSquareTables(),
    );
  });

  it("testEvaluatePST - black knight in centre scores more negatively than in a corner", () => {
    const boardCenter = new Gameboard();
    boardCenter.insertPieceToTile(new Knight(2), 4, 4);

    const boardCorner = new Gameboard();
    boardCorner.insertPieceToTile(new Knight(2), 1, 1);

    // Black advantage = more negative
    expect(boardCenter.evaluatePieceSquareTables()).toBeLessThan(
      boardCorner.evaluatePieceSquareTables(),
    );
  });

  it("testEvaluatePST - symmetric knights cancel to zero", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Knight(1), 5, 4); // white knight
    gameboard.insertPieceToTile(new Knight(2), 4, 5); // mirror position for black

    // Should be 0: both knights are at their respective PST[3][3] = 0.20 → cancel
    expect(gameboard.evaluatePieceSquareTables()).toBeCloseTo(0, 5);
  });

  it("testEvaluatePST - bishop on long diagonal scores better than on back rank", () => {
    const boardDiag = new Gameboard();
    boardDiag.insertPieceToTile(new Bishop(1), 3, 3); // central diagonal

    const boardBack = new Gameboard();
    boardBack.insertPieceToTile(new Bishop(1), 8, 1); // back-rank corner

    expect(boardDiag.evaluatePieceSquareTables()).toBeGreaterThan(
      boardBack.evaluatePieceSquareTables(),
    );
  });

  // ---- evaluateGamePhases — opening penalties & development bonus ----

  it("testEvaluateGamePhases - early rook move is penalised in opening", () => {
    // resetGameboard gives 32 pieces, keeping the phase as OPENING (not ENDGAME).
    // First move the knight at (8,7) to open a path, then slide the rook into (8,7).
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    gameboard.movePieceImmediately(new Move(new Cell(8, 7), new Cell(6, 6))); // clear path for rook

    const scoreBefore = gameboard.evaluateGamePhases(); // rook at (8,8) still unmoved
    gameboard.movePieceImmediately(new Move(new Cell(8, 8), new Cell(8, 7))); // rook moves in
    const scoreAfter = gameboard.evaluateGamePhases();

    expect(scoreAfter).toBeLessThan(scoreBefore);
  });

  it("testEvaluateGamePhases - knight development gives a bonus in opening", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();

    const scoreBefore = gameboard.evaluateGamePhases();
    // Move white knight out
    gameboard.movePieceImmediately(new Move(new Cell(8, 7), new Cell(6, 6)));
    const scoreAfter = gameboard.evaluateGamePhases();

    expect(scoreAfter).toBeGreaterThan(scoreBefore);
  });

  it("testEvaluateGamePhases - equal knight development is symmetric", () => {
    const gameboard = new Gameboard();
    gameboard.resetGameboard();
    gameboard.movePieceImmediately(new Move(new Cell(8, 7), new Cell(6, 6))); // white knight
    gameboard.movePieceImmediately(new Move(new Cell(1, 7), new Cell(3, 6))); // black knight

    expect(Math.round(gameboard.evaluateGamePhases()) + 0).toBe(0);
  });

  // ---- evaluateCheck (reduced bonus 0.3) ----

  it("testEvaluateCheck - check bonus is smaller than a minor piece threat", () => {
    // A check bonus should be less than the attack bonus for threatening a hanging minor piece.
    const boardCheck = new Gameboard();
    boardCheck.insertPieceToTile(new King(1), 5, 5);
    boardCheck.insertPieceToTile(new Rook(2), 5, 1);
    const checkScore = Math.abs(boardCheck.evaluateCheck());

    // Threatening a hanging knight (value 3) with a safe attacker → 3 * 0.95 = 2.85
    const boardThreaten = new Gameboard();
    boardThreaten.insertPieceToTile(new Knight(2), 2, 2);
    boardThreaten.insertPieceToTile(new Bishop(1), 3, 4);
    const threatScore = Math.abs(boardThreaten.evaluateAttacks());

    expect(checkScore).toBeLessThan(threatScore);
  });

  // ---- evaluateCheckmate ----

  it("testEvaluateCheckmate - white king in checkmate gives large negative score", () => {
    // White king at (8,8) is checkmated by two black rooks on rows 7 and 8.
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(1), 8, 8);
    gameboard.insertPieceToTile(new Rook(2), 8, 1);
    gameboard.insertPieceToTile(new Rook(2), 7, 1);

    expect(gameboard.evaluateCheckmate()).toBeLessThan(-1000);
  });

  it("testEvaluateCheckmate - black king in checkmate gives large positive score", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(2), 1, 8);
    gameboard.insertPieceToTile(new Rook(1), 1, 1);
    gameboard.insertPieceToTile(new Rook(1), 2, 1);

    expect(gameboard.evaluateCheckmate()).toBeGreaterThan(1000);
  });

  it("testEvaluateCheckmate - no checkmate returns zero", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(1), 5, 5);
    gameboard.insertPieceToTile(new King(2), 1, 1);

    expect(gameboard.evaluateCheckmate()).toBe(0);
  });

  // ---- evaluateKingProtection ----

  it("testEvaluateKingProtection - king surrounded by friendly pieces scores higher than exposed king", () => {
    const boardProtected = new Gameboard();
    boardProtected.insertPieceToTile(new King(1), 8, 5);
    boardProtected.insertPieceToTile(new Pawn(1), 7, 4);
    boardProtected.insertPieceToTile(new Pawn(1), 7, 5);
    boardProtected.insertPieceToTile(new Pawn(1), 7, 6);

    const boardExposed = new Gameboard();
    boardExposed.insertPieceToTile(new King(1), 5, 5); // no adjacent friendly pieces

    expect(boardProtected.evaluateKingProtection()).toBeGreaterThan(
      boardExposed.evaluateKingProtection(),
    );
  });

  it("testEvaluateKingProtection - black king with friendly pieces scores more negatively", () => {
    const boardProtected = new Gameboard();
    boardProtected.insertPieceToTile(new King(2), 1, 5);
    boardProtected.insertPieceToTile(new Pawn(2), 2, 4);
    boardProtected.insertPieceToTile(new Pawn(2), 2, 5);
    boardProtected.insertPieceToTile(new Pawn(2), 2, 6);

    const boardExposed = new Gameboard();
    boardExposed.insertPieceToTile(new King(2), 5, 5);

    expect(boardProtected.evaluateKingProtection()).toBeLessThan(
      boardExposed.evaluateKingProtection(),
    );
  });

  it("testEvaluateKingProtection - symmetric protection cancels to zero", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new King(1), 8, 5);
    gameboard.insertPieceToTile(new Pawn(1), 7, 5);
    gameboard.insertPieceToTile(new King(2), 1, 5);
    gameboard.insertPieceToTile(new Pawn(2), 2, 5);

    expect(gameboard.evaluateKingProtection()).toBeCloseTo(0, 5);
  });

  // ---- evaluateCenterControl ----

  it("testEvaluateCenterControl - piece with center-targeting moves scores positively for white", () => {
    // White knight at (6,5) can reach center squares (4,4) and (4,6).
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Knight(1), 6, 5);

    expect(gameboard.evaluateCenterControl()).toBeGreaterThan(0);
  });

  it("testEvaluateCenterControl - black knight with center-targeting moves scores negatively", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Knight(2), 3, 5);

    expect(gameboard.evaluateCenterControl()).toBeLessThan(0);
  });

  it("testEvaluateCenterControl - symmetric knights cancel to zero", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Knight(1), 6, 5);
    gameboard.insertPieceToTile(new Knight(2), 3, 5);

    expect(gameboard.evaluateCenterControl()).toBeCloseTo(0, 5);
  });

  // ---- evaluateMobility ----

  it("testEvaluateMobility - piece with more moves scores higher for white", () => {
    // Queen has many more moves than a pawn.
    const boardQueen = new Gameboard();
    boardQueen.insertPieceToTile(new Queen(1), 5, 5);

    const boardPawn = new Gameboard();
    boardPawn.insertPieceToTile(new Pawn(1), 5, 5);

    expect(boardQueen.evaluateMobility()).toBeGreaterThan(boardPawn.evaluateMobility());
  });

  it("testEvaluateMobility - black piece with more moves scores more negatively", () => {
    const boardQueen = new Gameboard();
    boardQueen.insertPieceToTile(new Queen(2), 5, 5);

    const boardPawn = new Gameboard();
    boardPawn.insertPieceToTile(new Pawn(2), 5, 5);

    expect(boardQueen.evaluateMobility()).toBeLessThan(boardPawn.evaluateMobility());
  });

  it("testEvaluateMobility - symmetric mobility cancels to zero", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Knight(1), 5, 4);
    gameboard.insertPieceToTile(new Knight(2), 4, 5); // mirror position

    expect(gameboard.evaluateMobility()).toBeCloseTo(0, 5);
  });

  // ---- evaluateProtectedPieces ----

  it("testEvaluateProtectedPieces - protected white piece scores positively", () => {
    // White pawn at (5,5) protected by white knight at (6,3).
    // The knight can reach (5,5) diagonally — wait, knight moves in L-shape.
    // Knight at (7,4) can reach (5,5). Let's use that.
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 5, 5);
    gameboard.insertPieceToTile(new Knight(1), 7, 4);

    expect(gameboard.evaluateProtectedPieces()).toBeGreaterThan(0);
  });

  it("testEvaluateProtectedPieces - protected black piece scores negatively", () => {
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(2), 4, 5);
    gameboard.insertPieceToTile(new Knight(2), 2, 4);

    expect(gameboard.evaluateProtectedPieces()).toBeLessThan(0);
  });

  it("testEvaluateProtectedPieces - unprotected piece scores zero", () => {
    // A lone pawn with no friendly protectors.
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 5, 5);

    expect(gameboard.evaluateProtectedPieces()).toBe(0);
  });

  // ---- evaluateIsolatedPawns edge cases (verifying the fixed column-based implementation) ----

  it("testEvaluateIsolatedPawns - pawn with friendly pawn in adjacent column is NOT penalized", () => {
    // White pawn at (5,5) and white pawn at (5,6): adjacent column friend → not isolated.
    const gameboard = new Gameboard();
    gameboard.insertPieceToTile(new Pawn(1), 5, 5);
    gameboard.insertPieceToTile(new Pawn(1), 3, 6); // different row, same adjacent column

    expect(gameboard.evaluateIsolatedPawns()).toBe(0);
  });

  it("testEvaluateIsolatedPawns - pawn next to only a non-pawn friendly piece is still isolated", () => {
    // White pawn at (5,5) with a white knight at (5,6): knight does NOT count as pawn support.
    const boardWithKnight = new Gameboard();
    boardWithKnight.insertPieceToTile(new Pawn(1), 5, 5);
    boardWithKnight.insertPieceToTile(new Knight(1), 5, 6);

    const boardAlone = new Gameboard();
    boardAlone.insertPieceToTile(new Pawn(1), 5, 5);

    // Both should be penalized equally — the knight must not shield the pawn from isolation penalty.
    expect(boardWithKnight.evaluateIsolatedPawns()).toBe(
      boardAlone.evaluateIsolatedPawns(),
    );
  });
});
