import type { PalDetail } from './pals';

let detailsPromise: Promise<Record<string, PalDetail>> | undefined;

export function loadPalDetails(): Promise<Record<string, PalDetail>> {
  detailsPromise ??= import('./json/palDetails.json').then(
    (module) => module.default as unknown as Record<string, PalDetail>,
  );
  return detailsPromise;
}

export async function getPalDetail(palName: string): Promise<PalDetail | undefined> {
  return (await loadPalDetails())[palName];
}
