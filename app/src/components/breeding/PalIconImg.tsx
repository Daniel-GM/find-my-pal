import { getPalImageUrl } from '@/lib/images';

interface PalIconImgProps {
  pal: { name: string; iconName: string };
  size?: 'sm' | 'md' | 'lg';
  borderColor?: string;
}

export function PalIconImg({ pal, size = 'md', borderColor }: PalIconImgProps) {
  const sizeClass = size === 'lg' ? 'pal-icon-lg' : size === 'sm' ? 'pal-icon-sm' : '';
  return (
    <img
      src={getPalImageUrl(pal.iconName)}
      alt={pal.name}
      className={`pal-icon ${sizeClass}`}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
      style={{
        border: borderColor ? `2px solid ${borderColor}` : '1px solid rgba(255,255,255,0.1)',
      }}
    />
  );
}
