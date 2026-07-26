import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Baby,
  ChevronDown,
  GitBranch,
  LayoutGrid,
  List,
  Users,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import type { AppState } from '@/hooks/useAppState';
import { PALS } from '@/data/pals';
import { getPalImageUrl } from '@/lib/images';
import {
  findParentCombinations,
  findPartnerCombinations,
  sortCombinations,
} from '@/lib/breeding';
import type { BreedingCombination, SortOption } from '@/lib/breeding';
import {
  EmptyState,
  TargetPalBanner,
  CombinationCard,
  SaveDialog,
  ParentFilterDialog,
  BreedingTreeView,
} from '@/components/breeding';

interface HomeProps {
  appState: AppState;
}

export default function Home({ appState }: HomeProps) {
  const { t } = useTranslation();
  const {
    selectedPalId,
    selectPal,
    isInPackage,
    addToPackage,
    addPackage,
    searchMode,
    setSearchMode,
  } = appState;

  const [sortOption, setSortOption] = useState<SortOption>('power-asc');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveCombo, setSaveCombo] = useState<BreedingCombination | null>(null);
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageDesc, setNewPackageDesc] = useState('');

  // Improvement 2: Parent filter state
  const [filterParentId, setFilterParentId] = useState<string | null>(null);
  const [showParentFilter, setShowParentFilter] = useState(false);
  const [parentFilterSearch, setParentFilterSearch] = useState('');

  const selectedPal = useMemo(
    () => PALS.find((p) => p.id === selectedPalId) || null,
    [selectedPalId],
  );

  const allCombinations = useMemo(() => {
    if (!selectedPal) return [];
    return searchMode === 'parent'
      ? findPartnerCombinations(selectedPal)
      : findParentCombinations(selectedPal);
  }, [selectedPal, searchMode]);

  const sortedCombinations = useMemo(
    () => sortCombinations(allCombinations, sortOption, searchMode === 'parent'),
    [allCombinations, sortOption, searchMode],
  );

  // Improvement 2: Filtered combinations
  const filteredCombinations = useMemo(() => {
    if (!filterParentId) return sortedCombinations;
    return sortedCombinations.filter(
      (combo) => combo.parentA.id === filterParentId || combo.parentB.id === filterParentId
    );
  }, [sortedCombinations, filterParentId]);

  const handleSave = useCallback(
    (combo: BreedingCombination) => {
      if (appState.packages.length === 0) {
        setSaveCombo(combo);
        setShowCreatePackage(true);
        setShowSaveDialog(true);
      } else {
        setSaveCombo(combo);
        setShowCreatePackage(false);
        setShowSaveDialog(true);
      }
    },
    [appState.packages.length],
  );

  const handleCreateAndSave = useCallback(() => {
    if (!newPackageName.trim() || !saveCombo) return;
    addPackage({
      name: newPackageName.trim(),
      description: newPackageDesc.trim() || undefined,
      combinationIds: [saveCombo.id],
    });
    setNewPackageName('');
    setNewPackageDesc('');
    setShowSaveDialog(false);
    setSaveCombo(null);
  }, [newPackageName, newPackageDesc, saveCombo, addPackage]);

  const handleSaveToExisting = useCallback(
    (pkgId: string) => {
      if (!saveCombo) return;
      addToPackage(pkgId, saveCombo.id);
      setShowSaveDialog(false);
      setSaveCombo(null);
    },
    [saveCombo, addToPackage],
  );

  const handleCloseSaveDialog = useCallback(() => {
    setShowSaveDialog(false);
    setSaveCombo(null);
  }, []);

  const handleShowCreatePackage = useCallback(() => {
    setShowCreatePackage(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowCreatePackage(false);
  }, []);

  const handleCloseParentFilter = useCallback(() => {
    setShowParentFilter(false);
    setParentFilterSearch('');
  }, []);

  const handleSelectParent = useCallback((palId: string) => {
    setFilterParentId(palId);
    setShowParentFilter(false);
    setParentFilterSearch('');
  }, []);

  return (
    <div>
      {/* Top Bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between"
        style={{
          height: 60,
          padding: '0 24px',
          backgroundColor: 'var(--bg-base)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex flex-col gap-0.5">
          <h1
            className="text-[20px] font-bold leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Breeding Tree
          </h1>
          <p
            className="text-[13px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {selectedPal
              ? searchMode === 'parent'
                ? t('breeding.possiblePartnersFound', { count: filteredCombinations.length })
                : searchMode === 'tree'
                  ? t('breeding.tree.clickToChange')
                  : t('breeding.combinationCount', { count: filteredCombinations.length })
              : searchMode === 'parent'
                ? t('breeding.selectPalDescParent')
                : t('breeding.selectPalDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Mode Toggle */}
          <div className="flex items-center" style={{ borderRadius: 8, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <button
              onClick={() => setSearchMode('child')}
              className="flex items-center gap-1.5 px-2.5 transition-all duration-150 text-[12px] font-medium"
              style={{
                height: 34,
                backgroundColor: searchMode === 'child' ? 'var(--bg-hover)' : 'transparent',
                color: searchMode === 'child' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              title={t('breeding.selectPalDesc')}
            >
              <Baby size={16} />
              {t('breeding.byChild')}
            </button>
            <button
              onClick={() => setSearchMode('parent')}
              className="flex items-center gap-1.5 px-2.5 transition-all duration-150 text-[12px] font-medium"
              style={{
                height: 34,
                backgroundColor: searchMode === 'parent' ? 'var(--bg-hover)' : 'transparent',
                color: searchMode === 'parent' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              title={t('breeding.selectPalDescParent')}
            >
              <Users size={16} />
              {t('breeding.byParent')}
            </button>
            <button
              onClick={() => setSearchMode('tree')}
              className="flex items-center gap-1.5 px-2.5 transition-all duration-150 text-[12px] font-medium"
              style={{
                height: 34,
                backgroundColor: searchMode === 'tree' ? 'var(--bg-hover)' : 'transparent',
                color: searchMode === 'tree' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              title={t('breeding.tree.clickToChange')}
            >
              <GitBranch size={16} />
              {t('breeding.tree.mode')}
            </button>
          </div>

          {selectedPal && (
            <div
              className="flex items-center gap-2"
              style={{
                opacity: searchMode === 'tree' ? 0.35 : 1,
                pointerEvents: searchMode === 'tree' ? 'none' : 'auto',
                transition: 'opacity 150ms',
              }}
              aria-hidden={searchMode === 'tree'}
            >
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                disabled={searchMode === 'tree'}
                className="appearance-none cursor-pointer text-[13px] font-medium pr-8 pl-3 transition-all duration-150 outline-none"
                style={{
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="power-asc">{t('breeding.bpLowToHigh')}</option>
                <option value="power-desc">{t('breeding.bpHighToLow')}</option>
                <option value="alphabetical">{t('breeding.alphabetical')}</option>
                <option value="element">{t('breeding.byElement')}</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center" style={{ borderRadius: 8, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
              <button
                onClick={() => setLayoutMode('grid')}
                className="flex items-center justify-center transition-all duration-150"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: layoutMode === 'grid' ? 'var(--bg-hover)' : 'transparent',
                  color: layoutMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className="flex items-center justify-center transition-all duration-150"
                style={{
                  width: 34,
                  height: 34,
                  backgroundColor: layoutMode === 'list' ? 'var(--bg-hover)' : 'transparent',
                  color: layoutMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {!selectedPal ? (
          <EmptyState key="empty" mode={searchMode === 'parent' ? 'parent' : 'child'} />
        ) : (
          <motion.div
            key={`${selectedPal.id}-${searchMode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <TargetPalBanner
              pal={selectedPal}
              combinationCount={filteredCombinations.length}
              onChangePal={() => selectPal(null)}
              label={searchMode === 'parent' ? t('breeding.selectedParent') : t('breeding.targetPal')}
              countLabel={searchMode === 'parent' ? t('breeding.partners') : t('breeding.combinations')}
            />

            {searchMode === 'tree' ? (
              <BreedingTreeView key={selectedPal.id} targetPal={selectedPal} appState={appState} />
            ) : (
              <>
            {/* Summary Bar */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: '12px 24px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span
                className="text-[13px] font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {searchMode === 'parent'
                  ? t('breeding.possiblePartnersFound', { count: filteredCombinations.length })
                  : t('breeding.possibleCombinationsFound', { count: filteredCombinations.length })}
              </span>
              <div className="flex items-center gap-2">
                {/* Improvement 2: Parent Filter */}
                <div className="flex items-center gap-2">
                  {filterParentId ? (
                    <div
                      className="flex items-center gap-2"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 9999,
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--accent-violet)',
                      }}
                    >
                      <img
                        src={getPalImageUrl(PALS.find((p) => p.id === filterParentId)?.iconName || '')}
                        alt=""
                        className="pal-icon-sm"
                        loading="lazy"
                      />
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {PALS.find((p) => p.id === filterParentId)?.name}
                      </span>
                      <button
                        onClick={() => setFilterParentId(null)}
                        className="text-[12px] ml-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {'\u2715'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowParentFilter(true)}
                      className="text-[11px] font-semibold transition-all duration-150"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 9999,
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {t('breeding.filterByParent')}
                    </button>
                  )}
                </div>

                {(['power-asc', 'power-desc', 'element'] as SortOption[]).map(
                  (opt) => (
                    <button
                      key={opt}
                      onClick={() => setSortOption(opt)}
                      className="text-[11px] font-semibold transition-all duration-150"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 9999,
                        backgroundColor:
                          sortOption === opt
                            ? 'var(--accent-violet)'
                            : 'var(--bg-surface)',
                        color:
                          sortOption === opt
                            ? '#FFFFFF'
                            : 'var(--text-secondary)',
                        border:
                          sortOption === opt
                            ? 'none'
                            : '1px solid var(--border-subtle)',
                      }}
                    >
                      {opt === 'power-asc'
                        ? t('breeding.easiest')
                        : opt === 'power-desc'
                          ? t('breeding.hardest')
                          : t('breeding.byElement')}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Combinations Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  layoutMode === 'grid'
                    ? 'repeat(auto-fill, minmax(380px, 1fr))'
                    : '1fr',
                gap: 16,
                padding: '16px 24px 32px',
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredCombinations.map((combo, i) => (
                  <CombinationCard
                    key={combo.id}
                    combo={combo}
                    index={i}
                    isSaved={isInPackage(combo.id)}
                    onSave={handleSave}
                    showResult={searchMode === 'parent'}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filteredCombinations.length === 0 && (
              <div
                className="flex flex-col items-center py-16"
                style={{ color: 'var(--text-secondary)' }}
              >
                <p className="text-[14px]">
                  {searchMode === 'parent'
                    ? t('breeding.noPartnersFound')
                    : t('breeding.noCombinationsFound')}
                </p>
              </div>
            )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Dialog */}
      <SaveDialog
        isOpen={showSaveDialog}
        combo={saveCombo}
        showCreate={showCreatePackage}
        packages={appState.packages}
        newPackageName={newPackageName}
        newPackageDesc={newPackageDesc}
        onClose={handleCloseSaveDialog}
        onPackageNameChange={setNewPackageName}
        onPackageDescChange={setNewPackageDesc}
        onCreateAndSave={handleCreateAndSave}
        onSaveToExisting={handleSaveToExisting}
        onShowCreatePackage={handleShowCreatePackage}
        onBackToList={handleBackToList}
      />

      {/* Improvement 2: Parent Filter Dialog */}
      <ParentFilterDialog
        isOpen={showParentFilter}
        search={parentFilterSearch}
        onSearchChange={setParentFilterSearch}
        onSelect={handleSelectParent}
        onClose={handleCloseParentFilter}
      />
    </div>
  );
}
