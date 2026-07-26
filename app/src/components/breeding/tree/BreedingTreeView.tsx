import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, PackagePlus, Plus } from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { Pal } from '@/data/pals';
import type { AppState } from '@/hooks/useAppState';
import PalImage from '@/components/PalImage';
import { SaveDialog } from '../SaveDialog';
import { ComboPickerDialog } from './ComboPickerDialog';
import {
  buildBreedingTree,
  withCombinationAt,
  expandNodeAt,
  getNodeAt,
  collectExecutionOrder,
  canExpand,
} from '@/lib/breeding-tree';
import type { BreedTreeNode } from '@/lib/breeding-tree';
import type { BreedingCombination } from '@/lib/breeding';

interface BreedingTreeViewProps {
  targetPal: Pal;
  appState: AppState;
}

const CONNECTOR_COLOR = 'var(--border-subtle)';

interface TreeNodeProps {
  node: BreedTreeNode;
  isRoot: boolean;
  onPick: (node: BreedTreeNode) => void;
  onExpand: (nodeId: string) => void;
}

function TreeNode({ node, isRoot, onPick, onExpand }: TreeNodeProps) {
  const { t } = useTranslation();
  const expandable = canExpand(node);
  const clickable = node.combination !== null || expandable;

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={clickable ? () => onPick(node) : undefined}
        className="flex flex-col items-center transition-all duration-150"
        style={{
          gap: 4,
          padding: '8px 10px',
          width: 108,
          borderRadius: 10,
          backgroundColor: 'var(--bg-surface)',
          border: isRoot
            ? '2px solid var(--accent-violet)'
            : node.children
              ? '1px solid var(--border-subtle)'
              : '1px dashed var(--border-subtle)',
          cursor: clickable ? 'pointer' : 'default',
        }}
        title={clickable ? t('breeding.tree.changeParents') : undefined}
      >
        <PalImage iconName={node.pal.iconName} name={node.pal.name} size="sm" />
        <span
          className="text-[11px] font-semibold truncate max-w-full"
          style={{ color: 'var(--text-primary)' }}
        >
          {node.pal.name}
        </span>
        {node.isCycle && (
          <span
            className="text-[9px] font-semibold uppercase"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('breeding.tree.cycle')}
          </span>
        )}
        {!node.children && !node.isCycle && !expandable && (
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            {t('breeding.tree.basePal')}
          </span>
        )}
      </button>

      {node.children && (
        <>
          <div style={{ width: 1, height: 16, backgroundColor: CONNECTOR_COLOR }} />
          <div className="flex items-start" style={{ position: 'relative' }}>
            <span
              className="text-[12px] font-light"
              style={{
                position: 'absolute',
                top: -11,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '0 4px',
                backgroundColor: 'var(--bg-base)',
                color: 'var(--text-muted)',
                zIndex: 1,
              }}
            >
              +
            </span>
            {node.children.map((child, i) => (
              <div
                key={child.nodeId}
                className="flex flex-col items-center"
                style={{ position: 'relative', padding: '0 12px' }}
              >
                {/* horizontal half-connector towards the sibling */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: i === 0 ? '50%' : 0,
                    right: i === 0 ? 0 : '50%',
                    height: 1,
                    backgroundColor: CONNECTOR_COLOR,
                  }}
                />
                <div style={{ width: 1, height: 16, backgroundColor: CONNECTOR_COLOR }} />
                <TreeNode node={child} isRoot={false} onPick={onPick} onExpand={onExpand} />
              </div>
            ))}
          </div>
        </>
      )}

      {!node.children && expandable && (
        <>
          <div style={{ width: 1, height: 10, backgroundColor: CONNECTOR_COLOR }} />
          <button
            onClick={() => onExpand(node.nodeId)}
            className="flex items-center gap-1 text-[10px] font-semibold transition-all duration-150"
            style={{
              padding: '3px 8px',
              borderRadius: 9999,
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
            title={t('breeding.tree.expand')}
          >
            <Plus size={10} />
            {t('breeding.tree.expand')}
          </button>
        </>
      )}
    </div>
  );
}

export function BreedingTreeView({ targetPal, appState }: BreedingTreeViewProps) {
  const { t } = useTranslation();
  const [depth, setDepth] = useState(3);
  // NOTE: the parent keys this component by target pal id, so state resets
  // automatically when the target changes (no effect needed).
  const [tree, setTree] = useState<BreedTreeNode>(() =>
    buildBreedingTree(targetPal, 3),
  );
  const [pickerNodeId, setPickerNodeId] = useState<string | null>(null);

  // Save dialog state (mirrors the single-combo save flow in Home)
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageDesc, setNewPackageDesc] = useState('');

  const handleDepthChange = useCallback(
    (newDepth: number) => {
      setDepth(newDepth);
      setTree(buildBreedingTree(targetPal, newDepth));
      setPickerNodeId(null);
    },
    [targetPal],
  );

  const executionOrder = useMemo(() => collectExecutionOrder(tree), [tree]);

  const pickerNode = useMemo(
    () => (pickerNodeId ? getNodeAt(tree, pickerNodeId) : null),
    [tree, pickerNodeId],
  );

  const handlePick = useCallback((node: BreedTreeNode) => {
    setPickerNodeId(node.nodeId);
  }, []);

  const handleExpand = useCallback((nodeId: string) => {
    setTree((prev) => expandNodeAt(prev, nodeId));
  }, []);

  const handleSelectCombo = useCallback(
    (combo: BreedingCombination) => {
      if (!pickerNodeId) return;
      const node = getNodeAt(tree, pickerNodeId);
      if (!node) return;
      // guarantee at least one level below the picked node so the new
      // parents are visible even if it was a depth-limited leaf
      const effectiveDepth = Math.max(depth, node.depth + 1);
      setTree((prev) => withCombinationAt(prev, pickerNodeId, combo, effectiveDepth));
    },
    [tree, pickerNodeId, depth],
  );

  const handleSaveTree = useCallback(() => {
    setNewPackageName(t('breeding.tree.defaultPackageName', { pal: targetPal.name }));
    setNewPackageDesc('');
    setShowCreatePackage(appState.packages.length === 0);
    setShowSaveDialog(true);
  }, [appState.packages.length, targetPal.name, t]);

  const handleCreateAndSave = useCallback(() => {
    if (!newPackageName.trim()) return;
    appState.addPackage({
      name: newPackageName.trim(),
      description: newPackageDesc.trim() || undefined,
      combinationIds: executionOrder.map((c) => c.id),
      treeTargetPalId: targetPal.id,
    });
    setNewPackageName('');
    setNewPackageDesc('');
    setShowSaveDialog(false);
  }, [newPackageName, newPackageDesc, executionOrder, appState, targetPal.id]);

  const handleSaveToExisting = useCallback(
    (pkgId: string) => {
      for (const combo of executionOrder) {
        appState.addToPackage(pkgId, combo.id);
      }
      setShowSaveDialog(false);
    },
    [executionOrder, appState],
  );

  return (
    <div>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Depth selector */}
          <div className="relative">
            <select
              value={depth}
              onChange={(e) => handleDepthChange(Number(e.target.value))}
              className="appearance-none cursor-pointer text-[13px] font-medium pr-8 pl-3 transition-all duration-150 outline-none"
              style={{
                height: 34,
                borderRadius: 8,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {t('breeding.tree.depth')}: {d}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t('breeding.tree.steps', { count: executionOrder.length })}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {t('breeding.tree.clickToChange')}
          </span>
        </div>

        <button
          onClick={handleSaveTree}
          disabled={executionOrder.length === 0}
          className="flex items-center gap-1.5 text-[13px] font-medium transition-all duration-150 disabled:opacity-50"
          style={{
            height: 34,
            padding: '0 14px',
            borderRadius: 8,
            backgroundColor: 'var(--accent-violet)',
            color: '#FFFFFF',
          }}
        >
          <PackagePlus size={15} />
          {t('breeding.tree.saveTree')}
        </button>
      </div>

      {/* Tree */}
      {!tree.combination ? (
        <div className="flex flex-col items-center py-16" style={{ color: 'var(--text-secondary)' }}>
          <p className="text-[14px]">{t('breeding.tree.empty')}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', padding: '24px 24px 48px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              minWidth: '100%',
              width: 'max-content',
            }}
          >
            <TreeNode node={tree} isRoot onPick={handlePick} onExpand={handleExpand} />
          </div>
        </div>
      )}

      {/* Combination picker */}
      <ComboPickerDialog
        isOpen={pickerNode !== null}
        pal={pickerNode?.pal ?? null}
        currentComboId={pickerNode?.combination?.id ?? null}
        onSelect={handleSelectCombo}
        onClose={() => setPickerNodeId(null)}
      />

      {/* Save tree dialog */}
      <SaveDialog
        isOpen={showSaveDialog}
        combo={executionOrder[executionOrder.length - 1] ?? null}
        summary={t('breeding.tree.summary', {
          count: executionOrder.length,
          pal: targetPal.name,
        })}
        showCreate={showCreatePackage}
        packages={appState.packages}
        newPackageName={newPackageName}
        newPackageDesc={newPackageDesc}
        onClose={() => setShowSaveDialog(false)}
        onPackageNameChange={setNewPackageName}
        onPackageDescChange={setNewPackageDesc}
        onCreateAndSave={handleCreateAndSave}
        onSaveToExisting={handleSaveToExisting}
        onShowCreatePackage={() => setShowCreatePackage(true)}
        onBackToList={() => setShowCreatePackage(false)}
      />
    </div>
  );
}
