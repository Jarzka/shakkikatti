import type { Gameboard } from "./Gameboard";
import { GamePhase } from "./enums";
import { Move } from "./Move";
import { Piece } from "./pieces/Piece";
import { PieceName } from "./pieces/types";

/**
 * Piece-square tables (PSTs) — values in pawn-equivalent units (pawn = 1).
 * Index [0][*] = the piece's own back rank, [7][*] = the opponent's back rank.
 * White uses pstRow = 8 - piece.row; Black uses pstRow = piece.row - 1.
 */
const KNIGHT_PST: readonly (readonly number[])[] = [
  [-0.50, -0.40, -0.30, -0.30, -0.30, -0.30, -0.40, -0.50],
  [-0.40, -0.20,  0.00,  0.00,  0.00,  0.00, -0.20, -0.40],
  [-0.30,  0.00,  0.10,  0.15,  0.15,  0.10,  0.00, -0.30],
  [-0.30,  0.05,  0.15,  0.20,  0.20,  0.15,  0.05, -0.30],
  [-0.30,  0.00,  0.15,  0.20,  0.20,  0.15,  0.00, -0.30],
  [-0.30,  0.05,  0.10,  0.15,  0.15,  0.10,  0.05, -0.30],
  [-0.40, -0.20,  0.00,  0.05,  0.05,  0.00, -0.20, -0.40],
  [-0.50, -0.40, -0.30, -0.30, -0.30, -0.30, -0.40, -0.50],
];

const BISHOP_PST: readonly (readonly number[])[] = [
  [-0.20, -0.10, -0.10, -0.10, -0.10, -0.10, -0.10, -0.20],
  [-0.10,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00, -0.10],
  [-0.10,  0.00,  0.05,  0.10,  0.10,  0.05,  0.00, -0.10],
  [-0.10,  0.05,  0.05,  0.10,  0.10,  0.05,  0.05, -0.10],
  [-0.10,  0.00,  0.10,  0.10,  0.10,  0.10,  0.00, -0.10],
  [-0.10,  0.10,  0.10,  0.10,  0.10,  0.10,  0.10, -0.10],
  [-0.10,  0.05,  0.00,  0.00,  0.00,  0.00,  0.05, -0.10],
  [-0.20, -0.10, -0.10, -0.10, -0.10, -0.10, -0.10, -0.20],
];

const PAWN_PST: readonly (readonly number[])[] = [
  [ 0.00,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00], // back rank (should not occur)
  [ 0.50,  0.50,  0.50,  0.50,  0.50,  0.50,  0.50,  0.50], // row 7 — very advanced
  [ 0.10,  0.10,  0.20,  0.30,  0.30,  0.20,  0.10,  0.10],
  [ 0.05,  0.05,  0.10,  0.25,  0.25,  0.10,  0.05,  0.05],
  [ 0.00,  0.00,  0.00,  0.20,  0.20,  0.00,  0.00,  0.00],
  [ 0.05, -0.05, -0.10,  0.00,  0.00, -0.10, -0.05,  0.05],
  [ 0.05,  0.10,  0.10, -0.20, -0.20,  0.10,  0.10,  0.05],
  [ 0.00,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00], // starting rank
];

const ROOK_PST: readonly (readonly number[])[] = [
  [ 0.00,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00],
  [ 0.05,  0.10,  0.10,  0.10,  0.10,  0.10,  0.10,  0.05],
  [-0.05,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00, -0.05],
  [-0.05,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00, -0.05],
  [-0.05,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00, -0.05],
  [-0.05,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00, -0.05],
  [-0.05,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00, -0.05],
  [ 0.00,  0.00,  0.00,  0.05,  0.05,  0.00,  0.00,  0.00],
];

const QUEEN_PST: readonly (readonly number[])[] = [
  [-0.20, -0.10, -0.10, -0.05, -0.05, -0.10, -0.10, -0.20],
  [-0.10,  0.00,  0.05,  0.00,  0.00,  0.00,  0.00, -0.10],
  [-0.10,  0.05,  0.05,  0.05,  0.05,  0.05,  0.00, -0.10],
  [ 0.00,  0.00,  0.05,  0.05,  0.05,  0.05,  0.00, -0.05],
  [-0.05,  0.00,  0.05,  0.05,  0.05,  0.05,  0.00, -0.05],
  [-0.10,  0.00,  0.05,  0.05,  0.05,  0.05,  0.00, -0.10],
  [-0.10,  0.00,  0.00,  0.00,  0.00,  0.00,  0.00, -0.10],
  [-0.20, -0.10, -0.10, -0.05, -0.05, -0.10, -0.10, -0.20],
];

/** King middle-game: prefer castled, sheltered positions. */
const KING_MG_PST: readonly (readonly number[])[] = [
  [-0.30, -0.40, -0.40, -0.50, -0.50, -0.40, -0.40, -0.30],
  [-0.30, -0.40, -0.40, -0.50, -0.50, -0.40, -0.40, -0.30],
  [-0.30, -0.40, -0.40, -0.50, -0.50, -0.40, -0.40, -0.30],
  [-0.30, -0.40, -0.40, -0.50, -0.50, -0.40, -0.40, -0.30],
  [-0.20, -0.30, -0.30, -0.40, -0.40, -0.30, -0.30, -0.20],
  [-0.10, -0.20, -0.20, -0.20, -0.20, -0.20, -0.20, -0.10],
  [ 0.20,  0.20,  0.00,  0.00,  0.00,  0.00,  0.20,  0.20],
  [ 0.20,  0.30,  0.10,  0.00,  0.00,  0.10,  0.30,  0.20],
];

/** King end-game: centralise. */
const KING_EG_PST: readonly (readonly number[])[] = [
  [-0.50, -0.40, -0.30, -0.20, -0.20, -0.30, -0.40, -0.50],
  [-0.30, -0.20, -0.10,  0.00,  0.00, -0.10, -0.20, -0.30],
  [-0.30, -0.10,  0.20,  0.30,  0.30,  0.20, -0.10, -0.30],
  [-0.30, -0.10,  0.30,  0.40,  0.40,  0.30, -0.10, -0.30],
  [-0.30, -0.10,  0.30,  0.40,  0.40,  0.30, -0.10, -0.30],
  [-0.30, -0.10,  0.20,  0.30,  0.30,  0.20, -0.10, -0.30],
  [-0.30, -0.30,  0.00,  0.00,  0.00,  0.00, -0.30, -0.30],
  [-0.50, -0.30, -0.30, -0.30, -0.30, -0.30, -0.30, -0.50],
];

/**
 * Contains all position evaluation logic for a Gameboard.
 *
 * Score convention: > 0 = white (player 1) advantage, < 0 = black (player 2) advantage.
 */
export class GameboardEvaluator {
  private readonly board: Gameboard;

  constructor(gameboard: Gameboard) {
    this.board = gameboard;
  }

  /**
   * Computes the total positional score for the current board state.
   *
   * Builds a legal-moves cache once so that evaluateAttacks,
   * evaluateFavorableExchanges, evaluateMobility, and evaluateCenterControl
   * all share the same precomputed move sets rather than each independently
   * cloning the board per candidate move.
   */
  evaluateTotalPositionPoints(): number {
    const legalMovesCache = this.buildLegalMovesCache();

    let totalPoints = 0;

    totalPoints += this.evaluatePieces();
    totalPoints += this.evaluateAdvancedPawns();
    totalPoints += this.evaluateDoubledPawns();
    totalPoints += this.evaluateIsolatedPawns();
    totalPoints += this.evaluatePassedPawns();
    totalPoints += this.evaluateBishopPair();
    totalPoints += this.evaluateGamePhases();
    totalPoints += this.evaluateRooksOnOpenColumns();
    totalPoints += this.evaluatePieceSquareTables();
    totalPoints += this.evaluateAttacksWithCache(legalMovesCache);
    totalPoints += this.evaluateFavorableExchangesWithCache(legalMovesCache);
    totalPoints += this.evaluateMaterialDominance();
    totalPoints += this.evaluateProtectedPieces();
    totalPoints += this.evaluateCenterControlWithCache(legalMovesCache);
    totalPoints += this.evaluateMobilityWithCache(legalMovesCache);
    totalPoints += this.evaluateKingProtection();
    totalPoints += this.evaluateCheck();
    totalPoints += this.evaluateCheckmate();

    return totalPoints;
  }

  private buildLegalMovesCache(): Map<Piece, Move[]> {
    const cache = new Map<Piece, Move[]>();
    for (const piece of this.board.getPieces()) {
      cache.set(piece, piece.findPossibleMoves(true));
    }
    return cache;
  }

  // --- Material ---

  evaluatePieces(): number {
    let points = 0;
    for (const piece of this.board.getPieces()) {
      let pieceValue = piece.fightingValue;
      if (piece.ownerPlayerNumber === 2) {
        pieceValue = -pieceValue;
      }
      points += pieceValue;
    }
    return points;
  }

  // --- Pawns ---

  evaluateAdvancedPawns(): number {
    let points = 0;
    const oneMovePoint = 0.1;

    for (const piece of this.board.findPiecesByType(PieceName.PAWN)) {
      let movePoint = 0;
      if (piece.ownerPlayerNumber === 1) {
        movePoint += (7 - piece.row) * oneMovePoint;
      } else {
        movePoint += (piece.row - 2) * oneMovePoint;
      }

      if (piece.ownerPlayerNumber === 2) {
        movePoint = -movePoint;
      }

      points += movePoint;
    }

    points += this.evaluateVeryAdvancedPawns();
    return points;
  }

  private evaluateVeryAdvancedPawns(): number {
    let points = 0;
    const finalRowMinusOnePoints = 3.0;
    const finalRowMinusTwoPoints = 1.5;

    for (const piece of this.board.findPiecesByType(PieceName.PAWN)) {
      let advancedValue = 0;
      if (piece.ownerPlayerNumber === 1) {
        if (piece.row === 3) advancedValue = finalRowMinusTwoPoints;
        if (piece.row === 2) advancedValue = finalRowMinusOnePoints;
      } else {
        if (piece.row === 6) advancedValue = -finalRowMinusTwoPoints;
        if (piece.row === 7) advancedValue = -finalRowMinusOnePoints;
      }
      points += advancedValue;
    }

    return points;
  }

  evaluateDoubledPawns(): number {
    return (
      this.evaluateDoubledPawnsForPlayer(1) +
      this.evaluateDoubledPawnsForPlayer(2)
    );
  }

  private evaluateDoubledPawnsForPlayer(playerNumber: number): number {
    let points = 0;
    const doubledPawnsPenalty = -0.5;

    for (let i = 1; i <= 8; i++) {
      let numberOfPawnsInColumn = 0;
      for (let j = 1; j <= 8; j++) {
        const tile = this.board.getTileAtPosition(j, i);
        if (tile === undefined) continue;
        if (!tile.hasPiece()) continue;
        if (tile.piece!.name !== PieceName.PAWN) continue;
        if (tile.piece!.ownerPlayerNumber !== playerNumber) continue;
        numberOfPawnsInColumn++;
      }

      if (numberOfPawnsInColumn > 1 && playerNumber === 1) {
        points += doubledPawnsPenalty;
      } else if (numberOfPawnsInColumn > 1 && playerNumber === 2) {
        points -= doubledPawnsPenalty;
      }
    }

    return points;
  }

  evaluateIsolatedPawns(): number {
    let points = 0;
    const isolatedPawnPenalty = -0.5;

    for (const pawn of this.board.findPiecesByType(PieceName.PAWN)) {
      const col = pawn.column;
      let hasFriendlyPawnInAdjacentColumn = false;

      for (const adjacentCol of [col - 1, col + 1]) {
        for (let row = 1; row <= 8; row++) {
          const tile = this.board.getTileAtPosition(row, adjacentCol);
          if (tile === undefined) continue;
          if (!tile.hasPiece()) continue;
          if (tile.piece!.name !== PieceName.PAWN) continue;
          if (tile.piece!.ownerPlayerNumber !== pawn.ownerPlayerNumber) continue;
          hasFriendlyPawnInAdjacentColumn = true;
          break;
        }
        if (hasFriendlyPawnInAdjacentColumn) break;
      }

      if (!hasFriendlyPawnInAdjacentColumn) {
        if (pawn.ownerPlayerNumber === 1) {
          points += isolatedPawnPenalty;
        } else {
          points -= isolatedPawnPenalty;
        }
      }
    }

    return points;
  }

  // --- Piece structure ---

  evaluateBishopPair(): number {
    let points = 0;
    const multipleBishopsPoints = 0.5;

    if (
      this.board.findPiecesByTypeAndOwnerPlayer(PieceName.BISHOP, 1).length >= 2
    ) {
      points += multipleBishopsPoints;
    }

    if (
      this.board.findPiecesByTypeAndOwnerPlayer(PieceName.BISHOP, 2).length >= 2
    ) {
      points -= multipleBishopsPoints;
    }

    return points;
  }

  // --- Opening penalties ---

  evaluateGamePhases(): number {
    return this.evaluateOpeningGame();
  }

  private evaluateOpeningGame(): number {
    let points = 0;
    if (this.board.getCurrentGamePhase() === GamePhase.OPENING) {
      points += this.evaluatePenaltyFromMovingPiecesTooEarly();
      points += this.evaluateMinorPieceDevelopmentBonus();
    }
    return points;
  }

  /**
   * Rewards knights and bishops that have left their starting squares.
   * Encourages piece development in the opening phase.
   */
  private evaluateMinorPieceDevelopmentBonus(): number {
    let points = 0;
    const developmentBonus = 0.3;

    for (const type of [PieceName.KNIGHT, PieceName.BISHOP]) {
      for (const piece of this.board.findPiecesByType(type)) {
        if (piece.hasMoved) {
          let bonus = developmentBonus;
          if (piece.ownerPlayerNumber === 2) bonus = -bonus;
          points += bonus;
        }
      }
    }

    return points;
  }

  private evaluatePenaltyFromMovingPiecesTooEarly(): number {
    let points = 0;
    if (this.board.getCurrentGamePhase() === GamePhase.OPENING) {
      points += this.evaluatePenaltyFromMovingPiecesTooEarlyForPlayer(1);
      points += this.evaluatePenaltyFromMovingPiecesTooEarlyForPlayer(2);
    }
    return points;
  }

  private evaluatePenaltyFromMovingPiecesTooEarlyForPlayer(
    playerNumber: number,
  ): number {
    let points = 0;
    const penaltyPoints = -1.5;

    for (const piece of this.board.findPiecesByTypeAndOwnerPlayer(
      PieceName.ROOK,
      playerNumber,
    )) {
      if (playerNumber === 1 && piece.hasMoved) {
        points += penaltyPoints;
      } else if (playerNumber === 2 && piece.hasMoved) {
        points -= penaltyPoints;
      }
    }

    for (const piece of this.board.findPiecesByTypeAndOwnerPlayer(
      PieceName.QUEEN,
      playerNumber,
    )) {
      if (playerNumber === 1 && piece.hasMoved) {
        points += penaltyPoints;
      } else if (playerNumber === 2 && piece.hasMoved) {
        points -= penaltyPoints;
      }
    }

    return points;
  }

  // --- Attacks and exchanges ---

  evaluateAttacks(): number {
    return this.evaluateAttacksWithCache(this.buildLegalMovesCache());
  }

  /**
   * Attack scoring:
   * - Hanging target + safe attacker  → 95% of target value (near-free material)
   * - Hanging target + unsafe attacker → max(0, targetValue − attackerValue) × 80%
   * - Defended target + safe attacker  → 50% of target value (positional pressure)
   * - Defended target + unsafe attacker → 10% of target value (risky, small bonus)
   */
  private evaluateAttacksWithCache(legalMovesCache: Map<Piece, Move[]>): number {
    let points = 0;

    for (const piece of this.board.getPieces()) {
      const pieceRow = piece.row;
      const pieceCol = piece.column;

      // Check if any enemy's cached legal moves target this piece's current square.
      // Note: this is a positional proxy — a piece threatened on its current square
      // may still capture safely after moving, so this is a heuristic, not exact.
      let isPieceUnderThreatAtCurrentSquare = false;
      for (const [enemy, enemyMoves] of legalMovesCache) {
        if (enemy.ownerPlayerNumber === piece.ownerPlayerNumber)
          continue;
        for (const move of enemyMoves) {
          if (move.target.row === pieceRow && move.target.column === pieceCol) {
            isPieceUnderThreatAtCurrentSquare = true;
            break;
          }
        }
        if (isPieceUnderThreatAtCurrentSquare) break;
      }

      // Scan this piece's cached moves for enemy-occupied squares
      const pieceMoves = legalMovesCache.get(piece) ?? [];
      for (const move of pieceMoves) {
        const targetTile = this.board.getTileAtPosition(
          move.target.row,
          move.target.column,
        );
        if (!targetTile?.hasPiece()) continue;
        const target = targetTile.piece!;
        if (target.ownerPlayerNumber === piece.ownerPlayerNumber)
          continue;

        const targetValue = target.fightingValue;
        const attackerValue = piece.fightingValue;
        // findProtectors uses includeCheck=false so it never clones the board
        const targetIsHanging = target.findProtectors().length === 0;

        let attackPoints: number;

        if (targetIsHanging && !isPieceUnderThreatAtCurrentSquare) {
          attackPoints = targetValue * 0.95;
        } else if (targetIsHanging && isPieceUnderThreatAtCurrentSquare) {
          attackPoints = Math.max(0, targetValue - attackerValue) * 0.8;
        } else if (!isPieceUnderThreatAtCurrentSquare) {
          attackPoints = targetValue * 0.5;
        } else {
          attackPoints = targetValue * 0.1;
        }

        if (piece.ownerPlayerNumber === 2) {
          attackPoints = -attackPoints;
        }

        points += attackPoints;
      }
    }

    return points;
  }

  /**
   * Rewards positions where a piece can capture an enemy of higher value.
   * Additive to evaluateAttacks: that function scores general attack pressure,
   * while this one specifically rewards profitable trade opportunities.
   */
  evaluateFavorableExchanges(): number {
    return this.evaluateFavorableExchangesWithCache(this.buildLegalMovesCache());
  }

  private evaluateFavorableExchangesWithCache(
    legalMovesCache: Map<Piece, Move[]>,
  ): number {
    let points = 0;
    const exchangeMultiplier = 0.4;

    for (const [piece, moves] of legalMovesCache) {
      for (const move of moves) {
        const targetTile = this.board.getTileAtPosition(
          move.target.row,
          move.target.column,
        );
        if (!targetTile?.hasPiece()) continue;
        const target = targetTile.piece!;
        if (target.ownerPlayerNumber === piece.ownerPlayerNumber)
          continue;

        const netGain = target.fightingValue - piece.fightingValue;
        if (netGain > 0) {
          let exchangePoints = netGain * exchangeMultiplier;
          if (piece.ownerPlayerNumber === 2) {
            exchangePoints = -exchangePoints;
          }
          points += exchangePoints;
        }
      }
    }

    return points;
  }

  // --- Material dominance ---

  /**
   * Adds a small bonus for the side that is already ahead in material.
   * Rewards converting and pressing an existing advantage rather than
   * consolidating passively. Only kicks in when the surplus is >= 3 points
   * to avoid noise in roughly-equal positions.
   */
  evaluateMaterialDominance(): number {
    let whiteMaterial = 0;
    let blackMaterial = 0;

    for (const piece of this.board.getPieces()) {
      if (piece.ownerPlayerNumber === 1) {
        whiteMaterial += piece.fightingValue;
      } else {
        blackMaterial += piece.fightingValue;
      }
    }

    const surplus = whiteMaterial - blackMaterial;
    if (Math.abs(surplus) < 3) return 0;

    return surplus * 0.05;
  }

  // --- Protection and mobility ---

  evaluateProtectedPieces(): number {
    let points = 0;
    const protectionPoint = 0.2;

    for (const piece of this.board.getPieces()) {
      let protectValue =
        piece.fightingValue *
        piece.findProtectors().length *
        protectionPoint;

      if (piece.ownerPlayerNumber === 2) {
        protectValue = -protectValue;
      }

      points += protectValue;
    }

    return points;
  }

  evaluateCenterControl(): number {
    return this.evaluateCenterControlWithCache(this.buildLegalMovesCache());
  }

  private evaluateCenterControlWithCache(
    legalMovesCache: Map<Piece, Move[]>,
  ): number {
    let points = 0;
    const centerControlPoint = 0.15;

    for (const [piece, moves] of legalMovesCache) {
      for (const move of moves) {
        if (move.target.isLocatedInCenter()) {
          let controlValue = centerControlPoint;
          if (piece.ownerPlayerNumber === 2) {
            controlValue = -controlValue;
          }
          points += controlValue;
        }
      }
    }

    return points;
  }

  evaluateMobility(): number {
    return this.evaluateMobilityWithCache(this.buildLegalMovesCache());
  }

  private evaluateMobilityWithCache(legalMovesCache: Map<Piece, Move[]>): number {
    let points = 0;
    const movePoint = 0.08;

    for (const [piece, moves] of legalMovesCache) {
      let moveValue = moves.length * movePoint;
      if (piece.ownerPlayerNumber === 2) {
        moveValue = -moveValue;
      }
      points += moveValue;
    }

    return points;
  }

  // --- King safety ---

  evaluateKingProtection(): number {
    return (
      this.getKingProtectionPoints(1) + this.getKingProtectionPoints(2)
    );
  }

  evaluateCheck(): number {
    // The value of the check is highly dependant of the overall position.
    // A small bonus encourages the AI to find checks that are available without overlooking more valuable moves.
    const pointsFromCheck = 0.3;
    let points = 0;

    // Each king is evaluated independently so that both sides being in check
    // (possible in synthetic positions during AI tree search) is handled correctly.
    try {
      if (this.board.findKing(1).isInCheck()) points -= pointsFromCheck;
    } catch { /* white king not on board */ }

    try {
      if (this.board.findKing(2).isInCheck()) points += pointsFromCheck;
    } catch { /* black king not on board */ }

    return points;
  }

  evaluateCheckmate(): number {
    const pointsFromCheckmate = 10000;
    let points = 0;

    // Each king is evaluated independently, consistent with evaluateCheck.
    try {
      if (this.board.findKing(1).isInCheckMate()) points -= pointsFromCheckmate;
    } catch { /* white king not on board */ }

    try {
      if (this.board.findKing(2).isInCheckMate()) points += pointsFromCheckmate;
    } catch { /* black king not on board */ }

    return points;
  }

  // --- Passed pawns ---

  /**
   * Bonuses for passed pawns — pawns with no enemy pawn blocking them on the
   * same column or on adjacent columns. Bonus scales with advancement.
   */
  evaluatePassedPawns(): number {
    let points = 0;
    const baseBonus = 0.5;
    const advancementBonus = 0.15;

    const whitePawns = this.board.findPiecesByTypeAndOwnerPlayer(PieceName.PAWN, 1);
    const blackPawns = this.board.findPiecesByTypeAndOwnerPlayer(PieceName.PAWN, 2);

    for (const pawn of whitePawns) {
      const col = pawn.column;
      const row = pawn.row;
      // White advances toward row 1, so a blocking enemy pawn must be on a smaller row.
      let isPassed = true;
      for (const enemy of blackPawns) {
        if (Math.abs(enemy.column - col) <= 1 && enemy.row < row) {
          isPassed = false;
          break;
        }
      }
      if (isPassed) {
        const advancement = 7 - row; // 0 at starting row 7, up to 6 at row 1
        points += baseBonus + advancement * advancementBonus;
      }
    }

    for (const pawn of blackPawns) {
      const col = pawn.column;
      const row = pawn.row;
      // Black advances toward row 8, so a blocking enemy pawn must be on a larger row.
      let isPassed = true;
      for (const enemy of whitePawns) {
        if (Math.abs(enemy.column - col) <= 1 && enemy.row > row) {
          isPassed = false;
          break;
        }
      }
      if (isPassed) {
        const advancement = row - 2; // 0 at starting row 2, up to 6 at row 8
        points -= baseBonus + advancement * advancementBonus;
      }
    }

    return points;
  }

  // --- Rooks on open columns ---

  /**
   * Rewards rooks on open columns (no pawns of either color) or semi-open
   * columns (no friendly pawn, but an enemy pawn is present).
   */
  evaluateRooksOnOpenColumns(): number {
    let points = 0;
    const openColumnBonus = 0.5;
    const semiOpenColumnBonus = 0.25;

    const allPawns = this.board.findPiecesByType(PieceName.PAWN);

    for (const rook of this.board.findPiecesByType(PieceName.ROOK)) {
      const col = rook.column;
      const player = rook.ownerPlayerNumber;

      let hasFriendlyPawn = false;
      let hasEnemyPawn = false;
      for (const pawn of allPawns) {
        if (pawn.column === col) {
          if (pawn.ownerPlayerNumber === player) hasFriendlyPawn = true;
          else hasEnemyPawn = true;
        }
      }

      let bonus = 0;
      if (!hasFriendlyPawn && !hasEnemyPawn) bonus = openColumnBonus;
      else if (!hasFriendlyPawn) bonus = semiOpenColumnBonus;

      if (player === 2) bonus = -bonus;
      points += bonus;
    }

    return points;
  }

  // --- Piece-square tables ---

  /**
   * Applies piece-square table bonuses for all piece types.
   * Knights and bishops: centralization / diagonal control.
   * Pawns: central + advanced pawn structure.
   * Rooks: open-file pressure.
   * Queens: development without over-early exposure.
   * King: shelter in middlegame, centralise in endgame.
   */
  evaluatePieceSquareTables(): number {
    let points = 0;
    const phase = this.board.getCurrentGamePhase();

    for (const piece of this.board.getPieces()) {
      const row = piece.row;
      const col = piece.column;
      // White (player 1): index 0 = back rank (row 8), index 7 = opponent's rank (row 1).
      // Black (player 2): index 0 = back rank (row 1), index 7 = opponent's rank (row 8).
      const pstRow = piece.ownerPlayerNumber === 1 ? 8 - row : row - 1;
      const pstCol = col - 1;

      let value = 0;
      switch (piece.name) {
        case PieceName.KNIGHT:
          value = KNIGHT_PST[pstRow][pstCol];
          break;
        case PieceName.BISHOP:
          value = BISHOP_PST[pstRow][pstCol];
          break;
        case PieceName.PAWN:
          value = PAWN_PST[pstRow][pstCol];
          break;
        case PieceName.ROOK:
          value = ROOK_PST[pstRow][pstCol];
          break;
        case PieceName.QUEEN:
          value = QUEEN_PST[pstRow][pstCol];
          break;
        case PieceName.KING:
          value =
            phase === GamePhase.ENDGAME
              ? KING_EG_PST[pstRow][pstCol]
              : KING_MG_PST[pstRow][pstCol];
          break;
      }

      if (piece.ownerPlayerNumber === 2) value = -value;
      points += value;
    }

    return points;
  }

  // --- Enhanced king safety ---

  /**
   * Returns a safety score for one player's king.
   *
   * Components:
   *  + 0.1 per friendly piece adjacent to the king (original).
   *  + 0.15 per pawn-shield square (the 3 squares directly in front of the
   *    king) occupied by a friendly pawn.
   *  − 0.35 per open file (no pawns at all) through the king's column.
   *  − 0.20 per semi-open file (enemy pawn only) through the king's column.
   *
   * Score is negated for player 2 before returning.
   */
  private getKingProtectionPoints(playerNumber: number): number {
    let points = 0;
    const kingProtectionPoint = 0.1;

    let kingLocation;
    try {
      kingLocation = this.board.findKing(playerNumber).position;
    } catch {
      return 0;
    }

    // Adjacent friendly pieces.
    for (let i = kingLocation.row - 1; i <= kingLocation.row + 1; i++) {
      for (let j = kingLocation.column - 1; j <= kingLocation.column + 1; j++) {
        if (i === kingLocation.row && j === kingLocation.column) continue;
        const tile = this.board.getTileAtPosition(i, j);
        if (tile === undefined) continue;
        if (!tile.hasPiece()) continue;
        if (tile.piece!.ownerPlayerNumber === playerNumber) {
          points += kingProtectionPoint;
        }
      }
    }

    // Pawn shield: the 3 squares directly in front of the king (toward the
    // enemy).  White advances toward row 1, Black toward row 8.
    const shieldRow =
      playerNumber === 1 ? kingLocation.row - 1 : kingLocation.row + 1;
    const pawnShieldBonus = 0.15;
    if (shieldRow >= 1 && shieldRow <= 8) {
      for (let c = kingLocation.column - 1; c <= kingLocation.column + 1; c++) {
        const tile = this.board.getTileAtPosition(shieldRow, c);
        if (
          tile?.hasPiece() &&
          tile.piece!.name === PieceName.PAWN &&
          tile.piece!.ownerPlayerNumber === playerNumber
        ) {
          points += pawnShieldBonus;
        }
      }
    }

    // Open / semi-open file penalties around the king's column.
    const openFilePenalty = -0.35;
    const semiOpenFilePenalty = -0.20;
    const allPawns = this.board.findPiecesByType(PieceName.PAWN);

    for (let c = kingLocation.column - 1; c <= kingLocation.column + 1; c++) {
      if (c < 1 || c > 8) continue;
      let hasFriendly = false;
      let hasEnemy = false;
      for (const pawn of allPawns) {
        if (pawn.column !== c) continue;
        if (pawn.ownerPlayerNumber === playerNumber) hasFriendly = true;
        else hasEnemy = true;
      }
      if (!hasFriendly && !hasEnemy) points += openFilePenalty;
      else if (!hasFriendly && hasEnemy) points += semiOpenFilePenalty;
    }

    // Negate for black so convention (>0 = white advantage) is preserved.
    return playerNumber === 2 ? -points : points;
  }
}
