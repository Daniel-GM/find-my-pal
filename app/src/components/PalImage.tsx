import { useState, useCallback } from 'react';
import { PALS } from '@/data/pals';

const PLACEHOLDER_BG = ['#8b5cf6', '#6366f1', '#a855f7', '#7c3aed', '#6d28d9', '#5b21b6'];

// Build name -> iconUrl lookup
const ICON_URL_MAP = new Map<string, string>();
for (const pal of PALS) {
  if (pal.iconUrl) {
    ICON_URL_MAP.set(pal.name, pal.iconUrl);
    ICON_URL_MAP.set(pal.iconName, pal.iconUrl);
  }
}

interface PalImageProps {
  iconName: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  iconUrl?: string;
}

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 56,
};

export default function PalImage({ iconName, name, size = 'md', className = '', style = {}, iconUrl }: PalImageProps) {
  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const s = SIZE_MAP[size];

  // Try multiple sources - prefer palworld.gg CDN
  const palIconUrl = iconUrl || ICON_URL_MAP.get(name) || ICON_URL_MAP.get(iconName);
  const sources = palIconUrl 
    ? [palIconUrl]
    : [
        `https://palworld.wiki.gg/images/${iconName}_icon.png`,
        `https://palpedia.azrocdn.com/pals/${iconName}_icon.png`,
        `https://palpedia.azrocdn.com/pals/${iconName}.png`,
      ];

  const handleError = useCallback(() => {
    if (srcIndex < sources.length - 1) {
      setSrcIndex(srcIndex + 1);
    } else {
      setFailed(true);
    }
  }, [srcIndex, sources.length]);

  if (failed) {
    // Show initials placeholder
    const initials = name
      .split(/[\s_]+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const bgIndex = name.charCodeAt(0) % PLACEHOLDER_BG.length;
    return (
      <div
        className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
        style={{
          width: s,
          height: s,
          backgroundColor: PLACEHOLDER_BG[bgIndex],
          color: '#fff',
          fontSize: s * 0.35,
          fontWeight: 700,
          border: '1px solid rgba(255,255,255,0.15)',
          ...style,
        }}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={sources[srcIndex]}
      alt={name}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{
        width: s,
        height: s,
        border: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        ...style,
      }}
      loading="lazy"
      onError={handleError}
    />
  );
}
