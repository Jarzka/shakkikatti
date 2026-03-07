export enum MoveType {
  REGULAR = "REGULAR",
  SPECIAL_CASTLING = "SPECIAL_CASTLING",
  SPECIAL_EN_PASSANT = "SPECIAL_EN_PASSANT",
}

export enum TileColor {
  WHITE = "WHITE",
  BLACK = "BLACK",
}

export enum GamePhase {
  OPENING = "OPENING",
  MIDDLEGAME = "MIDDLEGAME",
  ENDGAME = "ENDGAME",
}

export enum GameSessionStateName {
  PLAY = "PLAY",
  GAME_OVER = "GAME_OVER",
}
