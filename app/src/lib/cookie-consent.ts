const CONSENT_KEY = 'palworld-cookie-consent';

export type ConsentChoice = 'accepted' | 'rejected';

export function getCookieConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function setCookieConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // ignore storage errors
  }
}
