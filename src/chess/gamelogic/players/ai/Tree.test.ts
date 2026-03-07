import { describe, it, expect } from "vitest";
import { Tree } from "./Tree";
import { TreeNode } from "./TreeNode";
import { Gameboard } from "../../Gameboard";

describe("Tree", () => {
  it("testGetAllNodes", () => {
    const tree = new Tree();
    const gameboard = new Gameboard();
    const node = new TreeNode(gameboard);
    tree.addNodeOnTopOfTree(node);

    node.addChild(new TreeNode(gameboard));

    expect(tree.getAllNodes().length).toBe(2);
  });

  it("testFindNodesWithoutChildren", () => {
    const tree = new Tree();
    const gameboard = new Gameboard();
    const node = new TreeNode(gameboard);
    tree.addNodeOnTopOfTree(node);

    node.addChild(new TreeNode(gameboard));

    expect(tree.findNodesWithoutChildren().length).toBe(1);
  });

  it("testGetNumberOfNodes", () => {
    const tree = new Tree();
    const gameboard = new Gameboard();
    const node = new TreeNode(gameboard);
    tree.addNodeOnTopOfTree(node);

    node.addChild(new TreeNode(gameboard));

    expect(tree.getNumberOfNodes()).toBe(2);
  });
});
