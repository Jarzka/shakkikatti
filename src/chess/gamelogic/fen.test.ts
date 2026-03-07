import { describe, it, expect } from "vitest";
import { validateFEN, parseFEN, generateFEN } from "./fen";
import { Gameboard } from "./Gameboard";
import { Cell } from "./Cell";
import { Move } from "./Move";
import { MoveType } from "./enums";
import { PieceName } from "./pieces/types";
import { King } from "./pieces/King";
import { Queen } from "./pieces/Queen";
import { Rook } from "./pieces/Rook";
import { Bishop } from "./pieces/Bishop";
import { Knight } from "./pieces/Knight";
import { Pawn } from "./pieces/Pawn";

// Standard starting position FEN
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// -----------------------------------------------------------------------
// validateFEN
// -----------------------------------------------------------------------

describe("validateFEN", () => {
  it("accepts the starting position", () => {
    expect(validateFEN(START_FEN).valid).toBe(true);
  });

  it("accepts a mid-game position", () => {
    const fen = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";
    expect(validateFEN(fen).valid).toBe(true);
  });

  it("accepts a position with no castling rights", () => {
    const fen = "8/8/8/8/8/8/8/4K2k w - - 0 1";
    expect(validateFEN(fen).valid).toBe(true);
  });

  it("accepts an en passant position", () => {
    const fen = "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3";
    expect(validateFEN(fen).valid).toBe(true);
  });

  it("rejects wrong number of fields", () => {
    expect(validateFEN("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -").valid).toBe(false);
    expect(validateFEN("").valid).toBe(false);
  });

  it("rejects wrong number of ranks", () => {
    const bad = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1";
    expect(validateFEN(bad).valid).toBe(false);
  });

  it("rejects a rank that does not sum to 8", () => {
    const bad = "rnbqkbn/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    expect(validateFEN(bad).valid).toBe(false);
  });

  it("rejects invalid characters in piece placement", () => {
    const bad = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKXNR w KQkq - 0 1";
    expect(validateFEN(bad).valid).toBe(false);
  });

  it("rejects invalid active color", () => {
    const bad = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1";
    expect(validateFEN(bad).valid).toBe(false);
  });

  it("rejects invalid castling field", () => {
    const bad = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w XY - 0 1";
    expect(validateFEN(bad).valid).toBe(false);
  });

  it("rejects invalid en passant square", () => {
    const bad = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e5 0 1";
    expect(validateFEN(bad).valid).toBe(false);
  });

  it("rejects missing white king", () => {
    const bad = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR w KQkq - 0 1";
    expect(validateFEN(bad).valid).toBe(false);
  });

  it("rejects missing black king", () => {
    const bad = "rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    expect(validateFEN(bad).valid).toBe(false);
  });

  it("rejects negative halfmove clock", () => {
    const bad = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - -1 1";
    expect(validateFEN(bad).valid).toBe(false);
  });

  it("rejects zero fullmove number", () => {
    const bad = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0";
    expect(validateFEN(bad).valid).toBe(false);
  });
});

// -----------------------------------------------------------------------
// parseFEN — piece placement
// -----------------------------------------------------------------------

describe("parseFEN — piece placement", () => {
  it("produces 32 tiles for the starting position", () => {
    const result = parseFEN(START_FEN);
    expect(result.tiles.length).toBe(32);
  });

  it("white pawns are on game row 7 (FEN rank 2)", () => {
    const result = parseFEN(START_FEN);
    const whitePawns = result.tiles.filter(
      (t) => t.pieceName === PieceName.PAWN && t.ownerPlayer === 1,
    );
    expect(whitePawns.length).toBe(8);
    for (const p of whitePawns) expect(p.row).toBe(7);
  });

  it("black pawns are on game row 2 (FEN rank 7)", () => {
    const result = parseFEN(START_FEN);
    const blackPawns = result.tiles.filter(
      (t) => t.pieceName === PieceName.PAWN && t.ownerPlayer === 2,
    );
    expect(blackPawns.length).toBe(8);
    for (const p of blackPawns) expect(p.row).toBe(2);
  });

  it("white king is at row 8 col 5 (e1)", () => {
    const result = parseFEN(START_FEN);
    const wk = result.tiles.find(
      (t) => t.pieceName === PieceName.KING && t.ownerPlayer === 1,
    );
    expect(wk?.row).toBe(8);
    expect(wk?.column).toBe(5);
  });

  it("black king is at row 1 col 5 (e8)", () => {
    const result = parseFEN(START_FEN);
    const bk = result.tiles.find(
      (t) => t.pieceName === PieceName.KING && t.ownerPlayer === 2,
    );
    expect(bk?.row).toBe(1);
    expect(bk?.column).toBe(5);
  });

  it("parses a sparse position correctly", () => {
    // Only kings on the board
    const fen = "8/8/8/8/8/8/8/4K2k w - - 0 1";
    const result = parseFEN(fen);
    expect(result.tiles.length).toBe(2);
    const wk = result.tiles.find((t) => t.ownerPlayer === 1)!;
    expect(wk.pieceName).toBe(PieceName.KING);
    expect(wk.row).toBe(8);
    expect(wk.column).toBe(5);
    const bk = result.tiles.find((t) => t.ownerPlayer === 2)!;
    expect(bk.pieceName).toBe(PieceName.KING);
    expect(bk.row).toBe(8);
    expect(bk.column).toBe(8);
  });
});

// -----------------------------------------------------------------------
// parseFEN — active player
// -----------------------------------------------------------------------

describe("parseFEN — active player", () => {
  it("'w' maps to player 1", () => {
    expect(parseFEN(START_FEN).activePlayer).toBe(1);
  });

  it("'b' maps to player 2", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    expect(parseFEN(fen).activePlayer).toBe(2);
  });
});

// -----------------------------------------------------------------------
// parseFEN — castling / hasMoved flags
// -----------------------------------------------------------------------

describe("parseFEN — castling flags", () => {
  it("all castling rights: kings and corner rooks have hasMoved=false", () => {
    const result = parseFEN(START_FEN);

    const pieceAt = (row: number, col: number) =>
      result.tiles.find((t) => t.row === row && t.column === col);

    expect(pieceAt(8, 5)?.hasMoved).toBe(false); // white king
    expect(pieceAt(8, 1)?.hasMoved).toBe(false); // white Q-side rook
    expect(pieceAt(8, 8)?.hasMoved).toBe(false); // white K-side rook
    expect(pieceAt(1, 5)?.hasMoved).toBe(false); // black king
    expect(pieceAt(1, 1)?.hasMoved).toBe(false); // black Q-side rook
    expect(pieceAt(1, 8)?.hasMoved).toBe(false); // black K-side rook
  });

  it("no castling rights: king and rooks have hasMoved=true", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1";
    const result = parseFEN(fen);

    const pieceAt = (row: number, col: number) =>
      result.tiles.find((t) => t.row === row && t.column === col);

    expect(pieceAt(8, 5)?.hasMoved).toBe(true);
    expect(pieceAt(8, 1)?.hasMoved).toBe(true);
    expect(pieceAt(8, 8)?.hasMoved).toBe(true);
  });

  it("only white king-side castling: only white king + K-side rook unmoved", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w K - 0 1";
    const result = parseFEN(fen);

    const pieceAt = (row: number, col: number) =>
      result.tiles.find((t) => t.row === row && t.column === col);

    expect(pieceAt(8, 5)?.hasMoved).toBe(false); // white king
    expect(pieceAt(8, 8)?.hasMoved).toBe(false); // white K-side rook
    expect(pieceAt(8, 1)?.hasMoved).toBe(true);  // white Q-side rook: no 'Q' right
    expect(pieceAt(1, 5)?.hasMoved).toBe(true);  // black king: no 'k'/'q' right
  });
});

// -----------------------------------------------------------------------
// parseFEN — en passant / lastMove
// -----------------------------------------------------------------------

describe("parseFEN — en passant", () => {
  it("no en passant gives no lastMove", () => {
    expect(parseFEN(START_FEN).lastMove).toBeUndefined();
  });

  it("en passant square e3 reconstructs white pawn double-push on file e", () => {
    // e3 means a white pawn just pushed e2→e4
    const fen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2";
    const result = parseFEN(fen);
    expect(result.lastMove).toBeDefined();
    const lm = result.lastMove!;
    expect(lm.source.row).toBe(7);
    expect(lm.source.column).toBe(5); // file e
    expect(lm.target.row).toBe(5);
    expect(lm.target.column).toBe(5);
    expect(lm.playerNumber).toBe(1);
  });

  it("en passant square d6 reconstructs black pawn double-push on file d", () => {
    // d6 means a black pawn just pushed d7→d5
    const fen = "rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3";
    const result = parseFEN(fen);
    expect(result.lastMove).toBeDefined();
    const lm = result.lastMove!;
    expect(lm.source.row).toBe(2);
    expect(lm.source.column).toBe(4); // file d
    expect(lm.target.row).toBe(4);
    expect(lm.target.column).toBe(4);
    expect(lm.playerNumber).toBe(2);
  });
});

// -----------------------------------------------------------------------
// parseFEN — performedMoves
// -----------------------------------------------------------------------

describe("parseFEN — performedMoves", () => {
  it("fullmove 1 white to move → 0 performed moves", () => {
    expect(parseFEN(START_FEN).performedMoves).toBe(0);
  });

  it("fullmove 1 black to move → 1 performed move", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    expect(parseFEN(fen).performedMoves).toBe(1);
  });

  it("fullmove 5 white to move → 8 performed moves", () => {
    const fen = "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 1 5";
    expect(parseFEN(fen).performedMoves).toBe(8);
  });
});

// -----------------------------------------------------------------------
// generateFEN
// -----------------------------------------------------------------------

describe("generateFEN — starting position round-trip", () => {
  it("generates the canonical starting position FEN from a fresh board", () => {
    const gb = new Gameboard();
    gb.resetGameboard();
    const fen = generateFEN(gb, 1);
    // The piece placement and active color must match exactly.
    // We parse both and compare piece counts rather than string equality
    // because halfmove/fullmove may differ.
    const [placement, activeColor] = fen.split(" ");
    expect(placement).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
    expect(activeColor).toBe("w");
  });

  it("marks all castling rights in the initial position", () => {
    const gb = new Gameboard();
    gb.resetGameboard();
    const fen = generateFEN(gb, 1);
    const castling = fen.split(" ")[2];
    expect(castling).toBe("KQkq");
  });

  it("outputs '-' for en passant when no last move exists", () => {
    const gb = new Gameboard();
    gb.resetGameboard();
    const fen = generateFEN(gb, 1);
    expect(fen.split(" ")[3]).toBe("-");
  });
});

describe("generateFEN — castling rights", () => {
  it("loses castling right when king has moved", () => {
    const gb = new Gameboard();
    gb.resetGameboard();
    const king = gb.getTileAtPosition(8, 5)!.piece!;
    king.hasMoved = true;
    const fen = generateFEN(gb, 1);
    const castling = fen.split(" ")[2];
    expect(castling).not.toContain("K");
    expect(castling).not.toContain("Q");
    expect(castling).toContain("k"); // black unaffected
    expect(castling).toContain("q");
  });

  it("loses K-side right when K-side rook has moved", () => {
    const gb = new Gameboard();
    gb.resetGameboard();
    const rook = gb.getTileAtPosition(8, 8)!.piece!;
    rook.hasMoved = true;
    const castling = generateFEN(gb, 1).split(" ")[2];
    expect(castling).not.toContain("K");
    expect(castling).toContain("Q");
  });

  it("outputs '-' when no castling rights remain", () => {
    const gb = new Gameboard();
    // Only kings, both moved
    const wk = new King(1); wk.hasMoved = true;
    const bk = new King(2); bk.hasMoved = true;
    gb.insertPieceToTile(wk, 8, 5);
    gb.insertPieceToTile(bk, 1, 5);
    const castling = generateFEN(gb, 1).split(" ")[2];
    expect(castling).toBe("-");
  });
});

describe("generateFEN — en passant", () => {
  it("outputs en passant square after a white pawn double push", () => {
    const gb = new Gameboard();
    // Place a white pawn at e4 (row 5, col 5) — the state after the double push
    gb.insertPieceToTile(new Pawn(1), 5, 5);
    gb.insertPieceToTile(new King(1), 8, 5);
    gb.insertPieceToTile(new King(2), 1, 5);
    gb.lastMove = new Move(new Cell(7, 5), new Cell(5, 5), 1, MoveType.REGULAR);
    const fen = generateFEN(gb, 2);
    expect(fen.split(" ")[3]).toBe("e3");
  });

  it("outputs '-' for a non-pawn last move", () => {
    const gb = new Gameboard();
    // Place a rook and record a rook move as lastMove
    const rook = new Rook(1);
    gb.insertPieceToTile(rook, 5, 5);
    gb.insertPieceToTile(new King(1), 8, 5);
    gb.insertPieceToTile(new King(2), 1, 5);
    gb.lastMove = new Move(new Cell(5, 1), new Cell(5, 5), 1, MoveType.REGULAR);
    const fen = generateFEN(gb, 2);
    expect(fen.split(" ")[3]).toBe("-");
  });
});

describe("generateFEN — fullmove counter", () => {
  it("fullmove is 1 when no moves have been performed", () => {
    const gb = new Gameboard();
    gb.resetGameboard();
    const fullmove = parseInt(generateFEN(gb, 1).split(" ")[5], 10);
    expect(fullmove).toBe(1);
  });

  it("fullmove increments after every 2 performed moves", () => {
    const gb = new Gameboard();
    gb.resetGameboard();
    gb.performedMoves = 4;
    const fullmove = parseInt(generateFEN(gb, 1).split(" ")[5], 10);
    expect(fullmove).toBe(3);
  });
});

// -----------------------------------------------------------------------
// Round-trip: parseFEN → place pieces on board → generateFEN
// -----------------------------------------------------------------------

describe("FEN round-trip", () => {
  it("piece placement survives a parse → reconstruct → generate cycle", () => {
    const fen = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";
    const parsed = parseFEN(fen);

    const gb = new Gameboard();
    gb.removePieces();
    for (const t of parsed.tiles) {
      const piece = makePiece(t.pieceName, t.ownerPlayer);
      piece.hasMoved = t.hasMoved;
      gb.insertPieceToTile(piece, t.row, t.column);
    }
    gb.performedMoves = parsed.performedMoves;

    const generated = generateFEN(gb, parsed.activePlayer);
    const [genPlacement, genActive, genCastling] = generated.split(" ");
    const [origPlacement, origActive, origCastling] = fen.split(" ");

    expect(genPlacement).toBe(origPlacement);
    expect(genActive).toBe(origActive);
    expect(genCastling).toBe(origCastling);
  });
});

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

function makePiece(name: PieceName, owner: number) {
  switch (name) {
    case PieceName.KING:   return new King(owner);
    case PieceName.QUEEN:  return new Queen(owner);
    case PieceName.ROOK:   return new Rook(owner);
    case PieceName.BISHOP: return new Bishop(owner);
    case PieceName.KNIGHT: return new Knight(owner);
    case PieceName.PAWN:   return new Pawn(owner);
  }
}
