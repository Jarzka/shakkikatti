import { Cell } from "./Cell";
import { Gameboard } from "./Gameboard";
import { MoveType } from "./enums";
import { Move } from "./Move";
import { PieceName } from "./pieces/types";

/**
 * Coordinate mapping:
 *   Game row r  <->  FEN rank (9 - r)
 *   Game col c  <->  FEN file (a=1 … h=8)
 *
 * Player 1 = White (uppercase FEN letters)
 * Player 2 = Black (lowercase FEN letters)
 */

export interface ParsedFENTile {
  row: number;
  column: number;
  pieceName: PieceName;
  ownerPlayer: number;
  hasMoved: boolean;
}

export interface ParsedFEN {
  tiles: ParsedFENTile[];
  activePlayer: number;   // 1 = white, 2 = black
  performedMoves: number;
  lastMove?: Move;        // reconstructed from en passant square
}

// ---------- helpers ----------

const FEN_LETTER_TO_PIECE: Record<string, PieceName> = {
  k: PieceName.KING,
  q: PieceName.QUEEN,
  r: PieceName.ROOK,
  b: PieceName.BISHOP,
  n: PieceName.KNIGHT,
  p: PieceName.PAWN,
};

const PIECE_TO_FEN_LETTER: Record<PieceName, string> = {
  [PieceName.KING]:   "k",
  [PieceName.QUEEN]:  "q",
  [PieceName.ROOK]:   "r",
  [PieceName.BISHOP]: "b",
  [PieceName.KNIGHT]: "n",
  [PieceName.PAWN]:   "p",
};

function fileToColumn(file: string): number {
  return file.charCodeAt(0) - "a".charCodeAt(0) + 1;
}

function columnToFile(col: number): string {
  return String.fromCharCode("a".charCodeAt(0) + col - 1);
}

// FEN rank  (1-8)  <->  game row (8-1)
function fenRankToRow(rank: number): number {
  return 9 - rank;
}

function rowToFenRank(row: number): number {
  return 9 - row;
}

// ---------- validateFEN ----------

export function validateFEN(fen: string): { valid: boolean; error?: string } {
  const fields = fen.trim().split(/\s+/);
  if (fields.length !== 6) {
    return { valid: false, error: "FEN must have exactly 6 fields separated by spaces." };
  }

  const [placement, active, castling, enPassant, halfStr, fullStr] = fields;

  // Check piece placement
  const ranks = placement.split("/");
  if (ranks.length !== 8) {
    return { valid: false, error: "Piece placement must have 8 ranks separated by '/'." };
  }

  let whiteKings = 0;
  let blackKings = 0;
  for (const rank of ranks) {
    let count = 0;
    for (const ch of rank) {
      if (/[1-8]/.test(ch)) {
        count += parseInt(ch, 10);
      } else if (/[kqrbnpKQRBNP]/.test(ch)) {
        count++;
        if (ch === "K") whiteKings++;
        if (ch === "k") blackKings++;
      } else {
        return { valid: false, error: `Invalid character '${ch}' in piece placement.` };
      }
    }
    if (count !== 8) {
      return { valid: false, error: `Rank '${rank}' does not sum to 8 squares.` };
    }
  }

  if (whiteKings !== 1) return { valid: false, error: "Position must have exactly one white king." };
  if (blackKings !== 1) return { valid: false, error: "Position must have exactly one black king." };

  // Active color
  if (active !== "w" && active !== "b") {
    return { valid: false, error: "Active color must be 'w' or 'b'." };
  }

  // Castling
  if (!/^(-|[KQkq]+)$/.test(castling)) {
    return { valid: false, error: "Castling field contains invalid characters." };
  }

  // En passant
  if (enPassant !== "-" && !/^[a-h][36]$/.test(enPassant)) {
    return { valid: false, error: `Invalid en passant square '${enPassant}'.` };
  }

  // Move counts
  const halfmove = parseInt(halfStr, 10);
  const fullmove = parseInt(fullStr, 10);
  if (isNaN(halfmove) || halfmove < 0) {
    return { valid: false, error: "Halfmove clock must be a non-negative integer." };
  }
  if (isNaN(fullmove) || fullmove < 1) {
    return { valid: false, error: "Fullmove number must be a positive integer." };
  }

  return { valid: true };
}

// ---------- parseFEN ----------

export function parseFEN(fen: string): ParsedFEN {
  const fields = fen.trim().split(/\s+/);
  const [placement, active, castling, enPassant, , fullStr] = fields;

  const activePlayer = active === "w" ? 1 : 2;
  const fullmove = parseInt(fullStr, 10);

  // Parse piece placement
  // All pieces default hasMoved = true; we'll correct kings/rooks from castling field later.
  const tiles: ParsedFENTile[] = [];
  const rankStrings = placement.split("/");

  for (let fenRankIdx = 0; fenRankIdx < 8; fenRankIdx++) {
    // FEN rank 8 is first in the string; rank 1 is last.
    const fenRank = 8 - fenRankIdx;
    const gameRow = fenRankToRow(fenRank);
    const rankStr = rankStrings[fenRankIdx];

    let col = 1;
    for (const ch of rankStr) {
      if (/[1-8]/.test(ch)) {
        col += parseInt(ch, 10);
      } else {
        const lower = ch.toLowerCase();
        const pieceName = FEN_LETTER_TO_PIECE[lower];
        const ownerPlayer = ch === ch.toUpperCase() ? 1 : 2;
        tiles.push({ row: gameRow, column: col, pieceName, ownerPlayer, hasMoved: true });
        col++;
      }
    }
  }

  // Apply castling rights — set hasMoved=false for eligible kings and rooks
  const setHasMoved = (row: number, col: number, hasMoved: boolean) => {
    const tile = tiles.find((t) => t.row === row && t.column === col);
    if (tile) tile.hasMoved = hasMoved;
  };

  if (castling !== "-") {
    if (castling.includes("K") || castling.includes("Q")) {
      // White king has not moved
      setHasMoved(8, 5, false);
    }
    if (castling.includes("K")) setHasMoved(8, 8, false); // white king-side rook
    if (castling.includes("Q")) setHasMoved(8, 1, false); // white queen-side rook
    if (castling.includes("k") || castling.includes("q")) {
      // Black king has not moved
      setHasMoved(1, 5, false);
    }
    if (castling.includes("k")) setHasMoved(1, 8, false); // black king-side rook
    if (castling.includes("q")) setHasMoved(1, 1, false); // black queen-side rook
  }

  // En passant — reconstruct lastMove
  let lastMove: Move | undefined;
  if (enPassant !== "-") {
    const epFile = enPassant[0];
    const epRank = parseInt(enPassant[1], 10);
    const epCol = fileToColumn(epFile);

    // Determine which player made the double pawn push:
    //   Target square rank 3 (game row 6) => white pawn pushed from row 7 to row 5
    //   Target square rank 6 (game row 3) => black pawn pushed from row 2 to row 4
    if (epRank === 3) {
      // White pawn double push
      lastMove = new Move(
        new Cell(7, epCol),
        new Cell(5, epCol),
        1,
        MoveType.REGULAR,
      );
    } else if (epRank === 6) {
      // Black pawn double push
      lastMove = new Move(
        new Cell(2, epCol),
        new Cell(4, epCol),
        2,
        MoveType.REGULAR,
      );
    }
  }

  // performedMoves derived from fullmove counter
  const performedMoves = (fullmove - 1) * 2 + (activePlayer === 2 ? 1 : 0);

  return { tiles, activePlayer, performedMoves, lastMove };
}

// ---------- generateFEN ----------

export function generateFEN(gameboard: Gameboard, activePlayer: number): string {
  // 1. Piece placement
  const rankParts: string[] = [];
  for (let gameRow = 1; gameRow <= 8; gameRow++) {
    let rankStr = "";
    let emptyCount = 0;
    for (let col = 1; col <= 8; col++) {
      const tile = gameboard.getTileAtPosition(gameRow, col);
      if (tile === undefined || !tile.hasPiece()) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankStr += emptyCount.toString();
          emptyCount = 0;
        }
        const piece = tile.piece!;
        const letter = PIECE_TO_FEN_LETTER[piece.name as PieceName];
        rankStr += piece.ownerPlayerNumber === 1 ? letter.toUpperCase() : letter;
      }
    }
    if (emptyCount > 0) rankStr += emptyCount.toString();
    rankParts.push(rankStr);
  }
  const piecePlacement = rankParts.join("/");

  // 2. Active color
  const activeColor = activePlayer === 1 ? "w" : "b";

  // 3. Castling availability
  let castling = "";
  const whiteKingTile = gameboard.getTileAtPosition(8, 5);
  const blackKingTile = gameboard.getTileAtPosition(1, 5);
  const whiteKSRookTile = gameboard.getTileAtPosition(8, 8);
  const whiteQSRookTile = gameboard.getTileAtPosition(8, 1);
  const blackKSRookTile = gameboard.getTileAtPosition(1, 8);
  const blackQSRookTile = gameboard.getTileAtPosition(1, 1);

  const whiteKingUnmoved =
    whiteKingTile?.hasPiece() &&
    whiteKingTile.piece!.name === PieceName.KING &&
    whiteKingTile.piece!.ownerPlayerNumber === 1 &&
    !whiteKingTile.piece!.hasMoved;

  const blackKingUnmoved =
    blackKingTile?.hasPiece() &&
    blackKingTile.piece!.name === PieceName.KING &&
    blackKingTile.piece!.ownerPlayerNumber === 2 &&
    !blackKingTile.piece!.hasMoved;

  if (
    whiteKingUnmoved &&
    whiteKSRookTile?.hasPiece() &&
    whiteKSRookTile.piece!.name === PieceName.ROOK &&
    !whiteKSRookTile.piece!.hasMoved
  ) castling += "K";
  if (
    whiteKingUnmoved &&
    whiteQSRookTile?.hasPiece() &&
    whiteQSRookTile.piece!.name === PieceName.ROOK &&
    !whiteQSRookTile.piece!.hasMoved
  ) castling += "Q";
  if (
    blackKingUnmoved &&
    blackKSRookTile?.hasPiece() &&
    blackKSRookTile.piece!.name === PieceName.ROOK &&
    !blackKSRookTile.piece!.hasMoved
  ) castling += "k";
  if (
    blackKingUnmoved &&
    blackQSRookTile?.hasPiece() &&
    blackQSRookTile.piece!.name === PieceName.ROOK &&
    !blackQSRookTile.piece!.hasMoved
  ) castling += "q";

  if (castling === "") castling = "-";

  // 4. En passant target square
  let enPassant = "-";
  const lastMove = gameboard.lastMove;
  if (lastMove !== undefined) {
    const rowDiff = Math.abs(lastMove.source.row - lastMove.target.row);
    // Check if it was a pawn double push
    const srcTile = gameboard.getTileAtPosition(lastMove.target.row, lastMove.target.column);
    const isPawn = srcTile?.hasPiece() && srcTile.piece!.name === PieceName.PAWN;
    if (isPawn && rowDiff === 2) {
      // The en passant target square is the square "behind" the pushed pawn
      const epRow = (lastMove.source.row + lastMove.target.row) / 2; // middle row
      const epFenRank = rowToFenRank(epRow);
      const epFile = columnToFile(lastMove.source.column);
      enPassant = `${epFile}${epFenRank}`;
    }
  }

  // 5. Halfmove clock (not tracked — output 0)
  const halfmove = 0;

  // 6. Fullmove number
  const fullmove = Math.floor(gameboard.performedMoves / 2) + 1;

  return `${piecePlacement} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}
