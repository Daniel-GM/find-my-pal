import { useEffect, useRef } from 'react';
import { useTranslation } from '@/i18n';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const ADSENSE_CLIENT = 'ca-pub-1545257194206629';

interface AdBannerProps {
  /** Ad unit slot ID, created in the AdSense dashboard after account approval. */
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
}

/**
 * Google AdSense display unit. Renders nothing until a valid `slot` is provided.
 * Requires the AdSense loader script in index.html (already included).
 */
export default function AdBanner({ slot, format = 'auto' }: AdBannerProps) {
  const { t } = useTranslation();
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // Ad blocker or script not loaded — fail silently.
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <div className="my-4 flex flex-col items-center gap-1">
      <span
        className="text-[10px] uppercase tracking-wide"
        style={{ color: 'var(--text-muted)' }}
      >
        {t('ads.label')}
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
