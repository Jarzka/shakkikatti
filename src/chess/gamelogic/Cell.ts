/**
 * Cell represents a position in the gameboard, containing row and column.
 * Cell is 1-indexed.
 */
export class Cell {
  row: number;
  column: number;

  constructor(row: number, column: number);
  constructor(source: Cell);
  constructor(rowOrSource: number | Cell, column?: number) {
    if (typeof rowOrSource === "number") {
      this.row = rowOrSource;
      this.column = column!;
    } else {
      this.row = rowOrSource.row;
      this.column = rowOrSource.column;
    }
  }

  clone(): Cell {
    return new Cell(this.row, this.column);
  }

  hasSameRowAndColumn(cell: Cell): boolean {
    return this.row === cell.row && this.column === cell.column;
  }

  /** Returns true if the cell is located in the center of the board. */
  isLocatedInCenter(): boolean {
    return (
      this.row >= 4 && this.row <= 5 && this.column >= 4 && this.column <= 5
    );
  }
}
