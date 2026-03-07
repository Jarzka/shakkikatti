import { describe, it, expect } from "vitest";
import { Tile } from "./Tile";
import { Cell } from "./Cell";
import { TileColor } from "./enums";
import { Pawn } from "./pieces/Pawn";

describe("Tile", () => {
  it("testClone", () => {
    const tileSource = new Tile(undefined, new Cell(1, 1), TileColor.BLACK);
    tileSource.setPiece(new Pawn(1));

    const tileClone = tileSource.clone();

    // Check that the clone's attributes are the same as the source's attributes
    expect(tileSource.color).toBe(tileClone.color);
    expect(tileSource.getRow()).toBe(tileClone.getRow());
    expect(tileSource.getColumn()).toBe(tileClone.getColumn());

    // DEEP COPY CHECK: clone's piece is NOT the same object
    expect(tileSource.piece).not.toBe(tileClone.piece);
    // clone's cell is NOT the same object
    expect(tileSource.position).not.toBe(tileClone.position);
  });

  it("testSetPiece", () => {
    const tile = new Tile(undefined, new Cell(1, 1), TileColor.BLACK);
    const pawn = new Pawn(1);

    tile.setPiece(pawn);

    expect(tile.piece).toBe(pawn);
    expect(pawn.ownerTile).toBe(tile);
  });
});
