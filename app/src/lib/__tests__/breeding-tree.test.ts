import { describe, it, expect } from 'vitest';
import {
  buildBreedingTree,
  withCombinationAt,
  expandNodeAt,
  getNodeAt,
  collectExecutionOrder,
  canExpand,
} from '@/lib/breeding-tree';
import type { BreedTreeNode } from '@/lib/breeding-tree';
import { findParentCombinations, sortCombinations } from '@/lib/breeding';
import { PALS, findPalByName } from '@/data/pals';

function walk(node: BreedTreeNode, fn: (n: BreedTreeNode) => void) {
  fn(node);
  if (node.children) {
    walk(node.children[0], fn);
    walk(node.children[1], fn);
  }
}

function findCycleNode(root: BreedTreeNode): BreedTreeNode | null {
  let found: BreedTreeNode | null = null;
  walk(root, (n) => {
    if (n.isCycle) found = n;
  });
  return found;
}

describe('breeding-tree', () => {
  const lamball = findPalByName('Lamball')!;

  it('builds a tree with the easiest non-cyclic combination at each node', () => {
    expect(lamball).toBeDefined();
    const tree = buildBreedingTree(lamball, 2);
    expect(tree.pal.name).toBe('Lamball');
    expect(tree.combination).not.toBeNull();

    const best = sortCombinations(findParentCombinations(lamball), 'power-asc').find(
      (combo) => combo.parentA.id !== lamball.id && combo.parentB.id !== lamball.id,
    );
    expect(best).toBeDefined();
    expect(tree.combination!.id).toBe(best!.id);

    let maxComboDepth = 0;
    walk(tree, (n) => {
      if (n.combination) maxComboDepth = Math.max(maxComboDepth, n.depth);
    });
    expect(maxComboDepth).toBeLessThan(2);
  });

  it('respects maxDepth: no combinations at or beyond the depth limit', () => {
    const tree = buildBreedingTree(lamball, 1);
    expect(tree.combination).not.toBeNull();
    expect(tree.children).not.toBeNull();
    for (const child of tree.children!) {
      expect(child.combination).toBeNull();
      expect(child.children).toBeNull();
    }
  });

  it('maxDepth 0 returns a leaf root', () => {
    const tree = buildBreedingTree(lamball, 0);
    expect(tree.combination).toBeNull();
    expect(tree.children).toBeNull();
    expect(tree.isCycle).toBe(false);
  });

  it('marks cycles as leaves instead of looping forever', () => {
    // Deep trees over real data eventually revisit a pal; ensure termination.
    const tree = buildBreedingTree(lamball, 10);
    let count = 0;
    walk(tree, () => {
      count += 1;
    });
    expect(count).toBeLessThan(5000);
    const cycle = findCycleNode(tree);
    if (cycle) {
      expect(cycle.children).toBeNull();
      expect(cycle.combination).toBeNull();
    }
  });

  it('returns an empty tree (leaf root) for a pal with no combinations', () => {
    const fakePal = { ...PALS[0], name: 'UnknownPalXYZ' };
    const tree = buildBreedingTree(fakePal, 3);
    expect(tree.combination).toBeNull();
    expect(collectExecutionOrder(tree)).toEqual([]);
  });

  it('withCombinationAt swaps the node combination and rebuilds its children', () => {
    const tree = buildBreedingTree(lamball, 2);
    const combos = findParentCombinations(lamball);
    expect(combos.length).toBeGreaterThan(1);
    const alternative = combos.find((c) => c.id !== tree.combination!.id)!;

    const updated = withCombinationAt(tree, '0', alternative, 2);
    expect(updated.combination!.id).toBe(alternative.id);
    expect(updated.children![0].pal.id).toBe(alternative.parentA.id);
    expect(updated.children![1].pal.id).toBe(alternative.parentB.id);
    // original tree untouched (immutability)
    expect(tree.combination!.id).not.toBe(alternative.id);
  });

  it('expandNodeAt expands a leaf one extra level', () => {
    const tree = buildBreedingTree(lamball, 1);
    const leaf = tree.children![0];
    expect(leaf.children).toBeNull();

    if (findParentCombinations(leaf.pal).length > 0) {
      expect(canExpand(leaf)).toBe(true);
      const updated = expandNodeAt(tree, leaf.nodeId);
      const expanded = getNodeAt(updated, leaf.nodeId)!;
      expect(expanded.combination).not.toBeNull();
      expect(expanded.children).not.toBeNull();
      // only one extra level
      for (const grandchild of expanded.children!) {
        expect(grandchild.children).toBeNull();
      }
    }
  });

  it('collectExecutionOrder returns post-order (target combo last), deduped', () => {
    const tree = buildBreedingTree(lamball, 3);
    const order = collectExecutionOrder(tree);
    expect(order.length).toBeGreaterThan(0);

    const ids = order.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);

    expect(order[order.length - 1].baby.name).toBe('Lamball');

    // every combo's parents that are themselves bred appear earlier
    const babyIndex = new Map<string, number>();
    order.forEach((c, i) => {
      if (!babyIndex.has(c.baby.id)) babyIndex.set(c.baby.id, i);
    });
    order.forEach((c, i) => {
      for (const parent of [c.parentA, c.parentB]) {
        // skip self-referencing combos (parent === baby, e.g. "Lamball + X = Lamball")
        if (parent.id === c.baby.id) continue;
        const parentBredAt = babyIndex.get(parent.id);
        if (parentBredAt !== undefined) {
          expect(parentBredAt).toBeLessThan(i);
        }
      }
    });
  });

  it('getNodeAt finds nodes by path id', () => {
    const tree = buildBreedingTree(lamball, 2);
    expect(getNodeAt(tree, '0')!.pal.name).toBe('Lamball');
    expect(getNodeAt(tree, '0/0')!.pal.id).toBe(tree.children![0].pal.id);
    expect(getNodeAt(tree, '0/1')!.pal.id).toBe(tree.children![1].pal.id);
    expect(getNodeAt(tree, '9/9/9')).toBeNull();
  });
});
