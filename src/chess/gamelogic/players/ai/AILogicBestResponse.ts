import { ChessException } from "../../../exceptions";
import { Gameboard } from "../../Gameboard";
import { Move } from "../../Move";
import { AbstractPlayer } from "../AbstractPlayer";
import { Tree } from "./Tree";
import { TreeNode } from "./TreeNode";
import { AiLogicAlphaSonne } from "./AiLogicAlphaSonne";
import { AIAlgorithm } from "./aiTypes";

// ---------------------------------------------------------------------------
// The original algorithm from Java version (2014) ported to TypeScript.
// It only evaluates opponent's best response to each of the AI's possible moves.
// ---------------------------------------------------------------------------

type MoveRecord = {
  sourceRow: number;
  sourceColumn: number;
  targetRow: number;
  targetColumn: number;
};

/**
 * Entry point used by the Web Worker (and tests).
 */
export function runAI(
  gameboard: Gameboard,
  playerNumber: number,
  turnNumber: number,
  timeLimitMs: number,
  moveHistoryData: MoveRecord[] = [],
  algorithm: AIAlgorithm = AIAlgorithm.BEST_RESPONSE,
): Move | undefined {
  if (algorithm === AIAlgorithm.ALPHA_SONNE) {
    const ai = new AiLogicAlphaSonne(
      gameboard,
      playerNumber,
      turnNumber,
      timeLimitMs,
      moveHistoryData,
    );
    return ai.run();
  }

  const ai = new AILogicBestResponse(
    gameboard,
    playerNumber,
    turnNumber,
    timeLimitMs,
    moveHistoryData,
  );
  return ai.run();
}

class AILogicBestResponse {
  private tree!: Tree;
  private gameboard: Gameboard;
  private playerNumber: number;
  private timeLimitMs: number;
  private timestampBegin = 0;
  private moveHistoryData: MoveRecord[];
  private readonly turnNumber: number;

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

    // Shorter time for early moves
    if (turnNumber < 10) {
      this.timeLimitMs = Math.min(this.timeLimitMs, 1000);
    }
  }

  /**
   * Returns true if the given source→target pair has appeared >= 2 times
   * in the stored move history (i.e. the move is banned by the repetition rule).
   */
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

  run(): Move | undefined {
    this.timestampBegin = Date.now();

    this.constructTree();

    if (this.tree.getFirstTopNode().hasChildren()) {
      this.developTree();
      console.log(`[AI BestResponse] nodes analysed: ${this.tree.getNumberOfNodes()}`);
      const bestNode =
        this.findNodeThatHasBestRoutePointsForCurrentPlayerAtBottom();
      return this.createMoveTowardsNode(bestNode);
    }

    // Stalemate — no moves possible
    return undefined;
  }

  private constructTree(): void {
    this.tree = new Tree();
    const topNode = new TreeNode(this.gameboard.clone());
    this.tree.addNodeOnTopOfTree(topNode);
    this.addFullMoveAsChild(topNode);
  }

  private addFullMoveAsChild(node: TreeNode): void {
    // Find all possible moves for the current player
    const ownMoves = this.findPossibleMovesForPlayer(node, this.playerNumber);

    // For every own move, find the opponent's best counter-move
    const opponentNumber = AbstractPlayer.findOpponentForPlayer(
      this.playerNumber,
    );
    for (const ownMove of ownMoves) {
      const opponentMoves = this.findPossibleMovesForPlayer(
        ownMove,
        opponentNumber,
      );

      if (opponentMoves.length > 0) {
        const opponentBest = this.findNodeThatHasBestPositionPointsForPlayer(
          opponentMoves,
          opponentNumber,
        );
        ownMove.addChild(opponentBest);
      }
    }

    node.addChild(ownMoves);
  }

  private findPossibleMovesForPlayer(
    parentNode: TreeNode,
    playerNumber: number,
  ): TreeNode[] {
    const newNodes: TreeNode[] = [];

    for (const piece of parentNode
      .gameboard
      .findPiecesOwnedByPlayer(playerNumber)) {
      for (const move of piece.findPossibleMoves(true)) {
        const newGameboard = parentNode.gameboard.clone();
        newGameboard.movePieceImmediately(move);
        const newNode = new TreeNode(
          newGameboard,
          parentNode,
          playerNumber,
          move,
        );
        newNodes.push(newNode);
      }
    }

    // At the root-level expansion for the AI player, filter out moves that are
    // banned by the repetition rule. If filtering would leave no moves, allow
    // all (fallback to avoid deadlock in extreme edge cases).
    if (
      playerNumber === this.playerNumber &&
      parentNode.parent === undefined &&
      this.moveHistoryData.length > 0
    ) {
      const filtered = newNodes.filter(
        (node) => !this.isBannedByRepetition(node.move!),
      );
      if (filtered.length > 0) {
        // Replace the list in-place so the shuffle below operates on it
        newNodes.length = 0;
        newNodes.push(...filtered);
      }
    }

    // Shuffle to add variety
    for (let i = newNodes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newNodes[i], newNodes[j]] = [newNodes[j], newNodes[i]];
    }

    return newNodes;
  }

  private findNodeThatHasBestPositionPointsForPlayer(
    nodes: TreeNode[],
    playerNumber: number,
  ): TreeNode {
    if (nodes.length === 0) {
      throw new ChessException("The list can not be empty!");
    }

    let best = nodes[0];
    for (const node of nodes) {
      best = this.findBetterPositionNode(best, node, playerNumber);
    }
    return best;
  }

  private findBetterPositionNode(
    node1: TreeNode,
    node2: TreeNode,
    playerNumber: number,
  ): TreeNode {
    if (playerNumber === 1) {
      return node1.positionPoints > node2.positionPoints ? node1 : node2;
    } else {
      return node1.positionPoints > node2.positionPoints ? node2 : node1;
    }
  }

  private developTree(): void {
    while (Date.now() < this.timestampBegin + this.timeLimitMs) {
      const leaves = this.tree.findNodesWithoutChildren();
      if (leaves.length === 0) break;
      const best = this.findNodeThatHasBestRoutePointsForPlayer(
        leaves,
        this.playerNumber,
      );
      this.addFullMoveAsChild(best);
    }
  }

  private findNodeThatHasBestRoutePointsForPlayer(
    nodes: TreeNode[],
    playerNumber: number,
  ): TreeNode {
    if (nodes.length === 0) {
      throw new ChessException("The list can not be empty!");
    }

    let best = nodes[0];
    for (const node of nodes) {
      best = this.findBetterRouteNode(best, node, playerNumber);
    }
    return best;
  }

  private findBetterRouteNode(
    node1: TreeNode,
    node2: TreeNode,
    playerNumber: number,
  ): TreeNode {
    if (playerNumber === 1) {
      return node1.routePoints > node2.routePoints ? node1 : node2;
    } else {
      return node1.routePoints > node2.routePoints ? node2 : node1;
    }
  }

  private findNodeThatHasBestRoutePointsForCurrentPlayerAtBottom(): TreeNode {
    const endNodes = this.tree.findNodesWithoutChildren();

    if (this.turnNumber < 10) {
      const top = this.findTopNNodesByRoutePoints(endNodes, this.playerNumber, 2);
      // Pick randomly for the first few moves to add variety and avoid deterministic play patterns.
      return top[Math.floor(Math.random() * top.length)];
    }

    return this.findNodeThatHasBestRoutePointsForPlayer(endNodes, this.playerNumber);
  }

  private findTopNNodesByRoutePoints(nodes: TreeNode[], playerNumber: number, n: number): TreeNode[] {
    const sorted = [...nodes].sort((a, b) =>
      playerNumber === 1 ? b.routePoints - a.routePoints : a.routePoints - b.routePoints,
    );
    return sorted.slice(0, Math.min(n, sorted.length));
  }

  createMoveTowardsNode(node: TreeNode): Move {
    if (node === this.tree.getFirstTopNode()) {
      throw new ChessException("The node can not be the top node.");
    }

    let current = node;
    while (true) {
      if (current.parent!.levelInTree === 1) {
        break;
      }
      current = current.parent!;
    }

    return current.move!;
  }
}
