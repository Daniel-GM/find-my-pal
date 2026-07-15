import { useState } from 'react';
import { Factory, Package } from 'lucide-react';
import {
  getGameEntityImageUrl,
  getPalpediaImageFallbackUrl,
} from '@/lib/game-entity-images';
import type { CraftingEntity } from '@/data/crafting';

export function EntityIcon({
  entity,
  size = 36,
}: {
  entity: CraftingEntity;
  size?: number;
}) {
  const [failedSources, setFailedSources] = useState<Set<string>>(() => new Set());
  const iconKey = entity.iconName || entity.id;
  const sources = [
    entity.iconUrl,
    getPalpediaImageFallbackUrl(entity.iconUrl),
    getGameEntityImageUrl(iconKey),
  ].filter((source, index, all): source is string => Boolean(source) && all.indexOf(source) === index);
  const src = sources.find((source) => !failedSources.has(source));

  if (!src) {
    const Icon = entity.kind === 'structure' ? Factory : Package;
    return (
      <span
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          backgroundColor: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
        aria-hidden
      >
        <Icon size={Math.max(14, size * 0.45)} />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="object-contain shrink-0"
      loading="lazy"
      onError={() => {
        setFailedSources((previous) => new Set(previous).add(src));
      }}
    />
  );
}
