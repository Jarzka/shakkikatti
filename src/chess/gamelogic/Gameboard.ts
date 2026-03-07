import {
  ChessException,
  IllegalMoveException,
  KingNotFoundException,
} from "../exceptions";
import { Cell } from "./Cell";
import { GamePhase, MoveType, TileColor } from "./enums";
import { GameboardEvaluator } from "./GameboardEvaluator";
import { Move } from "./Move";
import { Tile } from "./Tile";
import { Piece } from "./pieces/Piece";
import { King } from "./pieces/King";
import { Queen } from "./pieces/Queen";
import { Rook } from "./pieces/Rook";
import { Bishop } from "./pieces/Bishop";
import { Knight } from "./pieces/Knight";
import { Pawn } from "./pieces/Pawn";
import { PieceName } from "./pieces/types";

/**
 * Represents a gameboard, which consists of tiles.
 *  ABCDEFGH
 * 1
 * 2
 * ...
 * 8
 *
 * Player 1 (white) starts from rows 7 and 8.
 * Player 2 (black) starts from rows 1 and 2.
 */
export class Gameboard {
  private tiles: Tile[] = [];
  ownerGameSession: unknown;
  private boardSize = 8;
  private _performedMoves = 0;
  private readonly evaluator: GameboardEvaluator;
  /** Cells that should display a cross marker (banned repeated moves). */
  private _crossMarkedCells: Cell[] = [];
  /** The last move performed on this board */
  private _lastMove: Move | undefined = undefined;
  private _lastMoveWasCapture = false;
  private _lastMovedPieceName: PieceName | undefined = undefined;

  positionX = 0;
  positionY = 0;

  constructor(owner?: unknown) {
    this.ownerGameSession = owner;
    this.initializeTiles();
    this.evaluator = new GameboardEvaluator(this);
  }

  clone(): Gameboard {
    const cloneBoard = new Gameboard();
    cloneBoard.ownerGameSession = this.ownerGameSession;
    cloneBoard._performedMoves = this._performedMoves;
    cloneBoard.positionX = this.positionX;
    cloneBoard.positionY = this.positionY;
    cloneBoard._lastMove = this._lastMove;

    // Deep copy: re-create pieces in the clone's tiles
    for (const tileSource of this.tiles) {
      if (tileSource.hasPiece()) {
        const tileClone = cloneBoard.getTileAtPosition(
          tileSource.position.row,
          tileSource.position.column,
        )!;
        const pieceClone = tileSource.piece!.clone();
        tileClone.setPiece(pieceClone);
      }
    }

    return cloneBoard;
  }

  get lastMove(): Move | undefined {
    return this._lastMove;
  }

  set lastMove(move: Move | undefined) {
    this._lastMove = move;
  }

  get lastMoveWasCapture(): boolean {
    return this._lastMoveWasCapture;
  }

  get lastMovedPieceName(): PieceName | undefined {
    return this._lastMovedPieceName;
  }

  markAllPiecesUnselected(): void {
    for (const piece of this.getPieces()) {
      piece.isSelected = false;
    }
    this._crossMarkedCells = [];
  }

  set crossMarkedCells(cells: Cell[]) {
    this._crossMarkedCells = cells;
  }

  get crossMarkedCells(): Cell[] {
    return this._crossMarkedCells;
  }

  getCurrentGamePhase(): GamePhase {
    let gamePhase = GamePhase.OPENING;

    if (this._performedMoves > 20) {
      gamePhase = GamePhase.MIDDLEGAME;
    }

    if (this.getPieces().length <= 10) {
      gamePhase = GamePhase.ENDGAME;
    }

    return gamePhase;
  }

  private initializeTiles(): void {
    this.tiles = [];

    let tileColor = TileColor.WHITE;
    for (let i = 1; i <= this.boardSize; i++) {
      tileColor =
        tileColor === TileColor.WHITE ? TileColor.BLACK : TileColor.WHITE;

      for (let j = 1; j <= this.boardSize; j++) {
        tileColor =
          tileColor === TileColor.WHITE ? TileColor.BLACK : TileColor.WHITE;

        const tile = new Tile(this, new Cell(i, j), tileColor);
        this.tiles.push(tile);
      }
    }
  }

  resetGameboard(): void {
    this.removeAllPieces();
    this.resetWhitePieces();
    this.resetBlackPieces();
    this._performedMoves = 0;
    this._lastMove = undefined;
    this._lastMoveWasCapture = false;
    this._lastMovedPieceName = undefined;
  }

  private resetBlackPieces(): void {
    for (let i = 1; i <= this.boardSize; i++) {
      this.getTileAtPosition(2, i)!.setPiece(new Pawn(2));
    }

    this.getTileAtPosition(1, 5)!.setPiece(new King(2));
    this.getTileAtPosition(1, 4)!.setPiece(new Queen(2));
    this.getTileAtPosition(1, 6)!.setPiece(new Bishop(2));
    this.getTileAtPosition(1, 3)!.setPiece(new Bishop(2));
    this.getTileAtPosition(1, 2)!.setPiece(new Knight(2));
    this.getTileAtPosition(1, 7)!.setPiece(new Knight(2));
    this.getTileAtPosition(1, 8)!.setPiece(new Rook(2));
    this.getTileAtPosition(1, 1)!.setPiece(new Rook(2));
  }

  private resetWhitePieces(): void {
    for (let i = 1; i <= this.boardSize; i++) {
      this.getTileAtPosition(7, i)!.setPiece(new Pawn(1));
    }

    this.getTileAtPosition(8, 5)!.setPiece(new King(1));
    this.getTileAtPosition(8, 4)!.setPiece(new Queen(1));
    this.getTileAtPosition(8, 6)!.setPiece(new Bishop(1));
    this.getTileAtPosition(8, 3)!.setPiece(new Bishop(1));
    this.getTileAtPosition(8, 2)!.setPiece(new Knight(1));
    this.getTileAtPosition(8, 7)!.setPiece(new Knight(1));
    this.getTileAtPosition(8, 8)!.setPiece(new Rook(1));
    this.getTileAtPosition(8, 1)!.setPiece(new Rook(1));
  }

  private removeAllPieces(): void {
    for (const tile of this.tiles) {
      tile.removePiece();
    }
  }

  /**
   * Moves a piece from the source tile to the target tile.
   * Does not check if the piece type is allowed to make the asked move.
   * If the target tile has an enemy piece, it will be killed.
   */
  movePieceImmediately(move: Move): void {
    const tileSource = this.getTileAtPosition(
      move.source.row,
      move.source.column,
    );
    const tileTarget = this.getTileAtPosition(
      move.target.row,
      move.target.column,
    );

    if (tileSource === undefined) {
      throw new ChessException("Source tile is undefined.");
    }

    if (tileSource.piece === undefined) {
      throw new IllegalMoveException(
        `Source tile (${tileSource.position.row},${tileSource.position.column}) does not have a piece.`,
      );
    }

    if (tileTarget === undefined) {
      throw new ChessException("Target tile is undefined.");
    }

    this._lastMoveWasCapture =
      tileTarget.hasPiece() || move.type === MoveType.SPECIAL_EN_PASSANT;
    this._lastMovedPieceName = tileSource.piece!.name;

    // Target tile is not empty
    if (tileTarget.hasPiece()) {
      if (
        tileTarget.piece!.ownerPlayerNumber !==
        tileSource.piece!.ownerPlayerNumber
      ) {
        tileTarget.piece!.die();
      } else {
        throw new IllegalMoveException(
          `Can not move the piece to the tile which already has a piece owned by the same player` +
            ` (from ${move.source.row},${move.source.column}` +
            ` to ${move.target.row},${move.target.column}).`,
        );
      }
    }

    const piece = tileSource.piece!;
    tileSource.removePiece();
    tileTarget.setPiece(piece);

    // En passant: remove the captured pawn, which is beside the capturing pawn
    if (move.type === MoveType.SPECIAL_EN_PASSANT) {
      const capturedPawnTile = this.getTileAtPosition(
        move.source.row,
        move.target.column,
      );
      capturedPawnTile?.piece?.die();
    }

    // Castling: also move the rook to its new square.
    // King-side: king lands on col 7, rook moves from col 8 → col 6.
    // Queen-side: king lands on col 3, rook moves from col 1 → col 4.
    if (move.type === MoveType.SPECIAL_CASTLING) {
      const row = move.target.row;
      const isKingSide = move.target.column > move.source.column;
      const rookSourceColumn = isKingSide ? 8 : 1;
      const rookTargetColumn = isKingSide ? move.target.column - 1 : move.target.column + 1;
      const rookSourceTile = this.getTileAtPosition(row, rookSourceColumn);
      const rookTargetTile = this.getTileAtPosition(row, rookTargetColumn);
      if (
        rookSourceTile !== undefined &&
        rookTargetTile !== undefined &&
        rookSourceTile.hasPiece()
      ) {
        const rook = rookSourceTile.piece!;
        rookSourceTile.removePiece();
        rookTargetTile.setPiece(rook);
        rook.hasMoved = true;
      }
    }

    this.checkFinalRowForPawns(piece);
    piece.hasMoved = true;

    this._lastMove = move;
    this._performedMoves++;
  }

  private checkFinalRowForPawns(piece: Piece): boolean {
    if (piece.name !== PieceName.PAWN) return false;

    const pawn = piece as Pawn;

    if (
      (pawn.ownerPlayerNumber === 1 &&
        pawn.ownerTile!.position.row === 1) ||
      (pawn.ownerPlayerNumber === 2 && pawn.ownerTile!.position.row === 8)
    ) {
      pawn.promote();
      return true;
    }

    return false;
  }

  // --- Evaluation (delegated to GameboardEvaluator) ---

  /** > 0 means white advantage, < 0 means black advantage. */
  evaluateTotalPositionPoints(): number {
    return this.evaluator.evaluateTotalPositionPoints();
  }

  evaluatePieces(): number {
    return this.evaluator.evaluatePieces();
  }

  evaluateAdvancedPawns(): number {
    return this.evaluator.evaluateAdvancedPawns();
  }

  evaluateDoubledPawns(): number {
    return this.evaluator.evaluateDoubledPawns();
  }

  evaluateIsolatedPawns(): number {
    return this.evaluator.evaluateIsolatedPawns();
  }

  evaluateBishopPair(): number {
    return this.evaluator.evaluateBishopPair();
  }

  evaluateGamePhases(): number {
    return this.evaluator.evaluateGamePhases();
  }

  evaluateAttacks(): number {
    return this.evaluator.evaluateAttacks();
  }

  evaluateFavorableExchanges(): number {
    return this.evaluator.evaluateFavorableExchanges();
  }

  evaluateMaterialDominance(): number {
    return this.evaluator.evaluateMaterialDominance();
  }

  evaluateProtectedPieces(): number {
    return this.evaluator.evaluateProtectedPieces();
  }

  evaluateCenterControl(): number {
    return this.evaluator.evaluateCenterControl();
  }

  evaluateMobility(): number {
    return this.evaluator.evaluateMobility();
  }

  evaluateKingProtection(): number {
    return this.evaluator.evaluateKingProtection();
  }

  evaluateCheck(): number {
    return this.evaluator.evaluateCheck();
  }

  evaluateCheckmate(): number {
    return this.evaluator.evaluateCheckmate();
  }

  evaluatePassedPawns(): number {
    return this.evaluator.evaluatePassedPawns();
  }

  evaluateRooksOnOpenColumns(): number {
    return this.evaluator.evaluateRooksOnOpenColumns();
  }

  evaluatePieceSquareTables(): number {
    return this.evaluator.evaluatePieceSquareTables();
  }

  // --- Piece management ---

  removePiece(piece: Piece): void {
    piece.ownerTile!.removePiece();
  }

  getTiles(): Tile[] {
    return this.tiles;
  }

  getPieces(): Piece[] {
    const pieces: Piece[] = [];
    for (const tile of this.tiles) {
      if (tile.piece !== undefined) {
        pieces.push(tile.piece);
      }
    }
    return pieces;
  }

  findPiecesByType(pieceName: PieceName): Piece[] {
    return this.tiles
      .filter((t) => t.piece !== undefined && t.piece.name === pieceName)
      .map((t) => t.piece!);
  }

  findPiecesByTypeAndOwnerPlayer(
    pieceName: PieceName,
    playerNumber: number,
  ): Piece[] {
    return this.tiles
      .filter(
        (t) =>
          t.piece !== undefined &&
          t.piece.name === pieceName &&
          t.piece.ownerPlayerNumber === playerNumber,
      )
      .map((t) => t.piece!);
  }

  findPiecesOwnedByPlayer(playerNumber: number): Piece[] {
    return this.getPieces().filter((p) => p.ownerPlayerNumber === playerNumber);
  }

  insertPieceToTile(piece: Piece, row: number, column: number): void;
  insertPieceToTile(piece: Piece, targetCell: Cell): void;
  insertPieceToTile(
    piece: Piece,
    rowOrCell: number | Cell,
    column?: number,
  ): void {
    const cell =
      rowOrCell instanceof Cell ? rowOrCell : new Cell(rowOrCell, column!);

    const tile = this.getTileAtPosition(cell.row, cell.column);
    if (tile === undefined) {
      throw new ChessException("Tile not found!");
    }
    tile.setPiece(piece);
  }

  /**
   * Returns undefined if the tile is not found.
   */
  getTileAtPosition(row: number, column: number): Tile | undefined {
    if (row < 1 || row > 8 || column < 1 || column > 8) {
      return undefined;
    }

    // Fast index lookup
    const tileGuess = this.tiles[(row - 1) * 8 + (column - 1)];
    if (
      tileGuess !== undefined &&
      tileGuess.position.row === row &&
      tileGuess.position.column === column
    ) {
      return tileGuess;
    }

    // Fallback linear search
    for (const tile of this.tiles) {
      if (tile.position.row === row && tile.position.column === column) {
        return tile;
      }
    }

    return undefined;
  }

  findKing(ownerPlayer: number): King {
    for (const piece of this.findPiecesOwnedByPlayer(ownerPlayer)) {
      if (piece.name === PieceName.KING) {
        return piece as King;
      }
    }
    throw new KingNotFoundException("The king was not found.");
  }

  changePieceType(piece: Piece, newType: PieceName): void {
    const tile = piece.ownerTile!;
    const playerOwner = piece.ownerPlayerNumber;
    piece.die();

    if (newType === PieceName.QUEEN) {
      const queen = new Queen(playerOwner);
      tile.setPiece(queen);
    }
  }

  findPiecesBetweenCellsInRow(cell1: Cell, cell2: Cell): Piece[] {
    if (cell1.row !== cell2.row) {
      throw new ChessException("Cells should be located in the same row.");
    }

    let left = cell1;
    let right = cell2;
    if (left.column > right.column) {
      [left, right] = [right, left];
    }

    const pieces: Piece[] = [];
    const row = left.row;

    for (let i = left.column + 1; i < right.column; i++) {
      const tile = this.getTileAtPosition(row, i);
      if (tile !== undefined && tile.hasPiece()) {
        pieces.push(tile.piece!);
      }
    }

    return pieces;
  }

  removePieces(): void {
    for (const tile of this.tiles) {
      tile.removePiece();
    }
  }

  get performedMoves(): number {
    return this._performedMoves;
  }

  /** Used by the gameboard serializer to restore move count after deserialization. */
  set performedMoves(count: number) {
    this._performedMoves = count;
  }
}
