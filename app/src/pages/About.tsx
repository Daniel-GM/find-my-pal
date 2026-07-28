import InfoPage from '@/components/InfoPage';
import type { InfoSection } from '@/components/InfoPage';

const SECTIONS: InfoSection[] = [
  { titleKey: 'about.what.title', bodyKey: 'about.what.body' },
  { titleKey: 'about.data.title', bodyKey: 'about.data.body' },
  { titleKey: 'about.disclaimer.title', bodyKey: 'about.disclaimer.body' },
  { titleKey: 'about.contact.title', bodyKey: 'about.contact.body' },
];

export default function About() {
  return <InfoPage titleKey="about.title" sections={SECTIONS} />;
}
