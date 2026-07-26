import type { Pal } from '@/data/pals';
import {
  findParentCombinations,
  sortCombinations,
} from './breeding';
import type { BreedingCombination } from './breeding';

export interface BreedTreeNode {
  /** Stable path id, e.g. "0", "0/0", "0/1/0" */
  nodeId: string;
  pal: Pal;
  /** null = leaf (not expanded) */
  combination: BreedingCombination | null;
  children: [BreedTreeNode, BreedTreeNode] | null;
  /** true when this pal already appears as an ancestor (expansion stopped to avoid loops) */
  isCycle: boolean;
  depth: number;
}

function pickBestCombination(pal: Pal): BreedingCombination | null {
  const combos = findParentCombinations(pal);
  if (combos.length === 0) return null;
  return sortCombinations(combos, 'power-asc')[0];
}

function buildNode(
  pal: Pal,
  nodeId: string,
  depth: number,
  ancestors: string[],
  maxDepth: number,
  forcedCombination?: BreedingCombination,
): BreedTreeNode {
  if (ancestors.includes(pal.id)) {
    return { nodeId, pal, combination: null, children: null, isCycle: true, depth };
  }

  if (depth >= maxDepth) {
    return { nodeId, pal, combination: null, children: null, isCycle: false, depth };
  }

  const combination = forcedCombination ?? pickBestCombination(pal);
  if (!combination) {
    return { nodeId, pal, combination: null, children: null, isCycle: false, depth };
  }

  const nextAncestors = [...ancestors, pal.id];
  const childA = buildNode(combination.parentA, `${nodeId}/0`, depth + 1, nextAncestors, maxDepth);
  const childB = buildNode(combination.parentB, `${nodeId}/1`, depth + 1, nextAncestors, maxDepth);

  return { nodeId, pal, combination, children: [childA, childB], isCycle: false, depth };
}

/**
 * Builds a breeding tree for `target`: at each node the easiest combination
 * (lowest max breeding power) is chosen, expanding until `maxDepth` levels
 * of combinations below the root (root = depth 0).
 */
export function buildBreedingTree(target: Pal, maxDepth: number): BreedTreeNode {
  return buildNode(target, '0', 0, [], Math.max(0, maxDepth));
}

function updateNodeAt(
  node: BreedTreeNode,
  targetId: string,
  ancestors: string[],
  fn: (node: BreedTreeNode, ancestors: string[]) => BreedTreeNode,
): BreedTreeNode {
  if (node.nodeId === targetId) {
    return fn(node, ancestors);
  }
  if (!node.children) return node;
  const nextAncestors = [...ancestors, node.pal.id];
  return {
    ...node,
    children: [
      updateNodeAt(node.children[0], targetId, nextAncestors, fn),
      updateNodeAt(node.children[1], targetId, nextAncestors, fn),
    ],
  };
}

/**
 * Returns a new tree where the node `nodeId` uses `combo` and its subtree is
 * rebuilt from the combo's parents (keeping the current depth budget).
 */
export function withCombinationAt(
  root: BreedTreeNode,
  nodeId: string,
  combo: BreedingCombination,
  maxDepth: number,
): BreedTreeNode {
  return updateNodeAt(root, nodeId, [], (node, ancestors) =>
    buildNode(node.pal, node.nodeId, node.depth, ancestors, maxDepth, combo),
  );
}

/**
 * Expands a leaf node one extra level (if it has combinations available),
 * independently of the global depth limit.
 */
export function expandNodeAt(root: BreedTreeNode, nodeId: string): BreedTreeNode {
  return updateNodeAt(root, nodeId, [], (node, ancestors) => {
    if (node.children || node.isCycle) return node;
    return buildNode(node.pal, node.nodeId, node.depth, ancestors, node.depth + 1);
  });
}

export function getNodeAt(root: BreedTreeNode, nodeId: string): BreedTreeNode | null {
  if (root.nodeId === nodeId) return root;
  if (!root.children) return null;
  return getNodeAt(root.children[0], nodeId) ?? getNodeAt(root.children[1], nodeId);
}

/**
 * Post-order traversal (leaves first, target combination last), deduped by
 * combo id. This is the execution order saved into a package.
 */
export function collectExecutionOrder(root: BreedTreeNode): BreedingCombination[] {
  const result: BreedingCombination[] = [];
  const seen = new Set<string>();

  const walk = (node: BreedTreeNode) => {
    if (node.children) {
      walk(node.children[0]);
      walk(node.children[1]);
    }
    if (node.combination && !seen.has(node.combination.id)) {
      seen.add(node.combination.id);
      result.push(node.combination);
    }
  };

  walk(root);
  return result;
}

/** Counts nodes and combinations for summary display. */
export function countTreeStats(root: BreedTreeNode): { nodes: number; steps: number } {
  let nodes = 0;
  const walk = (node: BreedTreeNode) => {
    nodes += 1;
    if (node.children) {
      walk(node.children[0]);
      walk(node.children[1]);
    }
  };
  walk(root);
  return { nodes, steps: collectExecutionOrder(root).length };
}

/** True when a leaf could still be expanded (has combos and is not a cycle). */
export function canExpand(node: BreedTreeNode): boolean {
  return !node.children && !node.isCycle && findParentCombinations(node.pal).length > 0;
}
