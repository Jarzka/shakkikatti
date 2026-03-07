import { TreeNode } from "./TreeNode";

/**
 * Holds the root node(s) of the AI search tree and provides helpers for
 * querying nodes across the whole tree.
 *
 * The tree is built and expanded incrementally by AI logic.
 */
export class Tree {
  private nodes: TreeNode[] = [];

  addNodeOnTopOfTree(node: TreeNode): void {
    this.nodes.push(node);
  }

  getFirstTopNode(): TreeNode {
    return this.nodes[0];
  }

  getAllNodes(): TreeNode[] {
    const all: TreeNode[] = [...this.nodes];
    for (const node of this.nodes) {
      all.push(...node.getDescendants());
    }
    return all;
  }

  findNodesWithoutChildren(): TreeNode[] {
    return this.getAllNodes().filter((n) => !n.hasChildren());
  }

  getNumberOfNodes(): number {
    let count = this.nodes.length;
    for (const node of this.nodes) {
      count += node.getNumberOfChildrenAndGrandchildren();
    }
    return count;
  }
}
