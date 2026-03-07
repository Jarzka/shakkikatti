import { Gameboard } from "../../Gameboard";
import { Move } from "../../Move";
import { AbstractPlayer } from "../AbstractPlayer";
import { PieceName } from "../../pieces/types";

// ---------------------------------------------------------------------------
// This is the new (2026) AI-assisted AI implementation.
// It is a complete rewrite of the original "Best Response" AI, with a much stronger algorithm under the hood.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Board fingerprinting ("Zobrist hashing")
//
// To avoid analysing the same board position twice, the AI needs a fast way
// to recognise when it has already seen a position. It does this by giving
// every possible (piece, square) combination a unique random number, then
// XOR-ing all of them together to produce a single number — the "fingerprint"
// — that uniquely identifies the board layout. Looking up a fingerprint in a
// dictionary is nearly instant, so the AI can skip a huge amount of redundant
// work.
//
// The random numbers are generated from a fixed seed so they are always the
// same across runs (important because the AI runs in a background thread).
// ---------------------------------------------------------------------------
function _zlcg(s: number): number {
  return (Math.imul(1664525, s) + 1013904223) | 0;
}
let _zseed = 0x12345678;
function _zrand(): number {
  _zseed = _zlcg(_zseed);
  return _zseed;
}

// Random numbers for each combination of: player (2) × piece type (6) × square (64).
const ZOBRIST: number[][][] = Array.from({ length: 2 }, () =>
  Array.from({ length: 6 }, () => Array.from({ length: 64 }, _zrand)),
);
// An extra number XOR-ed in whenever it is player 2's turn, so the same
// board position with different sides to move gets a different fingerprint.
const ZOBRIST_SIDE: number = _zrand();

const PIECE_ZI: Record<string, number> = {
  [PieceName.PAWN]: 0,
  [PieceName.KNIGHT]: 1,
  [PieceName.BISHOP]: 2,
  [PieceName.ROOK]: 3,
  [PieceName.QUEEN]: 4,
  [PieceName.KING]: 5,
};

// ---------------------------------------------------------------------------
// Result cache ("Transposition table")
//
// Chess has a lot of positions that can be reached by different sequences of
// moves. Without a cache, the AI would analyse the same position over and
// over again. The transposition table is a dictionary that maps a board
// fingerprint to the score the AI already computed for that position. If the
// AI encounters a position it has seen before — at equal or greater depth —
// it can immediately return the stored result instead of re-searching.
//
// Each entry also stores the best move found for that position so that it
// can be tried first next time, which dramatically reduces wasted work.
// ---------------------------------------------------------------------------

// These flags describe how reliable the stored score is:
const TT_EXACT = 0; // The stored score is the true best score for that position.
const TT_LOWER = 1; // The real score is at least this high (we stopped searching early because it was already great).
const TT_UPPER = 2; // The real score is at most this high (we stopped searching early because it was already bad).

type TTEntry = {
  hash: number;       // The fingerprint of the board, stored to catch accidental collisions.
  depth: number;      // How deeply this position was searched.
  score: number;      // The score found.
  flag: 0 | 1 | 2;   // How to interpret the score (see constants above).
  bestMoveKey: number; // A compact encoding of the best move found, so it can be tried first next time.
};

// Pack a move's from/to squares into a single integer so it can be stored compactly.
function encodeMoveKey(move: Move): number {
  return (
    ((move.source.row - 1) << 9) |
    ((move.source.column - 1) << 6) |
    ((move.target.row - 1) << 3) |
    (move.target.column - 1)
  );
}

function moveMatchesKey(move: Move, key: number): boolean {
  return encodeMoveKey(move) === key;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_PLY = 32;         // Maximum search depth (the AI never looks more than 32 moves ahead).
const SCORE_INF = 1_000_000; // A score so large it represents "infinity" (better than any real position).

type MoveRecord = {
  sourceRow: number;
  sourceColumn: number;
  targetRow: number;
  targetColumn: number;
};

/**
 * The main AI brain. It works by building a mental model of the game: it
 * imagines every move it could make, then every counter-move the opponent
 * could make, then its own response, and so on — up to several moves ahead.
 * At the end of each imagined sequence it scores the resulting board and
 * picks the move that leads to the best outcome assuming both sides play
 * perfectly.
 *
 * Several tricks are used to make this feasible within the time  limit:
 *
 *  1. Result cache — if the same board position is reached by different
 *     move orders, the AI reuses the score it already computed instead of
 *     searching again.
 *
 *  2. Capture extension — instead of stopping at a fixed depth mid-exchange,
 *     the AI keeps searching captures until the board is "quiet". This
 *     prevents it from being fooled by positions where a piece is about to
 *     be taken for free.
 *
 *  3. Smart move ordering — the AI tries the most promising moves first.
 *     Capturing a queen, moves that worked well earlier, and moves the cache
 *     flagged as best are all tried before quiet, speculative moves. Better
 *     ordering means far more branches can be discarded early.
 *
 *  4. Fast rejection of bad moves — after the first (and presumably best)
 *     move is fully searched, all other moves are initially checked with a
 *     very narrow "is this even worth considering?" search. Only moves that
 *     pass that quick test get a full search. This saves a lot of time.
 *
 *  5. Free-move test — the AI imagines giving the opponent an extra free
 *     move. If the opponent still can't improve their position enough to
 *     matter, the current branch is abandoned immediately, because it is
 *     already good enough without looking further.
 *
 *  6. Reduced depth for unlikely moves — moves that appear late in the
 *     priority list (and are therefore probably not great) are searched less
 *     deeply. If one of them turns out to be surprisingly good, it gets a
 *     full re-search.
 *
 *  7. Guided starting window — instead of searching the full score range
 *     from scratch each time, the AI starts each depth from a narrow range
 *     around the previous depth's score. This is usually enough, and finding
 *     the answer within a narrow range requires much less work.
 *
 *  8. Draw recognition — the AI recognises when the same board position has
 *     appeared twice in the current imagined line and scores it as a draw
 *     (0), rather than wasting time searching further.
 */
export class AiLogicAlphaSonne {
  private readonly gameboard: Gameboard;
  private readonly playerNumber: number;
  private timeLimitMs: number;
  private timestampBegin = 0;
  private readonly moveHistoryData: MoveRecord[];
  private nodesAnalyzed = 0;
  private readonly turnNumber: number;

  // ── Internal search state (reset at the start of each move decision) ──────
  private tt: Map<number, TTEntry> = new Map(); // result cache (see above)
  // "Killer moves": for each search depth, remember the last two quiet moves
  // that caused a big improvement. They are tried early in future searches at
  // the same depth because they tend to be strong moves in similar positions.
  private killers: (Move | undefined)[][] = [];
  // "History table": a score for every (from-square → to-square) pair that
  // tracks how often moving a piece to that square improved the search. Moves
  // with high history scores bubble up in the priority list, so the AI learns
  // which types of quiet move tend to be powerful in the current game.
  private history: number[][] = [];
  // A stack of board fingerprints for every position along the current imagined
  // line, used to detect when the same position is about to be repeated.
  private pathHashes: number[] = [];

  constructor(
    gameboard: Gameboard,
    playerNumber: number,
    turnNumber: number,
    timeLimitMs: number,
    moveHistoryData: MoveRecord[] = [],
  ) {
    this.gameboard = gameboard;
    this.playerNumber = playerNumber;
    this.timeLimitMs = timeLimitMs;
    this.moveHistoryData = moveHistoryData;
    this.turnNumber = turnNumber;

    // The opening phase has many roughly-equivalent moves, so spending the
    // full 2 seconds on it is wasteful. Cap the budget at 1 second for the
    // first 10 turns, preserving thinking time for the more critical
    // middlegame and endgame positions.
    if (turnNumber < 10) {
      this.timeLimitMs = Math.min(this.timeLimitMs, 1000);
    }
  }

  // ── Utility helpers ─────────────────────────────────────────────────────────

  private isTimeUp(): boolean {
    return Date.now() >= this.timestampBegin + this.timeLimitMs;
  }

  private isBannedByRepetition(move: Move): boolean {
    const count = this.moveHistoryData.filter(
      (m) =>
        m.sourceRow === move.source.row &&
        m.sourceColumn === move.source.column &&
        m.targetRow === move.target.row &&
        m.targetColumn === move.target.column,
    ).length;
    return count >= 2;
  }

  // ── Board fingerprinting ──────────────────────────────────────────────────

  /**
   * Computes a single number that uniquely represents the current board
   * layout and whose turn it is. Two boards that look the same (same pieces
   * on same squares, same side to move) will always produce the same number,
   * making cache lookups instant.
   */
  private computeHash(gameboard: Gameboard, playerNumber: number): number {
    let h = playerNumber === 2 ? ZOBRIST_SIDE : 0;
    for (const piece of gameboard.getPieces()) {
      const pi = PIECE_ZI[piece.name];
      if (pi === undefined) continue;
      const sq = (piece.row - 1) * 8 + (piece.column - 1);
      h ^= ZOBRIST[piece.ownerPlayerNumber - 1][pi][sq];
    }
    return h;
  }

  // ── Move generation & ordering ──────────────────────────────────────────────
  //
  // The order in which moves are considered has a huge impact on speed.
  // Alpha-beta search can skip entire branches once it knows the current
  // position is already worse than something found earlier. If the best move
  // is always tried first, most of the search tree can be pruned away.

  private generateAllMoves(gameboard: Gameboard, playerNumber: number): Move[] {
    const moves: Move[] = [];
    for (const piece of gameboard.findPiecesOwnedByPlayer(playerNumber)) {
      for (const move of piece.findPossibleMoves(true)) {
        moves.push(move);
      }
    }
    return moves;
  }

  private generateCaptures(gameboard: Gameboard, playerNumber: number): Move[] {
    const captures: Move[] = [];
    for (const piece of gameboard.findPiecesOwnedByPlayer(playerNumber)) {
      for (const move of piece.findPossibleMoves(true)) {
        const t = gameboard.getTileAtPosition(move.target.row, move.target.column);
        if (t?.hasPiece() && t.piece!.ownerPlayerNumber !== playerNumber) {
          captures.push(move);
        }
      }
    }
    return captures;
  }

  /**
   * Scores a capture move so that the most profitable captures are tried
   * first. The idea: use the cheapest piece to take the most valuable piece.
   * Taking a queen (9) with a pawn (1) scores 89 — best possible.
   * Taking a pawn (1) with a queen (9) scores 1 — least attractive capture.
   * Non-captures score 0 and are sorted after all captures.
   */
  private mvvLvaScore(gameboard: Gameboard, move: Move): number {
    const targetTile = gameboard.getTileAtPosition(move.target.row, move.target.column);
    if (!targetTile?.hasPiece()) return 0;
    const victimValue = targetTile.piece!.fightingValue;
    const attackerTile = gameboard.getTileAtPosition(move.source.row, move.source.column);
    const attackerValue = attackerTile?.piece?.fightingValue ?? 1;
    return victimValue * 10 - attackerValue;
  }

  /** Returns true if this move matched one of the saved "killer" moves for this depth. */
  private isKillerMove(move: Move, ply: number): boolean {
    if (ply >= MAX_PLY) return false;
    for (const k of this.killers[ply]) {
      if (
        k &&
        k.source.row === move.source.row &&
        k.source.column === move.source.column &&
        k.target.row === move.target.row &&
        k.target.column === move.target.column
      )
        return true;
    }
    return false;
  }

  /**
   * Gives each move a priority score so the list can be sorted before
   * searching. Higher priority = searched earlier = more branches pruned.
   *
   * Priority, from highest to lowest:
   *  1. The move the cache says was best last time this position was seen.
   *  2. Captures, sorted best-victim/cheapest-attacker first.
   *  3. "Killer" quiet moves that worked well at this depth recently.
   *  4. All other quiet moves, ranked by how often they were good historically.
   */
  private moveScore(
    gameboard: Gameboard,
    move: Move,
    ply: number,
    ttBestMoveKey: number | undefined,
  ): number {
    if (ttBestMoveKey !== undefined && moveMatchesKey(move, ttBestMoveKey)) return 100_000;
    const mvvLva = this.mvvLvaScore(gameboard, move);
    if (mvvLva > 0) return 10_000 + mvvLva;
    if (this.isKillerMove(move, ply)) return 9_000;
    const fromSq = (move.source.row - 1) * 8 + (move.source.column - 1);
    const toSq = (move.target.row - 1) * 8 + (move.target.column - 1);
    return this.history[fromSq][toSq];
  }

  private generateOrderedMoves(
    gameboard: Gameboard,
    playerNumber: number,
    ply: number,
    ttBestMoveKey: number | undefined,
  ): Move[] {
    const moves = this.generateAllMoves(gameboard, playerNumber);
    moves.sort(
      (a, b) =>
        this.moveScore(gameboard, b, ply, ttBestMoveKey) -
        this.moveScore(gameboard, a, ply, ttBestMoveKey),
    );
    return moves;
  }

  // ── Board scoring ─────────────────────────────────────────────────────────

  /**
   * Asks the evaluator to score the board and converts the result so that
   * a positive number always means "good for whoever is currently thinking".
   * The shared evaluator uses positive = good for white (player 1), so for
   * player 2 we simply flip the sign.
   */
  private staticEvaluate(gameboard: Gameboard, playerNumber: number): number {
    const raw = gameboard.evaluateTotalPositionPoints();
    return playerNumber === 1 ? raw : -raw;
  }

  // ── Capture extension ("Quiescence search") ─────────────────────────────

  /**
   * Without this, the AI would stop thinking at a fixed depth and score the
   * board even if a piece is about to be captured for free on the very next
   * move — a classic blind spot called the "horizon effect".
   *
   * This method keeps searching captures (and only captures) until the board
   * reaches a point where no immediate exchange is pending. Only then is the
   * position scored. This ensures the AI is never fooled by cheap tricks that
   * happen just beyond its normal search horizon.
   *
   * The "stand-pat" check: the side to move can always choose to stop
   * capturing. So if the current board score is already better than anything
   * the opponent can hope for, we stop immediately without exploring further.
   */
  private quiescence(
    gameboard: Gameboard,
    alpha: number,
    beta: number,
    playerNumber: number,
  ): number {
    if (this.isTimeUp()) return this.staticEvaluate(gameboard, playerNumber);

    this.nodesAnalyzed++;

    // If the board is already good enough without making any capture, we can
    // use this score as a safe lower bound and perhaps skip all captures.
    const standPat = this.staticEvaluate(gameboard, playerNumber);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;

    const captures = this.generateCaptures(gameboard, playerNumber);
    captures.sort((a, b) => this.mvvLvaScore(gameboard, b) - this.mvvLvaScore(gameboard, a));

    const opponent = AbstractPlayer.findOpponentForPlayer(playerNumber);

    for (const move of captures) {
      if (this.isTimeUp()) break;
      const child = gameboard.clone();
      child.movePieceImmediately(move);
      const score = -this.quiescence(child, -beta, -alpha, opponent);
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }

    return alpha;
  }

  // ── Core search ("Negamax") ───────────────────────────────────────────────

  /**
   * The heart of the AI. For every possible move it can make, it recursively
   * imagines every possible response, then every possible response to that,
   * and so on. It assumes both players always choose the best available move.
   * The result is the best achievable score for the player whose turn it is.
   *
   * alpha — the best score the current player is already guaranteed from
   *         another branch. Any branch that can't beat this is ignored.
   * beta  — the best score the opponent is already guaranteed. If the current
   *         player finds something at or above beta, the opponent would never
   *         allow this position, so searching further is pointless.
   *
   * isNullMoveAllowed — prevents two consecutive "free move" tests in a row,
   *                     which would give an unrealistic double advantage.
   */
  private negamax(
    gameboard: Gameboard,
    depth: number,
    alpha: number,
    beta: number,
    playerNumber: number,
    ply: number,
    isNullMoveAllowed: boolean,
  ): number {
    if (this.isTimeUp()) return this.staticEvaluate(gameboard, playerNumber);

    // ── Draw detection ──────────────────────────────────────────────────────
    // Compute this position's fingerprint and check whether it has appeared
    // before in the current imagined sequence of moves. If the same board
    // has occurred twice already, the game would be a draw by repetition, so
    // score it as 0 (neutral) and stop searching deeper.
    const hash = this.computeHash(gameboard, playerNumber);
    let repetitions = 0;
    for (const h of this.pathHashes) {
      if (h === hash) repetitions++;
    }
    if (repetitions >= 2) return 0; // draw by repetition

    // ── Cache lookup ────────────────────────────────────────────────────────
    // Check whether the AI has already analysed this exact board position at
    // equal or greater depth. If so, reuse the stored result — or at least
    // extract the best move found before so it gets tried first this time.
    let ttBestMoveKey: number | undefined;
    const ttEntry = this.tt.get(hash);
    if (ttEntry && ttEntry.hash === hash) {
      ttBestMoveKey = ttEntry.bestMoveKey; // try this move first (was best last time)
      if (ttEntry.depth >= depth) {
        const s = ttEntry.score;
        if (ttEntry.flag === TT_EXACT) return s;               // perfect stored score — use it directly
        if (ttEntry.flag === TT_LOWER && s > alpha) alpha = s; // stored lower bound — tighten our floor
        if (ttEntry.flag === TT_UPPER && s < beta) beta = s;   // stored upper bound — tighten our ceiling
        if (alpha >= beta) return s;                           // the window collapsed — no need to search further
      }
    }

    // ── Reached maximum planned depth — hand off to capture extension ────────
    // Rather than scoring the board immediately (which could miss a hanging
    // piece), continue searching all available captures until the board is
    // truly quiet.
    if (depth === 0) {
      this.nodesAnalyzed++;
      return this.quiescence(gameboard, alpha, beta, playerNumber);
    }

    const opponent = AbstractPlayer.findOpponentForPlayer(playerNumber);

    // ── "Free move" test ─────────────────────────────────────────────────────
    // Imagine giving the opponent an extra free move right now. If even then
    // the opponent can't improve their position beyond our current guaranteed
    // floor (beta), then the current position is already so good for us that
    // searching it further would be a waste of time — we prune the whole branch.
    //
    // Skipped in three situations where giving a free move would be misleading:
    //  - Endgame with few pieces: sometimes passing is genuinely bad ("zugzwang"),
    //    meaning any move makes the position worse. The free-move test would give
    //    a falsely optimistic result.
    //  - When our king is already in check: we must respond, so passing is illegal.
    //  - Immediately after a previous free-move test: two consecutive passes would
    //    be unrealistic and could cause wrong pruning.
    const pieceCount = gameboard.getPieces().length;
    if (isNullMoveAllowed && depth >= 3 && pieceCount > 8) {
      let kingInCheck = false;
      try {
        kingInCheck = gameboard.findKing(playerNumber).isInCheck();
      } catch { /* king not on board — treat as not in check */ }

      if (!kingInCheck) {
        // R controls how much shallower the free-move search is. Deeper
        // positions warrant a more aggressive reduction (skipping 3 plies
        // instead of 2) because the pruning is more reliable there.
        const R = depth >= 6 ? 3 : 2;
        const nullScore = -this.negamax(
          gameboard,
          depth - 1 - R,
          -beta,
          -beta + 1,
          opponent,
          ply + 1,
          false, // prevent two free-move tests in a row
        );
        if (!this.isTimeUp() && nullScore >= beta) return beta;
      }
    }

    // ── Move loop ───────────────────────────────────────────────────────────
    const moves = this.generateOrderedMoves(gameboard, playerNumber, ply, ttBestMoveKey);

    if (moves.length === 0) {
      this.nodesAnalyzed++;
      return this.staticEvaluate(gameboard, playerNumber);
    }

    const alphaOrig = alpha;
    let bestScore = -SCORE_INF;
    let bestMoveKey = 0;

    this.pathHashes.push(hash);

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      if (this.isTimeUp()) break;

      this.nodesAnalyzed++;
      const child = gameboard.clone();
      child.movePieceImmediately(move);

      const isCapture = this.mvvLvaScore(gameboard, move) > 0;
      const isKiller = this.isKillerMove(move, ply);

      let score: number;

      if (i === 0) {
        // The top-priority move gets a full search with the complete score
        // range. This is expected to be the best move so we invest full effort.
        score = -this.negamax(child, depth - 1, -beta, -alpha, opponent, ply + 1, true);
      } else {
        // All other moves use two shortcuts before committing to a full search:
        //
        // Shortcut 1 — Reduced depth for low-priority moves:
        // Moves that appear late in the priority list (quiet moves after the
        // 3rd one) are unlikely to be best. Search them less deeply to save
        // time. The reduction is larger at greater depths where the cost is
        // highest.
        let reduction = 0;
        if (depth >= 3 && i >= 3 && !isCapture && !isKiller) {
          reduction = depth >= 6 ? 2 : 1;
        }

        // Shortcut 2 — Quick "is this even worth considering?" check:
        // Search with an almost zero-width window (alpha to alpha+1). This is
        // much cheaper than a full search and answers one question: "is this
        // move strictly better than the best we already have?" If the answer
        // is no, we skip the expensive full search entirely.
        score = -this.negamax(
          child,
          depth - 1 - reduction,
          -alpha - 1,
          -alpha,
          opponent,
          ply + 1,
          true,
        );

        // If the quick check says this move IS promising (beats alpha), or if
        // we searched it at reduced depth and it passed, do a proper full search
        // to get the accurate score.
        if (!this.isTimeUp() && score > alpha && (reduction > 0 || score < beta)) {
          score = -this.negamax(child, depth - 1, -beta, -alpha, opponent, ply + 1, true);
        }
      }

      if (this.isTimeUp()) break;

      if (score > bestScore) {
        bestScore = score;
        bestMoveKey = encodeMoveKey(move);
      }

      if (score > alpha) alpha = score;

      if (alpha >= beta) {
        // This move is so good that the opponent would never allow us to reach
        // this position — they have a better option earlier in the tree.
        // Stop searching remaining moves (they can't affect the result) and
        // record this as a "killer" / boost its history score so it gets tried
        // early in future searches at the same depth.
        if (!isCapture) {
          if (ply < MAX_PLY) {
            // Store in the killer slots, evicting the oldest one.
            this.killers[ply][1] = this.killers[ply][0];
            this.killers[ply][0] = move;
          }
          // Boost the history score for this (from → to) pair. The depth²
          // weighting means a cutoff at greater depth is worth more credit.
          const fromSq = (move.source.row - 1) * 8 + (move.source.column - 1);
          const toSq = (move.target.row - 1) * 8 + (move.target.column - 1);
          this.history[fromSq][toSq] += depth * depth;
        }
        break;
      }
    }

    this.pathHashes.pop();

    // ── Save to cache ────────────────────────────────────────────────────────
    // Store this position's score and best move so that if the AI reaches
    // the same board again (via a different move order) it can skip the search.
    // The flag records whether the score is exact or just a bound, so the
    // cache entry can be interpreted correctly on the next lookup.
    if (!this.isTimeUp() && bestScore > -SCORE_INF) {
      const flag: 0 | 1 | 2 =
        bestScore >= beta    ? TT_LOWER :  // we stopped early — real score may be higher
        bestScore > alphaOrig ? TT_EXACT : // full window searched — this is the true score
                                TT_UPPER;  // no move beat alpha — real score may be lower
      this.tt.set(hash, { hash, depth, score: bestScore, flag, bestMoveKey });
    }

    return bestScore;
  }

  // ── Entry point — called once per turn to pick the AI's move ───────────────

  run(): Move | undefined {
    this.timestampBegin = Date.now();
    this.nodesAnalyzed = 0;

    // Clear all search tables from the previous turn so we start fresh.
    this.tt = new Map();
    this.killers = Array.from({ length: MAX_PLY }, () => [undefined, undefined]);
    this.history = Array.from({ length: 64 }, () => new Array(64).fill(0));
    this.pathHashes = [];

    const opponent = AbstractPlayer.findOpponentForPlayer(this.playerNumber);

    // Build the list of legal moves for this turn, removing any move that
    // would repeat the same position for the third time (which would be a
    // draw). If avoiding repetitions leaves no legal moves at all, allow all
    // moves anyway so the AI is never stuck with no options.
    const allRootMoves = this.generateOrderedMoves(
      this.gameboard,
      this.playerNumber,
      0,
      undefined,
    );
    const filtered = allRootMoves.filter((m) => !this.isBannedByRepetition(m));
    const candidates = filtered.length > 0 ? filtered : allRootMoves;

    if (candidates.length === 0) return undefined;

    let bestMove: Move = candidates[0];
    let topCandidates: Move[] = [candidates[0]];
    let previousScore = 0;

    // ── Iterative deepening ───────────────────────────────────────────────────
    // Instead of searching straight to depth 10, the AI first searches just
    // 1 move ahead, then 2, then 3, and so on. This sounds wasteful, but each
    // completed depth only takes a fraction of the time of the next one, and
    // the results from shallower searches make deeper searches much more
    // efficient (better move ordering). Most importantly, when time runs out
    // the AI always has a result from the last fully completed depth.
    for (let depth = 1; depth <= 10; depth++) {
      if (this.isTimeUp()) break;

      // ── Guided score window ("Aspiration windows") ───────────────────────
      // Searching the full score range [-∞, +∞] wastes time. Because the
      // score rarely changes dramatically between depths, we start each depth
      // with a narrow window around the previous depth's score. If the true
      // score falls outside this window, we widen it and try again — up to
      // 4 times. In practice the initial window hits most of the time, so
      // the search is much faster on average.
      let delta = 0.5; // initial window half-width in pawn units
      let lo = depth >= 3 ? previousScore - delta : -SCORE_INF;
      let hi = depth >= 3 ? previousScore + delta : SCORE_INF;

      let depthBestMove: Move | undefined;
      let depthBestScore = -SCORE_INF;
      let depthMoveScores: { move: Move; score: number }[] = [];
      let windowAccepted = false;

      for (let attempt = 0; attempt < 4 && !windowAccepted; attempt++) {
        let alpha = lo;
        let localBestMove: Move | undefined;
        let localBestScore = -SCORE_INF;
        const localMoveScores: { move: Move; score: number }[] = [];

        for (const move of candidates) {
          if (this.isTimeUp()) break;

          const child = this.gameboard.clone();
          child.movePieceImmediately(move);

          const score = -this.negamax(child, depth - 1, -hi, -alpha, opponent, 1, true);
          localMoveScores.push({ move, score });

          if (score > localBestScore) {
            localBestScore = score;
            localBestMove = move;
          }
          if (score > alpha) alpha = score;
        }

        if (this.isTimeUp()) {
          // Time ran out mid-search. Keep whatever partial results we have
          // but do not commit them — only fully completed depths are trusted.
          depthBestMove = localBestMove;
          depthBestScore = localBestScore;
          depthMoveScores = localMoveScores;
          break;
        }

        if (localBestScore <= lo && lo > -SCORE_INF) {
          // The score came back below our expected floor — the position is
          // worse than anticipated. Remove the lower bound and search again
          // with a wider window.
          lo = -SCORE_INF;
          delta *= 2;
          hi = Math.min(SCORE_INF, localBestScore + delta);
          continue;
        }

        if (localBestScore >= hi && hi < SCORE_INF) {
          // The score came back above our expected ceiling — the position is
          // better than anticipated. Remove the upper bound and search again.
          hi = SCORE_INF;
          delta *= 2;
          lo = Math.max(-SCORE_INF, localBestScore - delta);
          continue;
        }

        // Score landed inside the window — result is reliable, accept it.
        depthBestMove = localBestMove;
        depthBestScore = localBestScore;
        depthMoveScores = localMoveScores;
        windowAccepted = true;
      }

      // Only record a result if the entire depth finished before time ran out.
      // A partially-searched depth might favour a move that hasn't been fully
      // checked yet, so it is discarded.
      if (!this.isTimeUp() && depthBestMove !== undefined) {
        bestMove = depthBestMove;
        previousScore = depthBestScore;

        depthMoveScores.sort((a, b) => b.score - a.score);
        topCandidates = depthMoveScores.slice(0, 2).map((ms) => ms.move);

        // Re-sort the candidate list using the scores just computed. This means
        // the next (deeper) search will try the currently best moves first,
        // leading to much earlier pruning and saving significant time.
        const scoreMap = new Map(depthMoveScores.map((ms) => [ms.move, ms.score]));
        candidates.sort(
          (a, b) => (scoreMap.get(b) ?? -SCORE_INF) - (scoreMap.get(a) ?? -SCORE_INF),
        );

        console.log(
          `[AI AlphaSonne] depth ${depth} | score: ${depthBestScore.toFixed(2)} | nodes: ${this.nodesAnalyzed} | tt: ${this.tt.size}`,
        );
      }
    }

    console.log(`[AI AlphaSonne] total nodes: ${this.nodesAnalyzed}`);

    // In the opening, randomly choose between the top 2 moves to avoid
    // always playing the exact same game. This adds variety without
    // sacrificing quality, since the top moves are very close in score.
    if (this.turnNumber < 10 && topCandidates.length > 1) {
      return topCandidates[Math.floor(Math.random() * topCandidates.length)];
    }
    return bestMove;
  }
}
