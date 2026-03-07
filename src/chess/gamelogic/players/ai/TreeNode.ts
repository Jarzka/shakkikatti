import { Gameboard } from "../../Gameboard";
import { Move } from "../../Move";

export class TreeNode {
  private _gameboard: Gameboard;
  private _parent: TreeNode | undefined;
  private _children: TreeNode[] = [];
  private _lastMovePlayer = 0;
  private _lastMove: Move | undefined;
  private _levelInTree: number;
  private _positionPoints = 0;
  private _routePoints = 0;

  /** Sum of positionPoints for all ancestors (not including this node). */
  private _ancestorPointsSum: number;
  /** Number of ancestors (0 for root). */
  private _depth: number;

  constructor(
    gameboard: Gameboard,
    parent?: TreeNode,
    lastMovePlayer?: number,
    lastMove?: Move,
  ) {
    this._gameboard = gameboard;
    this._parent = parent;
    this._lastMovePlayer = lastMovePlayer ?? 0;
    this._lastMove = lastMove;

    if (parent === undefined) {
      this._levelInTree = 1;
      this._depth = 0;
      this._ancestorPointsSum = 0;
    } else {
      this._levelInTree = parent.levelInTree + 1;
      this._depth = parent._depth + 1;
      this._ancestorPointsSum = parent._ancestorPointsSum + parent._positionPoints;
    }

    this.evaluatePosition();
  }

  private evaluatePosition(): void {
    this._positionPoints = this._gameboard.evaluateTotalPositionPoints();

    // Weight this (leaf) node 2× so tactical sequences that win material
    // score clearly higher than quiet lines when the AI is already ahead.
    this._routePoints =
      (this._ancestorPointsSum + this._positionPoints * 2) / (this._depth + 2);
  }

  get levelInTree(): number {
    return this._levelInTree;
  }

  get positionPoints(): number {
    return this._positionPoints;
  }

  get routePoints(): number {
    return this._routePoints;
  }

  get parent(): TreeNode | undefined {
    return this._parent;
  }

  get gameboard(): Gameboard {
    return this._gameboard;
  }

  get move(): Move | undefined {
    return this._lastMove;
  }

  get lastMovePlayer(): number {
    return this._lastMovePlayer;
  }

  addChild(nodeOrNodes: TreeNode | TreeNode[]): void {
    if (Array.isArray(nodeOrNodes)) {
      this._children.push(...nodeOrNodes);
    } else {
      this._children.push(nodeOrNodes);
    }
  }

  hasChildren(): boolean {
    return this._children.length > 0;
  }

  getDescendants(): TreeNode[] {
    const descendants: TreeNode[] = [...this._children];
    for (const child of this._children) {
      descendants.push(...child.getDescendants());
    }
    return descendants;
  }

  getNumberOfChildrenAndGrandchildren(): number {
    let count = this._children.length;
    for (const node of this._children) {
      count += node.getNumberOfChildrenAndGrandchildren();
    }
    return count;
  }
}

