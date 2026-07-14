import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useTranslation,
  getBuildTranslation,
} from '@/i18n';
import type { TranslationKey } from '@/i18n/types';

import {
  Swords,
  Search,
  Wrench,
  X,
  Trophy,
  HelpCircle,
} from 'lucide-react';
import {
  PARTNER_SKILLS,
  SKILL_CATEGORIES,
  CATEGORY_LABELS,
  searchSkills,
  getSkillsByCategory,
  getBuildSuggestions,
} from '@/data/partnerSkills';
import type { PartnerSkill, BuildSuggestion, SkillCategory } from '@/data/partnerSkills';
import PalImage from '@/components/PalImage';
import {
  SkillCard,
  BuildCard,
  findPalByName,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
} from '@/components/builds';

export default function BuildsPage() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<SkillCategory | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<BuildSuggestion | null>(null);

  const buildSuggestions = useMemo(() => getBuildSuggestions(), []);

  const filteredSkills = useMemo(() => {
    let skills: (PartnerSkill & { buildContext?: string[] })[] = [];

    if (selectedBuild) {
      skills = selectedBuild.skills.map((s) => ({ ...s, buildContext: [selectedBuild.name] }));
    } else if (search.trim()) {
      skills = searchSkills(search);
    } else if (activeCategory) {
      skills = getSkillsByCategory(activeCategory);
    } else {
      skills = [...PARTNER_SKILLS];
    }

    return skills;
  }, [search, activeCategory, selectedBuild]);

  // Compute build context for each skill when showing all
  const skillsWithContext = useMemo(() => {
    if (selectedBuild || search.trim() || activeCategory) return filteredSkills;

    const buildMap = new Map<string, string[]>();
    buildSuggestions.forEach((build) => {
      build.skills.forEach((skill) => {
        const key = `${skill.palName}|${skill.skillName}`;
        const existing = buildMap.get(key) || [];
        existing.push(build.name);
        buildMap.set(key, existing);
      });
    });

    return filteredSkills.map((skill) => {
      const key = `${skill.palName}|${skill.skillName}`;
      const ctx = buildMap.get(key);
      return ctx ? { ...skill, buildContext: ctx } : skill;
    });
  }, [filteredSkills, selectedBuild, search, activeCategory, buildSuggestions]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-5"
      >
        <div className="flex items-center gap-3 mb-2">
          <Wrench size={22} style={{ color: 'var(--accent-violet)' }} />
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('builds.title')}
          </h1>
          <span className="text-[13px] font-medium ml-2" style={{ color: 'var(--text-muted)' }}>
            {PARTNER_SKILLS.length} {t('builds.skillsCount', { count: PARTNER_SKILLS.length }).split(' ').slice(1).join(' ')}
          </span>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {t('builds.description')}
        </p>
      </motion.div>

      {/* Build Suggestions Section */}
      {!selectedBuild && !search && !activeCategory && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} style={{ color: 'var(--accent-violet)' }} />
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('builds.premadeBuilds')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {buildSuggestions.map((build, i) => (
              <BuildCard
                key={build.name}
                build={build}
                index={i}
                onSelectBuild={setSelectedBuild}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Selected Build Header */}
      <AnimatePresence>
        {selectedBuild && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div
              className="flex flex-col gap-2 p-4"
              style={{
                backgroundColor: 'rgba(139,92,246,0.06)',
                borderRadius: 12,
                border: '1px solid rgba(139,92,246,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Swords size={20} style={{ color: 'var(--accent-violet)' }} />
                  <div>
                    <h3
                      className="text-[16px] font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {getBuildTranslation(selectedBuild.name, locale)?.name || selectedBuild.name}
                    </h3>
                    <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      {getBuildTranslation(selectedBuild.name, locale)?.description || selectedBuild.description}
                    </p>
                    {/* Pal images for selected build */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {selectedBuild.skills.slice(0, 8).map((s) => {
                        const pal = findPalByName(s.palName);
                        if (!pal) return null;
                        return (
                          <PalImage
                            key={`${s.palName}-${s.skillName}`}
                            iconName={pal.iconName}
                            name={pal.name}
                            size="sm"
                          />
                        );
                      })}
                      {selectedBuild.skills.length > 8 && (
                        <span
                          className="text-[10px] font-semibold flex items-center justify-center rounded-full"
                          style={{
                            width: 28,
                            height: 28,
                            backgroundColor: 'rgba(139,92,246,0.1)',
                            color: 'var(--accent-violet)',
                          }}
                        >
                          +{selectedBuild.skills.length - 8}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBuild(null)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold transition-all duration-150"
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  }}
                >
                  <X size={14} />
                  {t('builds.clear')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-3 mb-5"
      >
        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedBuild(null);
            }}
            placeholder={t('builds.searchBuilds')}
            className="w-full text-[13px] outline-none"
            style={{
              padding: '8px 12px 8px 32px',
              borderRadius: 10,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setActiveCategory(null);
              setSelectedBuild(null);
            }}
            className="inline-flex items-center gap-1 text-[10px] font-semibold transition-all duration-150"
            style={{
              padding: '3px 10px',
              borderRadius: 9999,
              backgroundColor: activeCategory === null ? 'var(--accent-violet)' : 'var(--bg-surface)',
              color: activeCategory === null ? '#FFFFFF' : 'var(--text-secondary)',
              border: `1px solid ${activeCategory === null ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
            }}
          >
            {t('app.all')}
          </button>
          {SKILL_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.utility;
            const Icon = CATEGORY_ICONS[cat] || HelpCircle;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(isActive ? null : cat);
                  setSelectedBuild(null);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-semibold transition-all duration-150"
                style={{
                  padding: '3px 8px',
                  borderRadius: 9999,
                  backgroundColor: isActive ? colors.bg : 'var(--bg-surface)',
                  color: isActive ? colors.text : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? colors.border : 'var(--border-subtle)'}`,
                }}
              >
                <Icon size={12} />
                {t(`builds.category.${cat}` as TranslationKey) || CATEGORY_LABELS[cat] || cat}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Skills Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        {skillsWithContext.length === 0 ? (
          <div className="text-center py-16">
            <Search size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto' }} />
            <p className="text-[14px] mt-3" style={{ color: 'var(--text-secondary)' }}>
              {t('builds.noSkills')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {t('builds.showingSkills', { count: skillsWithContext.length })}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {skillsWithContext.map((skill, i) => (
                <SkillCard
                  key={`${skill.palName}-${skill.skillName}`}
                  skill={skill}
                  index={i}
                  buildContext={skill.buildContext}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
