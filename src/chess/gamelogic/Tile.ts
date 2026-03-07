import { Cell } from "./Cell";
import { TileColor } from "./enums";
import type { Piece } from "./pieces/Piece";
import type { Gameboard } from "./Gameboard";

/**
 * A Tile represents a tile in the gameboard.
 * One tile can have one or zero pieces.
 */
export class Tile {
  ownerGameboard: Gameboard | undefined;
  piece: Piece | undefined;
  position: Cell;
  color: TileColor;

  constructor(
    gameboard: Gameboard | undefined,
    position: Cell,
    color: TileColor,
    piece?: Piece,
  ) {
    this.ownerGameboard = gameboard;
    this.position = position;
    this.color = color;
    this.piece = piece;
    if (piece) {
      piece.ownerTile = this;
    }
  }

  /**
   * The cloned tile has the same owner gameboard as the source.
   * The piece (if any) is also cloned with the tile.
   */
  clone(): Tile {
    const clonedPosition = this.position.clone();
    const clone = new Tile(this.ownerGameboard, clonedPosition, this.color);
    if (this.piece !== undefined) {
      const clonedPiece = this.piece.clone();
      clone.setPiece(clonedPiece);
    }
    return clone;
  }

  /** Tells also the piece that this tile is now the piece's owner. */
  setPiece(piece: Piece): void {
    this.piece = piece;
    piece.ownerTile = this;
  }

  getRow(): number {
    return this.position.row;
  }

  getColumn(): number {
    return this.position.column;
  }

  /** Adds the given row and column offset and returns the adjacent tile. */
  getAdjacentTile(rowOffset: number, columnOffset: number): Tile | undefined {
    if (this.ownerGameboard === undefined) return undefined;
    return this.ownerGameboard.getTileAtPosition(
      this.position.row + rowOffset,
      this.position.column + columnOffset,
    );
  }

  hasPiece(): boolean {
    return this.piece !== undefined;
  }

  removePiece(): void {
    this.piece = undefined;
  }
}
