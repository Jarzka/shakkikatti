export class ChessException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChessException";
  }
}

export class IllegalMoveException extends ChessException {
  constructor(message: string) {
    super(message);
    this.name = "IllegalMoveException";
  }
}

export class KingNotFoundException extends ChessException {
  constructor(message: string) {
    super(message);
    this.name = "KingNotFoundException";
  }
}

