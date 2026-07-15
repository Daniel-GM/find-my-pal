import { useState } from 'react';
import { Factory, Package } from 'lucide-react';
import { getGameEntityImageUrl } from '@/lib/game-entity-images';
import type { CraftingEntity } from '@/data/crafting';

export function EntityIcon({
  entity,
  size = 36,
}: {
  entity: CraftingEntity;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const iconKey = entity.iconName || entity.id;
  const src = entity.iconUrl ?? getGameEntityImageUrl(iconKey);

  if (failed) {
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
      onError={() => setFailed(true)}
    />
  );
}
