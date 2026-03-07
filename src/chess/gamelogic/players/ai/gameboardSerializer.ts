import { Cell } from "../../Cell";
import { Gameboard } from "../../Gameboard";
import { MoveType } from "../../enums";
import { Move } from "../../Move";
import { Bishop } from "../../pieces/Bishop";
import { King } from "../../pieces/King";
import { Knight } from "../../pieces/Knight";
import { Pawn } from "../../pieces/Pawn";
import { Piece } from "../../pieces/Piece";
import { Queen } from "../../pieces/Queen";
import { Rook } from "../../pieces/Rook";
import { PieceName } from "../../pieces/types";
import { serializeMove } from "./aiTypes";
import type { SerializedGameboard } from "./aiTypes";

/**
 * Serialize a Gameboard into a plain object that can be sent via postMessage.
 */
export function serializeGameboard(gb: Gameboard): SerializedGameboard {
  const tiles = gb.getTiles().map((tile) => ({
    row: tile.position.row,
    column: tile.position.column,
    piece:
      tile.piece !== undefined
        ? {
            name: tile.piece.name,
            ownerPlayer: tile.piece.ownerPlayerNumber,
            hasMoved: tile.piece.hasMoved,
          }
        : undefined,
  }));

  return {
    tiles,
    countPerformedMoves: gb.performedMoves,
    lastMove: gb.lastMove !== undefined ? serializeMove(gb.lastMove) : undefined,
  };
}

/**
 * Deserialize a plain object back into a full Gameboard.
 */
export function deserializeGameboard(data: SerializedGameboard): Gameboard {
  const gb = new Gameboard();

  // Place pieces based on serialized data
  for (const tileData of data.tiles) {
    if (tileData.piece !== undefined) {
      const piece = createPiece(
        tileData.piece.name as PieceName,
        tileData.piece.ownerPlayer,
      );
      piece.hasMoved = tileData.piece.hasMoved;
      gb.insertPieceToTile(piece, tileData.row, tileData.column);
    }
  }

  // Restore performed moves count (used for game phase detection)
  gb.performedMoves = data.countPerformedMoves;

  // Restore last move so en passant can be detected inside the worker
  if (data.lastMove !== undefined) {
    const lm = data.lastMove;
    gb.lastMove = new Move(
      new Cell(lm.sourceRow, lm.sourceColumn),
      new Cell(lm.targetRow, lm.targetColumn),
      lm.playerNumber,
      (lm.type as MoveType) ?? MoveType.REGULAR,
    );
  }

  return gb;
}

function createPiece(name: PieceName, ownerPlayer: number): Piece {
  switch (name) {
    case PieceName.KING:
      return new King(ownerPlayer);
    case PieceName.QUEEN:
      return new Queen(ownerPlayer);
    case PieceName.ROOK:
      return new Rook(ownerPlayer);
    case PieceName.BISHOP:
      return new Bishop(ownerPlayer);
    case PieceName.KNIGHT:
      return new Knight(ownerPlayer);
    case PieceName.PAWN:
      return new Pawn(ownerPlayer);
    default:
      throw new Error(`Unknown piece name: ${name}`);
  }
}
