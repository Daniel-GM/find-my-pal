import InfoPage from '@/components/InfoPage';
import type { InfoSection } from '@/components/InfoPage';

const SECTIONS: InfoSection[] = [
  { titleKey: 'privacy.intro.title', bodyKey: 'privacy.intro.body' },
  { titleKey: 'privacy.data.title', bodyKey: 'privacy.data.body' },
  { titleKey: 'privacy.account.title', bodyKey: 'privacy.account.body' },
  { titleKey: 'privacy.cookies.title', bodyKey: 'privacy.cookies.body' },
  { titleKey: 'privacy.ads.title', bodyKey: 'privacy.ads.body' },
  { titleKey: 'privacy.rights.title', bodyKey: 'privacy.rights.body' },
  { titleKey: 'privacy.contact.title', bodyKey: 'privacy.contact.body' },
];

export default function Privacy() {
  return (
    <InfoPage
      titleKey="privacy.title"
      subtitleKey="privacy.updated"
      sections={SECTIONS}
    />
  );
}
