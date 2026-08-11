// Regenerates app/src/data/json/passives.json and app/src/data/json/gear.json
// from PalDB HTML snapshots. By default reads the local copies in
// .memory/scratch/; pass --fetch to download fresh copies from paldb.cc first,
// or --fetch-images to refresh any missing local gear icons.
//
//   node app/scripts/update-team-data.mjs [--fetch] [--fetch-images]

import { access, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PALDB_ORIGIN = 'https://paldb.cc';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SNAPSHOT_DIR = path.join(REPO_ROOT, '.memory', 'scratch');
const PASSIVES_OUT = path.join(REPO_ROOT, 'app', 'src', 'data', 'json', 'passives.json');
const GEAR_OUT = path.join(REPO_ROOT, 'app', 'src', 'data', 'json', 'gear.json');
const GEAR_ASSET_DIR = path.join(REPO_ROOT, 'app', 'public', 'assets', 'gear');
const GEAR_ASSET_WEB_ROOT = '/assets/gear';

const PASSIVE_PAGE = 'Passive_Skills';
const GEAR_PAGES = [
  { page: 'Armor', kind: 'armor' }, // split into armor/helmet below
  { page: 'Accessory', kind: 'accessory' },
  { page: 'Weapon', kind: 'weapon' },
  { page: 'Ingredient', kind: 'food' },
];
const LOCALES = ['en', 'pt'];

// Same helpers as paldb-buildings.mjs.
function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ').replaceAll('&lt;', '<').replaceAll('&gt;', '>').trim();
}

function textContent(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

function decodeSourceId(value) {
  return decodeURIComponent(value.replaceAll('&amp;', '&'));
}

function snakeCase(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '').toLowerCase();
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'find-my-pal team data updater/1.0' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? String(lastError)}`);
}

async function fetchBytes(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          referer: `${PALDB_ORIGIN}/`,
          'user-agent': 'Mozilla/5.0 find-my-pal team data updater/1.0',
        },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? String(lastError)}`);
}

function gearIconAsset(remoteUrl) {
  const parsedUrl = new URL(remoteUrl);
  const extension = path.extname(parsedUrl.pathname) || '.webp';
  const basename = path.basename(parsedUrl.pathname, extension)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .toLowerCase();
  const digest = createHash('sha1').update(remoteUrl).digest('hex').slice(0, 10);
  const filename = `${basename}-${digest}${extension}`;
  return {
    filename,
    filePath: path.join(GEAR_ASSET_DIR, filename),
    webPath: `${GEAR_ASSET_WEB_ROOT}/${filename}`,
  };
}

async function syncGearIcons(remoteUrls, { shouldDownload, log }) {
  const uniqueUrls = [...new Set(remoteUrls)];
  await mkdir(GEAR_ASSET_DIR, { recursive: true });

  let downloaded = 0;
  let alreadyPresent = 0;
  const queue = [...uniqueUrls];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const remoteUrl = queue.shift();
      const asset = gearIconAsset(remoteUrl);
      try {
        await access(asset.filePath);
        alreadyPresent += 1;
        continue;
      } catch {
        // Download below when explicitly requested.
      }
      if (!shouldDownload) {
        throw new Error(`Missing local gear icon ${asset.filePath}; rerun with --fetch-images`);
      }
      await writeFile(asset.filePath, await fetchBytes(remoteUrl));
      downloaded += 1;
    }
  });
  await Promise.all(workers);
  log(`Gear icons: ${uniqueUrls.length} local assets (${downloaded} downloaded, ${alreadyPresent} already present)`);
}

async function loadPage(page, locale, { fetch: shouldFetch, log }) {
  const file = path.join(SNAPSHOT_DIR, `${page}_${locale}.html`);
  if (shouldFetch) {
    const url = `${PALDB_ORIGIN}/${locale}/${page}`;
    log(`Fetching ${url}`);
    const html = await fetchText(url);
    await mkdir(SNAPSHOT_DIR, { recursive: true });
    await writeFile(file, html);
    return html;
  }
  return readFile(file, 'utf8');
}

// --- Passives ---------------------------------------------------------------

// Extracts the first balanced <div>...</div> inside `html` starting at `start`.
function firstBalancedDiv(html, start) {
  const open = html.indexOf('<div', start);
  if (open < 0) return undefined;
  let depth = 0;
  const tagPattern = /<div[^>]*>|<\/div>/gi;
  tagPattern.lastIndex = open;
  let match;
  while ((match = tagPattern.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(open, tagPattern.lastIndex);
  }
  return undefined;
}

// Turns an effect div's inner markup into short readable text, e.g.
// "Work Speed +90%; SAN decreases +15.0% faster".
function cleanEffectText(divHtml) {
  const text = divHtml
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n') // sibling stat lines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ''); // inline tags wrap numbers with no spacing, e.g. <NumBlue_13>+</>90<NumBlue_13>%</>
  return decodeHtml(text)
    .split('\n')
    .map((line) => line
      .replace(/\s+/g, ' ')
      .replace(/\s*\((?:ToSelf|ToSelfAndTrainer|ToTrainer|None)\)/gi, '') // targeting badges are noise
      .replace(/\bdreceases\b/g, 'decreases') // recurring PalDB typo
      .replace(/\.+$/, '') // sentences get joined with "; " — drop trailing periods
      .trim())
    .filter(Boolean)
    .join('; ');
}

const PASSIVE_MARKER = '<div class="col"><div class="border bg-dark">';

// PalDB shows placeholder junk ("pt-BR_Text" / "en Text") for unlocalized items.
const PLACEHOLDER_NAME = /(?:^|\b)(?:en|pt-br)_text\b/i;

// PalDB exposes the rank used by the game's passive arrow image. Runner and
// Swift are displayed one rank above their in-game arrow, so keep these two
// verified exceptions explicit.
const PASSIVE_RANK_OVERRIDES = new Map([
  ['runner', 2],
  ['swift', 3],
]);

// PalDB does have proper PT names/effects for these passives, but the
// cross-locale signature pairing cannot match their cards (localized stat
// labels, free-text phrasing or diverging signs between locale pages). Names
// and effects verified against https://paldb.cc/pt/Passive_Skills.
const PT_PASSIVE_OVERRIDES = new Map([
  ['lavish_hospitality', { name: 'Banquete Generoso', effect: 'Itens deixados ao morrer +100%' }],
  ['service_minded', { name: 'Mentalidade Altruísta', effect: 'Itens deixados ao morrer +50%' }],
  ['wellness_watcher', { name: 'Prevenção de Exaustão', effect: 'Redução do Consumo de Fôlego do Jogador +5.0%' }],
  ['impatient', { name: 'Impaciente', effect: 'Tempo de recarga de habilidades ativas reduzido em 15%' }],
  ['mercy_hit', { name: 'Clemência', effect: 'Pacifista. Não pode deixar os alvos de seus ataques com vida inferior a 1' }],
]);

// The PT passive page has a different card structure than EN (no item links,
// no locale-independent id), and the card order differs between locales, so PT
// cards are matched to EN cards by a content signature: rank, tooltip weight,
// effect stats and linked pal icons. Stat labels in the markup variant are
// internal game keys on both pages except for these localized PT labels
// (verified by identical per-label card counts across locales).
const PT_PASSIVE_LABELS = new Map([
  ['Velocidade de trabalho', 'Work Speed'],
  ['Ataque', 'Attack'],
  ['Defesa', 'Defense'],
  ['PV máximo', 'Max Health'],
  ['Carga', 'Carrying Capacity'],
]);

// Topic keywords for the free-text effect variant; each must fire on both the
// EN and PT phrasing (or neither) to keep signatures symmetric.
const PASSIVE_KEYWORDS = [
  [/fire|fogo/i, 'Fire'], [/water|água/i, 'Water'], [/lightning|electric|elétric/i, 'Electricity'],
  [/ice|gelo/i, 'Ice'], [/grass|leaf|grama/i, 'Leaf'], [/ground|earth|terra/i, 'Earth'],
  [/dark|escurid/i, 'Dark'], [/dragon|dracônic/i, 'Dragon'], [/neutral|normal|neutro|não elementai/i, 'Normal'],
  [/movement speed|velocidade de movimento/i, 'MoveSpeed'], [/work speed|velocidade de trabalho/i, 'WorkSpeed'],
  [/\bSAN\b/i, 'SAN'], [/hunger|fome|fartura/i, 'Hunger'], [/defense|defesa/i, 'Defense'],
  [/\battack\b(?!\s+damage)|\bataque\b/i, 'Attack'], [/health|\bHP\b|\bPV\b/i, 'HP'], [/stamina|fôlego/i, 'Stamina'],
  [/sleep|dorme|night|noite|nocturnal|nap\b|insônia/i, 'NoSleep'], [/sale price|sold|venda/i, 'SalePrice'],
  [/cooldown|tempo de recarga|habilidade ativa/i, 'Cooldown'], [/breeding|incuba|acasalamento|egg|\bovos?\b/i, 'Breeding'],
  [/logging|cortar árvores|florestal/i, 'Logging'], [/mining|minério|garimp/i, 'Mining'],
  [/reload|velocidade de recarga/i, 'Reload'], [/explosion|explosã/i, 'Explosion'],
];

function normalizePassiveValue(value) {
  return value.replace(/\s+/g, '').replace(/^[+-]/, '').replace(/\.0(?=%|$)/, '');
}

// Builds the cross-locale signature from the effect block's inner HTML.
function passiveSignatureLines(inner) {
  const lines = [];
  const statPattern = /<div>([^<]+)<span class="(?:positive|negative)">([^<]+)<\/a>\s*<span class="badge bg-dark">\(([^)]+)\)/g;
  let statMatch;
  while ((statMatch = statPattern.exec(inner))) {
    const label = PT_PASSIVE_LABELS.get(statMatch[1].trim()) ?? statMatch[1].trim();
    lines.push(`M:${label}=${statMatch[2].replace(/\s+/g, '')}@${statMatch[3]}`);
  }
  if (lines.length) return lines;
  // Free-text variant: one blob — topic keywords in order of appearance (list
  // order survives translation), then the numbers in order. Locales break
  // lines and phrase signs differently, so only single-value blobs keep a sign.
  const text = decodeHtml(inner.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ');
  const found = [];
  for (const [pattern, key] of PASSIVE_KEYWORDS) {
    const keywordMatch = pattern.exec(text);
    if (keywordMatch) found.push([keywordMatch.index, key]);
  }
  const keys = found.sort((a, b) => a[0] - b[0]).map(([, key]) => key);
  const rawValues = [...text.matchAll(/[+-]?\d+(?:\.\d+)?\s*%?/g)].map((valueMatch) => valueMatch[0]);
  let values;
  if (rawValues.length === 1) {
    const trimmed = rawValues[0].trim();
    const explicit = trimmed.startsWith('-') ? '-' : trimmed.startsWith('+') ? '+' : '';
    const inferred = explicit
      || (/decrease|drops|reduz|diminui|slower|faster/i.test(text) ? '-' : /increase|aumenta|melhora/i.test(text) ? '+' : '');
    values = inferred + normalizePassiveValue(trimmed);
  } else {
    values = rawValues.map(normalizePassiveValue).join(',');
  }
  return [`P:${keys.join('/')}=${values}`];
}

export function parsePassivePage(html) {
  // The document also embeds the 298-entry generic "Passive Skills" tab, which
  // contains armor, accessory and internal stat modifiers. Team building must
  // only import the selected "Pal Passive Skills /114" tab.
  const activeTab = /<div id="[^"]+" class="tab-pane fade show active">/i.exec(html);
  if (!activeTab) {
    throw new Error('Pal Passive Skills section not found in PalDB page');
  }
  const sectionStart = activeTab.index;
  const nextTab = /<div id="[^"]+" class="tab-pane fade">/i.exec(
    html.slice(sectionStart + activeTab[0].length),
  );
  if (!nextTab) {
    throw new Error('End of Pal Passive Skills section not found in PalDB page');
  }
  const sectionEnd = sectionStart + activeTab[0].length + nextTab.index;
  const section = html.slice(sectionStart, sectionEnd);
  const passives = [];
  for (const chunk of section.split(PASSIVE_MARKER).slice(1)) {
    const nameMatch = chunk.match(/<div class="passive-rank(-?\d+) ps-2 py-1">([\s\S]*?)<\/div>/i);
    if (!nameMatch) continue;
    const rank = Number(nameMatch[1]);
    const name = textContent(nameMatch[2]);
    const tier = PASSIVE_RANK_OVERRIDES.get(snakeCase(name)) ?? rank;
    const bodyMatch = chunk.match(/<div class="p-2"(?: style="position: relative")?>/i);
    let effect = '';
    let signatureLines = [];
    let effectDiv;
    if (bodyMatch) {
      effectDiv = firstBalancedDiv(chunk, bodyMatch.index);
      if (effectDiv) {
        effect = cleanEffectText(effectDiv);
        signatureLines = passiveSignatureLines(effectDiv);
      }
    }
    const weight = chunk.match(/Weight (\d+)/)?.[1] ?? '?';
    const pals = [...chunk.matchAll(/<a[^>]*href="([^"]+)"[^>]*><img[^>]*class="size32 rounded-circle/g)]
      .map((palMatch) => palMatch[1]).sort().join('|');
    const sig = `${rank}|${weight}|${signatureLines.join(';')}|${pals}`;
    passives.push({ name, tier, effect, sig });
  }
  return passives;
}

// Pairs EN passive cards with their PT counterparts by content signature.
// Only unambiguous pairings are accepted; everything else falls back to EN.
export function matchPassiveLocales(english, portuguese) {
  const ptBySignature = new Map();
  for (const card of portuguese) {
    if (!ptBySignature.has(card.sig)) ptBySignature.set(card.sig, []);
    ptBySignature.get(card.sig).push(card);
  }
  const enBySignature = new Map();
  for (const card of english) {
    if (!enBySignature.has(card.sig)) enBySignature.set(card.sig, []);
    enBySignature.get(card.sig).push(card);
  }
  let matched = 0;
  for (const [sig, enCards] of enBySignature) {
    const ptCards = ptBySignature.get(sig) ?? [];
    if (enCards.length === 1 && ptCards.length === 1) {
      enCards[0].pt = ptCards[0];
      matched += 1;
    } else if (ptCards.length > 0
      && new Set(enCards.map((card) => card.name)).size === 1
      && new Set(ptCards.map((card) => card.name)).size === 1) {
      // PalDB repeats identical passives for different obtain sources; when the
      // whole group shares one name per locale the pairing is still safe.
      for (const card of enCards) card.pt = ptCards[0];
      matched += enCards.length;
    }
  }
  return matched;
}

// --- Gear -------------------------------------------------------------------

const GEAR_MARKER = '<div class="col"><div class="card itemPopup">';
const HELMET_PATTERN = /helmet|helm\b|head\d+|hat|cap\b|hood|crown|hair band|beret|mask/i;
// PalDB's category pages include unfinished/internal records alongside items
// players can actually equip. These entries either use raw localization keys,
// placeholder descriptions ("en Text"), unrelated icons, or are explicitly WIP.
const INTERNAL_GEAR_SLUGS = new Set([
  'Axe4',
  'CaptureRope',
  'PenguinLauncher',
  'ThrowStone',
  'RecurveBow',
  'AirGrapplingGun',
  'Ballistic_Shield',
  'ClawsPendant',
  'FangNecklace',
  'Night_Vision_Goggles',
]);
const PT_GEAR_NAME_OVERRIDES = new Map([
  ['Gatling_Gun', 'Metralhadora Gatling'],
  ['Quadruple_Air_Dash_Boots', 'Botas de Corrida Aérea Quádrupla'],
]);

export function parseGearPage(html) {
  const items = [];
  for (const chunk of html.split(GEAR_MARKER).slice(1)) {
    const nameMatch = chunk.match(/<a class="itemname" data-hover="([^"]*)" href="([^"]+)">([\s\S]*?)<\/a>/i);
    if (!nameMatch) continue;
    const sourceMatch = nameMatch[1].match(/^\?s=Items%2F(.+)$/i);
    const sourceId = sourceMatch ? decodeSourceId(sourceMatch[1]) : undefined;
    const slug = decodeHtml(nameMatch[2]);
    const iconMatch = chunk.match(/<div class="hover_icon_bg[\s\S]*?<img[^>]*src="([^"]+)"/i);
    const statMatch = chunk.match(
      /<span class="bg-dark bg-gradient p-1">([\s\S]*?)<\/span><span class="border p-1">([\s\S]*?)<\/span>/i,
    );
    const rarityMatch = chunk.match(/<div class="hover_banner banner_rarity(\d)"/i);
    items.push({
      // The slug is stable between locales even when PalDB replaces data-hover
      // with a locale-specific cache URL. sourceId therefore cannot be the
      // primary translation key.
      key: slug,
      slug,
      sourceId,
      name: textContent(nameMatch[3]),
      iconUrl: iconMatch?.[1],
      effect: statMatch ? `${textContent(statMatch[1])} ${textContent(statMatch[2])}` : undefined,
      rarity: rarityMatch ? Number(rarityMatch[1]) : undefined, // 0 common .. 4 legendary
    });
  }
  return items;
}

function matchGearLocale(item, localizedItems) {
  if (item.sourceId) {
    const bySourceId = localizedItems.find((candidate) => candidate.sourceId === item.sourceId);
    if (bySourceId) return bySourceId;
  }
  const sameSlug = localizedItems.filter((candidate) => candidate.slug === item.slug);
  return sameSlug.find((candidate) => candidate.rarity === item.rarity) ?? sameSlug[0];
}

// --- Output -----------------------------------------------------------------

// Matches the one-line-per-entry style of the existing data files:
// { "id": "legend", "tier": 3, "names": { "en": "Legend", ... } }
function formatEntry(entry) {
  const json = JSON.stringify(entry);
  let out = '';
  let inString = false;
  let escaped = false;
  for (const char of json) {
    if (inString) {
      out += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') { inString = true; out += char; }
    else if (char === ':' || char === ',') out += `${char} `;
    else if (char === '{') out += '{ ';
    else if (char === '}') out += ' }';
    else out += char;
  }
  return `  ${out}`;
}

function formatArray(entries) {
  return `[\n${entries.map(formatEntry).join(',\n')}\n]\n`;
}

const shouldFetch = process.argv.includes('--fetch');
const shouldFetchImages = shouldFetch || process.argv.includes('--fetch-images');
const log = console.log;

const pages = {};
for (const page of [PASSIVE_PAGE, ...GEAR_PAGES.map((g) => g.page)]) {
  for (const locale of LOCALES) {
    pages[`${page}_${locale}`] = await loadPage(page, locale, { fetch: shouldFetch, log });
  }
}

// Passives: the PT page orders cards differently than EN and has no
// locale-independent id, so cards are paired by content signature.
const passivesEn = parsePassivePage(pages[`${PASSIVE_PAGE}_en`]);
const passivesPt = parsePassivePage(pages[`${PASSIVE_PAGE}_pt`]);
const matchedPassives = matchPassiveLocales(passivesEn, passivesPt);
log(`Passive cards: EN ${passivesEn.length}, PT ${passivesPt.length}, paired by signature: ${matchedPassives}`);

const seenPassiveIds = new Set();
const passives = [];
let passivePtCoverage = 0;
for (const en of passivesEn) {
  const id = snakeCase(en.name);
  if (seenPassiveIds.has(id)) continue; // PalDB repeats identical passives per obtain source
  seenPassiveIds.add(id);
  // A placeholder PT name ("pt-BR_Text") means paldb has no translation — fall back to EN.
  // Manually verified overrides win over signature pairing.
  const pt = PT_PASSIVE_OVERRIDES.get(id)
    ?? (en.pt && !PLACEHOLDER_NAME.test(en.pt.name) ? en.pt : undefined);
  if (pt) passivePtCoverage += 1;
  passives.push({
    id,
    tier: en.tier,
    names: { en: en.name, 'pt-BR': pt?.name || en.name },
    effects: { en: en.effect || pt?.effect || '', 'pt-BR': pt?.effect || en.effect || '' },
  });
}
log(`Passives with a PT translation: ${passivePtCoverage}/${passives.length} (rest fall back to EN)`);

// Gear: dedupe by EN name (PalDB lists schematic rarity variants); PT matched
// by the locale-independent href slug.
// Unlocalized/unused items show placeholder junk or raw item keys
// ("Launcher_Meat", "PalDopingShot_3") instead of a display name.
const seenGearNames = new Set();
const seenGearIds = new Set();
const gear = [];
const skipped = [];
for (const { page, kind } of GEAR_PAGES) {
  const enItems = parseGearPage(pages[`${page}_en`]);
  const ptItems = parseGearPage(pages[`${page}_pt`]);
  log(`${page} cards: EN ${enItems.length}, PT ${ptItems.length}`);
  for (const en of enItems) {
    if (INTERNAL_GEAR_SLUGS.has(en.slug)) {
      skipped.push(`${page}: "${en.name}" (${en.sourceId ?? en.slug}) — internal/WIP record, not player gear`);
      continue;
    }
    if (/^NPC_/i.test(en.name)) {
      skipped.push(`${page}: "${en.name}" (${en.sourceId ?? en.key}) — internal NPC item, not player gear`);
      continue;
    }
    if (PLACEHOLDER_NAME.test(en.name) || en.name.includes('_')) {
      skipped.push(`${page}: "${en.name}" (${en.sourceId ?? en.key}) — no proper display name on either locale page, excluded`);
      continue;
    }
    if (seenGearNames.has(en.name)) {
      skipped.push(`${page}: "${en.name}" (${en.sourceId ?? en.key}) — duplicate name`);
      continue;
    }
    seenGearNames.add(en.name);
    const id = snakeCase(en.name);
    if (seenGearIds.has(id)) {
      skipped.push(`${page}: "${en.name}" — id ${id} already used`);
      continue;
    }
    seenGearIds.add(id);
    const pt = matchGearLocale(en, ptItems);
    // A placeholder/raw PT name means paldb has no translation — fall back to EN.
    const translatedPtName = pt?.name && !PLACEHOLDER_NAME.test(pt.name) && !pt.name.includes('_')
      ? pt.name
      : undefined;
    const ptName = PT_GEAR_NAME_OVERRIDES.get(en.slug) ?? translatedPtName;
    const resolvedKind = kind === 'armor' && (HELMET_PATTERN.test(en.sourceId ?? '') || HELMET_PATTERN.test(en.name))
      ? 'helmet'
      : kind;
    gear.push({
      id,
      kind: resolvedKind,
      names: { en: en.name, 'pt-BR': ptName || en.name },
      ...(en.effect || pt?.effect ? { effects: { en: en.effect || pt.effect, 'pt-BR': pt?.effect || en.effect } } : {}),
      ...(en.iconUrl || pt?.iconUrl ? { iconUrl: en.iconUrl || pt.iconUrl } : {}),
      ...(en.sourceId || pt?.sourceId ? { sourceId: en.sourceId || pt.sourceId } : {}),
      // rarity of the kept (first/base) occurrence; omitted when unmarked — the app defaults to 0
      ...(en.rarity !== undefined ? { rarity: en.rarity } : {}),
    });
  }
}

const remoteGearIconUrls = gear.map((item) => item.iconUrl).filter(Boolean);
await syncGearIcons(remoteGearIconUrls, { shouldDownload: shouldFetchImages, log });
for (const item of gear) {
  if (item.iconUrl) item.iconUrl = gearIconAsset(item.iconUrl).webPath;
}

// --- Quality checks ---------------------------------------------------------

const failures = [];
const tierCounts = {};
for (const passive of passives) tierCounts[passive.tier] = (tierCounts[passive.tier] ?? 0) + 1;
const kindCounts = {};
for (const item of gear) kindCounts[item.kind] = (kindCounts[item.kind] ?? 0) + 1;
const rarityCounts = {};
for (const item of gear) {
  const rarity = item.rarity ?? 0;
  if (item.rarity !== undefined && (item.rarity < 0 || item.rarity > 4)) failures.push(`gear ${item.id} rarity ${item.rarity} out of range`);
  rarityCounts[item.kind] ??= {};
  rarityCounts[item.kind][rarity] = (rarityCounts[item.kind][rarity] ?? 0) + 1;
}
for (const slug of INTERNAL_GEAR_SLUGS) {
  const leaked = gear.find((item) => item.sourceId === slug || item.id === snakeCase(slug));
  if (leaked) failures.push(`internal/WIP gear leaked into catalog: ${leaked.id}`);
}
for (const item of gear) {
  if (!item.iconUrl) failures.push(`${item.kind} ${item.id} is missing its icon`);
  else if (!item.iconUrl.startsWith(`${GEAR_ASSET_WEB_ROOT}/`)) {
    failures.push(`${item.kind} ${item.id} still uses a remote icon: ${item.iconUrl}`);
  }
}
const attackPendant = gear.find((item) => item.id === 'attack_pendant');
if (!attackPendant) failures.push('missing accessory: Attack Pendant');
else {
  if (attackPendant.kind !== 'accessory') failures.push(`attack_pendant kind ${attackPendant.kind}, expected accessory`);
  if (attackPendant.names['pt-BR'] !== 'Pingente de Ataque') {
    failures.push(`attack_pendant has incorrect pt-BR name: "${attackPendant.names['pt-BR']}"`);
  }
  if (!attackPendant.iconUrl) failures.push('attack_pendant is missing its icon');
}

const expectedTiers = {
  nimble: 1,
  runner: 2,
  swift: 3,
  artisan: 3,
  legend: 4,
  demon_s_hand: 5,
  mercy_hit: -1,
  bottomless_stomach: -2,
  slacker: -3,
};
const requiredPassives = ['Legend', 'Lucky', 'Swift', 'Artisan', 'Ferocious', 'Musclehead', 'Burly Body', 'Coward', 'Pacifist', 'Slacker'];
const passiveByName = new Map(passives.map((p) => [p.names.en, p]));
if (passives.length !== 114) {
  failures.push(`expected exactly 114 Pal passives, imported ${passives.length}`);
}
for (const name of requiredPassives) {
  if (!passiveByName.has(name)) failures.push(`missing passive: ${name}`);
}
for (const [id, tier] of Object.entries(expectedTiers)) {
  const passive = passives.find((p) => p.id === id);
  if (!passive) failures.push(`missing passive id: ${id}`);
  else if (passive.tier !== tier) failures.push(`passive ${id} tier ${passive.tier}, expected ${tier}`);
}
for (const entry of [...passives, ...gear]) {
  for (const [locale, localeName] of Object.entries(entry.names)) {
    if (!localeName || !localeName.trim()) failures.push(`entry ${entry.id} has an empty ${locale} name`);
    else if (PLACEHOLDER_NAME.test(localeName)) failures.push(`entry ${entry.id} has a placeholder ${locale} name: "${localeName}"`);
  }
  if (passives.includes(entry) && (!entry.effects.en || !entry.effects['pt-BR'])) failures.push(`passive ${entry.id} missing an effect`);
}
for (const passive of passives) {
  if (![-3, -2, -1, 1, 2, 3, 4, 5].includes(passive.tier)) {
    failures.push(`passive ${passive.id} has invalid rank ${passive.tier}`);
  }
  if (/\b(?:Attack|Defense|Health|Damage Reduction|Resistance|Enhancement|Speedy Worker) .*\bLv\.\s*\d/i.test(passive.names.en)) {
    failures.push(`passive ${passive.id} looks like an internal equipment modifier: "${passive.names.en}"`);
  }
}
for (const item of gear) {
  if (item.names.en.includes('_') || item.names['pt-BR'].includes('_')) {
    failures.push(`gear ${item.id} has a raw internal name: "${item.names.en}" / "${item.names['pt-BR']}"`);
  }
}
for (const id of ['refined_metal_helm', 'witch_hat', 'feathered_hair_band', 'metal_helm']) {
  const item = gear.find((g) => g.id === id);
  if (!item) failures.push(`missing gear id: ${id}`);
  else if (item.kind !== 'helmet') failures.push(`gear ${id} kind ${item.kind}, expected helmet`);
}

log(`\nPassives: ${passives.length} total, by rank: ${JSON.stringify(tierCounts)}`);
log(`Gear: ${gear.length} total, by kind: ${JSON.stringify(kindCounts)}`);
log(`Gear rarity distribution by kind (rarity: count):`);
for (const [kind, counts] of Object.entries(rarityCounts)) {
  log(`  ${kind}: ${Object.entries(counts).sort(([a], [b]) => a - b).map(([r, c]) => `${r}: ${c}`).join(', ')}`);
}
log(`Legendary (rarity 4) items: ${gear.filter((item) => item.rarity === 4).map((item) => item.names.en).join(', ') || '(none)'}`);
const ptFallbacks = [...passives, ...gear].filter((entry) => entry.names['pt-BR'] === entry.names.en).length;
log(`Entries falling back to EN for pt-BR: ${ptFallbacks}`);
for (const kind of Object.keys(kindCounts)) {
  const items = gear.filter((item) => item.kind === kind);
  const fallbacks = items.filter((item) => item.names['pt-BR'] === item.names.en).length;
  log(`  ${kind}: ${fallbacks}/${items.length} fall back to EN`);
}
const internalSkips = skipped.filter((line) => line.includes('no proper display name'));
log(`Excluded ${internalSkips.length} cards with raw internal names:`);
for (const line of internalSkips) log(`  ${line}`);
if (skipped.length) {
  log(`Skipped ${skipped.length} gear cards (rarity variants / NPC items). First 10:`);
  for (const line of skipped.slice(0, 10)) log(`  ${line}`);
}
if (failures.length) {
  log(`\nQUALITY CHECK FAILURES:\n  ${failures.join('\n  ')}`);
  process.exitCode = 1;
} else {
  await writeFile(PASSIVES_OUT, formatArray(passives));
  await writeFile(GEAR_OUT, formatArray(gear));
  log(`\nWrote ${PASSIVES_OUT}`);
  log(`Wrote ${GEAR_OUT}`);
}
