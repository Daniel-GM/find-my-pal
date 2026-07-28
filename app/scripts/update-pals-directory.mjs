// Regenerates the Pal directory and its detail data from PalDB.
//
// By default this reads the cached snapshots in .memory/scratch. Use --fetch
// to refresh the list, every Pal detail page, habitat JSON and local images.
//
//   npm run update:pals -- --fetch

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const PALDB_ORIGIN = 'https://paldb.cc';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SNAPSHOT_DIR = path.join(REPO_ROOT, '.memory', 'scratch');
const DETAIL_SNAPSHOT_DIR = path.join(SNAPSHOT_DIR, 'pal-details');
const HABITAT_SNAPSHOT_DIR = path.join(SNAPSHOT_DIR, 'pal-habitats');
const PALS_OUT = path.join(REPO_ROOT, 'app', 'src', 'data', 'json', 'pals.json');
const DETAILS_OUT = path.join(REPO_ROOT, 'app', 'src', 'data', 'json', 'palDetails.json');
const PALS_ASSET_DIR = path.join(REPO_ROOT, 'app', 'public', 'assets', 'pals');
const DROPS_ASSET_DIR = path.join(REPO_ROOT, 'app', 'public', 'assets', 'drops');
const MAPS_ASSET_DIR = path.join(REPO_ROOT, 'app', 'public', 'assets', 'maps');
const SHOULD_FETCH = process.argv.includes('--fetch');

const MAPS = {
  palpagos: {
    slug: 'Palpagos_Islands',
    tileDirectory: 'image/map8',
    dataFile: 'map_data_en.js',
    perPixel: 459,
    ingameXStart: undefined,
    ingameYStart: undefined,
    bounds: {
      minX: -1099400,
      minY: -724400,
      maxX: 349400,
      maxY: 724400,
    },
  },
  worldTree: {
    slug: 'The_World_Tree',
    tileDirectory: 'image/treemap8',
    dataFile: 'treemap_data_en.js',
    perPixel: 1335.144531,
    ingameXStart: -648.7,
    ingameYStart: 127.7,
    bounds: {
      minX: 347351.5,
      minY: -818197,
      maxX: 689148.5,
      maxY: -476400,
    },
  },
};

const ELEMENT_BY_LABEL = {
  Neutral: 'neutral',
  Fire: 'fire',
  Water: 'water',
  Electric: 'electric',
  Grass: 'grass',
  Dark: 'dark',
  Dragon: 'dragon',
  Ground: 'ground',
  Ice: 'ice',
};

const WORK_BY_LABEL = {
  Kindling: 'kindling',
  Watering: 'watering',
  Planting: 'planting',
  'Generating Electricity': 'generatingElectricity',
  Handiwork: 'handiwork',
  Gathering: 'gathering',
  Lumbering: 'lumbering',
  Mining: 'mining',
  'Medicine Production': 'medicineProduction',
  Cooling: 'cooling',
  Transporting: 'transporting',
  Farming: 'farming',
};

function compactText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function snakeCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function safeSnapshotName(value) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_');
}

async function fetchResponse(url, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: '*/*',
          referer: `${PALDB_ORIGIN}/`,
          'user-agent': 'Mozilla/5.0 find-my-pal directory data updater/1.0',
        },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 900));
      }
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? String(lastError)}`);
}

async function fetchText(url) {
  return (await fetchResponse(url)).text();
}

async function fetchJson(url) {
  return (await fetchResponse(url)).json();
}

async function fetchBytes(url) {
  return Buffer.from(await (await fetchResponse(url)).arrayBuffer());
}

async function loadListPage(locale) {
  const file = path.join(SNAPSHOT_DIR, `Pals_${locale}.html`);
  if (SHOULD_FETCH) {
    const html = await fetchText(`${PALDB_ORIGIN}/${locale}/Pals`);
    await mkdir(SNAPSHOT_DIR, { recursive: true });
    await writeFile(file, html);
    return html;
  }
  return readFile(file, 'utf8');
}

async function loadDetailPage(slug, locale) {
  const directory = path.join(DETAIL_SNAPSHOT_DIR, locale);
  const file = path.join(directory, `${safeSnapshotName(slug)}.html`);
  if (SHOULD_FETCH) {
    const html = await fetchText(`${PALDB_ORIGIN}/${locale}/${encodeURIComponent(slug)}`);
    await mkdir(directory, { recursive: true });
    await writeFile(file, html);
    return html;
  }
  return readFile(file, 'utf8');
}

async function loadHabitat(sourceId) {
  const file = path.join(HABITAT_SNAPSHOT_DIR, `${safeSnapshotName(sourceId)}.json`);
  if (SHOULD_FETCH) {
    let habitat;
    try {
      habitat = await fetchJson(`${PALDB_ORIGIN}/paldex/${sourceId.toLowerCase()}.json`);
    } catch (error) {
      console.warn(`${sourceId}: habitat unavailable (${error.message})`);
      habitat = {};
    }
    await mkdir(HABITAT_SNAPSHOT_DIR, { recursive: true });
    await writeFile(file, `${JSON.stringify(habitat)}\n`);
    return habitat;
  }
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

function extractAssignedJson(source, variableName) {
  const marker = `var ${variableName} = `;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return undefined;
  const start = source.indexOf('[', markerIndex + marker.length);
  if (start < 0) return undefined;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === '[') depth += 1;
    else if (character === ']') {
      depth -= 1;
      if (depth === 0) return JSON.parse(source.slice(start, index + 1));
    }
  }
  return undefined;
}

async function loadFixedHabitats() {
  const output = {};
  for (const [mapId, map] of Object.entries(MAPS)) {
    const file = path.join(SNAPSHOT_DIR, map.dataFile);
    let source;
    if (SHOULD_FETCH) {
      source = await fetchText(`${PALDB_ORIGIN}/js/${map.dataFile}`);
      await writeFile(file, source);
    } else {
      source = await readFile(file, 'utf8');
    }
    output[mapId] = extractAssignedJson(source, 'fixedDungeon') ?? [];
  }
  return output;
}

function parsePalList(html) {
  const document = new JSDOM(html).window.document;
  return [...document.querySelectorAll('.card.h-100')].flatMap((card) => {
    const anchor = card.querySelector('a.itemname[href]');
    const checkbox = card.querySelector('input[type="checkbox"][value]');
    if (!anchor || !checkbox) return [];

    const numberText = card.querySelector('.text-white-50.small')?.textContent ?? '';
    const elements = [...card.querySelectorAll('img[data-bs-title]')]
      .map((image) => ELEMENT_BY_LABEL[image.getAttribute('data-bs-title')])
      .filter(Boolean);
    const workSuitability = {};
    for (const button of card.querySelectorAll('.my-1 button[data-bs-title]')) {
      const workType = WORK_BY_LABEL[button.getAttribute('data-bs-title')];
      const level = Number(compactText(button.textContent));
      if (workType && level > 0) workSuitability[workType] = level;
    }

    return [{
      name: compactText(anchor.textContent),
      slug: anchor.getAttribute('href'),
      sourceId: checkbox.getAttribute('value'),
      number: Number(numberText.replace(/\D+/g, '')) || 0,
      elements,
      workSuitability,
      iconUrl: card.querySelector('.flex-shrink-0 img[src]')?.getAttribute('src'),
    }];
  });
}

function sectionByHeading(document, predicate) {
  const heading = [...document.querySelectorAll('h5')].find(predicate);
  return heading?.parentElement;
}

function sectionRows(section) {
  return [...(section?.querySelectorAll(':scope > .d-flex') ?? [])].map((row) => {
    const children = row.querySelectorAll(':scope > div');
    return [
      compactText(children[0]?.textContent),
      compactText(children[children.length - 1]?.textContent),
    ];
  });
}

function numericStats(document) {
  const section = sectionByHeading(document, (heading) => compactText(heading.textContent) === 'Stats');
  const values = new Map(sectionRows(section));
  const number = (key) => {
    const parsed = Number(values.get(key));
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  return {
    size: values.get('Size'),
    rarity: number('Rarity'),
    hp: number('Health'),
    food: number('Food'),
    meleeAttack: number('MeleeAttack'),
    attack: number('Attack'),
    defense: number('Defense'),
    workSpeed: number('Work Speed'),
    support: number('Support'),
    captureRate: number('CaptureRateCorrect'),
    maleProbability: number('MaleProbability'),
    breedingPower: number('CombiRank'),
    egg: values.get('Egg'),
    sourceId: values.get('Code'),
  };
}

function parseRange(value) {
  const numbers = compactText(value).match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (!numbers.length) return undefined;
  return numbers.length === 1 ? [numbers[0], numbers[0]] : [numbers[0], numbers[1]];
}

function level80Stats(document) {
  const section = sectionByHeading(document, (heading) => compactText(heading.textContent) === 'Level 80');
  const values = new Map(sectionRows(section));
  return {
    hp: parseRange(values.get('Health')),
    attack: parseRange(values.get('Attack')),
    defense: parseRange(values.get('Defense')),
  };
}

function level1Stats(stats) {
  const growthRange = (base, fixed, coefficient) => {
    if (!Number.isFinite(base)) return undefined;
    const growth = base * coefficient;
    return [
      Math.round(fixed + growth),
      Math.round(fixed + growth * 1.3),
    ];
  };
  return {
    hp: growthRange(stats.hp, 505, 0.5),
    attack: growthRange(stats.attack, 100, 0.075),
    defense: growthRange(stats.defense, 50, 0.075),
  };
}

function sourceIdFromHover(value = '') {
  const decoded = decodeURIComponent(value.replaceAll('&amp;', '&'));
  return decoded.match(/Items\/([^&]+)/)?.[1];
}

function parseDrops(document) {
  const section = sectionByHeading(
    document,
    (heading) =>
      heading.getAttribute('data-i18n') === 'paldex_drop_item_title'
      || /Possible Drops|Itens obtidos/i.test(compactText(heading.textContent)),
  );
  return [...(section?.querySelectorAll('tbody tr') ?? [])].flatMap((row) => {
    const anchor = row.querySelector('a.itemname[href]');
    if (!anchor) return [];
    const cells = row.querySelectorAll('td');
    const probability = Number(compactText(cells[1]?.textContent).replace(/[^\d.]+/g, ''));
    return [{
      slug: anchor.getAttribute('href'),
      itemId:
        sourceIdFromHover(anchor.getAttribute('data-hover') ?? '')
        ?? anchor.getAttribute('href')?.replace(/^.*\//, ''),
      name: compactText(anchor.textContent),
      quantity: compactText(row.querySelector('.itemQuantity')?.textContent) || '1',
      probability: Number.isFinite(probability) ? probability : 0,
      iconUrl: anchor.querySelector('img[src]')?.getAttribute('src'),
    }];
  });
}

function parseSummary(document) {
  const section = sectionByHeading(
    document,
    (heading) =>
      heading.getAttribute('data-i18n-tw') === '簡介'
      || /^(Summary|Resumo)$/i.test(compactText(heading.textContent)),
  );
  const heading = section?.querySelector('h5');
  const body = heading?.nextElementSibling;
  return compactText(body?.textContent);
}

function parseDetail(englishHtml, portugueseHtml) {
  const english = new JSDOM(englishHtml).window.document;
  const portuguese = new JSDOM(portugueseHtml).window.document;
  const stats = numericStats(english);
  const portugueseStats = numericStats(portuguese);
  const englishDrops = parseDrops(english);
  const portugueseDrops = parseDrops(portuguese);
  const portugueseBySlug = new Map(portugueseDrops.map((drop) => [drop.slug, drop]));

  return {
    summaries: {
      en: parseSummary(english),
      'pt-BR': parseSummary(portuguese) || parseSummary(english),
    },
    stats,
    eggNames: {
      en: stats.egg,
      'pt-BR': portugueseStats.egg || stats.egg,
    },
    level1: level1Stats(stats),
    level80: level80Stats(english),
    drops: englishDrops.map((drop, index) => {
      const localized = portugueseBySlug.get(drop.slug) ?? portugueseDrops[index];
      return {
        itemId: drop.itemId,
        slug: drop.slug,
        names: {
          en: drop.name,
          'pt-BR': localized?.name || drop.name,
        },
        quantity: drop.quantity,
        probability: drop.probability,
        iconUrl: drop.iconUrl,
      };
    }),
  };
}

function normalizedPoint(point, bounds) {
  if (
    !Number.isFinite(point?.X)
    || !Number.isFinite(point?.Y)
    || point.X <= bounds.minX
    || point.X >= bounds.maxX
    || point.Y <= bounds.minY
    || point.Y >= bounds.maxY
  ) {
    return undefined;
  }
  return {
    x: (point.Y - bounds.minY) / (bounds.maxY - bounds.minY),
    y: 1 - ((point.X - bounds.minX) / (bounds.maxX - bounds.minX)),
    level: Number.isFinite(point.lv) ? point.lv : undefined,
  };
}

function aggregateHabitat(points, bounds) {
  const seen = new Set();
  const normalized = points
    .map((point) => normalizedPoint(point, bounds))
    .filter(Boolean)
    .filter((point) => {
      const key = `${point.x.toFixed(6)}:${point.y.toFixed(6)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const bins = new Map();
  for (const point of normalized) {
    const key = `${Math.min(31, Math.floor(point.x * 32))}:${Math.min(31, Math.floor(point.y * 32))}`;
    const bin = bins.get(key) ?? {
      xTotal: 0,
      yTotal: 0,
      weight: 0,
      levels: [],
    };
    bin.xTotal += point.x;
    bin.yTotal += point.y;
    bin.weight += 1;
    if (point.level !== undefined) bin.levels.push(point.level);
    bins.set(key, bin);
  }
  const heatPoints = [...bins.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 180)
    .map((bin) => [
      Number((bin.xTotal / bin.weight).toFixed(4)),
      Number((bin.yTotal / bin.weight).toFixed(4)),
      bin.weight,
      ...(bin.levels.length
        ? [Math.min(...bin.levels), Math.max(...bin.levels)]
        : []),
    ]);
  return { count: normalized.length, points: heatPoints };
}

function realPointFromIngame(ipos, map) {
  if (!Number.isFinite(ipos?.X) || !Number.isFinite(ipos?.Y)) return undefined;
  const { bounds } = map;
  const ingameXStart = map.ingameXStart ?? (
    1000 + ((-582888 - bounds.minX) / map.perPixel)
  );
  const ingameYStart = map.ingameYStart ?? (
    1000 + ((-301000 - bounds.minY) / map.perPixel)
  );
  const transformX = (bounds.maxX - bounds.minX) / map.perPixel;
  const transformY = (bounds.maxY - bounds.minY) / map.perPixel;
  const normalizedX = (ipos.X + ingameYStart) / transformY;
  const normalizedY = 1 - ((ipos.Y + ingameXStart) / transformX);
  return {
    X: bounds.minX + ((1 - normalizedY) * (bounds.maxX - bounds.minX)),
    Y: bounds.minY + (normalizedX * (bounds.maxY - bounds.minY)),
    ...(Number.isFinite(ipos.lv) ? { lv: ipos.lv } : {}),
  };
}

function fixedPointsForPal(entries, sourceId, map) {
  const normalizedSource = sourceId.toLocaleLowerCase('en').replace(/^boss_/, '');
  return entries.flatMap((entry) => {
    const entryId = String(entry.id ?? '').toLocaleLowerCase('en').replace(/^boss_/, '');
    if (!entryId || entryId !== normalizedSource) return [];
    const point = entry.pos ?? realPointFromIngame(entry.ipos, map);
    if (!point) return [];
    return [{
      ...point,
      ...(Number.isFinite(entry.lv) ? { lv: entry.lv } : {}),
    }];
  });
}

function parseHabitat(habitat, fixedHabitats, sourceId) {
  const dayLocations = habitat?.dayTimeLocations?.Locations ?? [];
  const nightLocations = habitat?.nightTimeLocations?.Locations ?? [];
  return Object.fromEntries(Object.entries(MAPS).map(([mapId, map]) => [
    mapId,
    {
      day: aggregateHabitat(
        [...dayLocations, ...fixedPointsForPal(fixedHabitats[mapId], sourceId, map)],
        map.bounds,
      ),
      night: aggregateHabitat(
        [...nightLocations, ...fixedPointsForPal(fixedHabitats[mapId], sourceId, map)],
        map.bounds,
      ),
    },
  ]));
}

function assetPath(remoteUrl, directory, webRoot) {
  const parsedUrl = new URL(remoteUrl);
  const extension = path.extname(parsedUrl.pathname) || '.webp';
  const basename = path.basename(parsedUrl.pathname, extension)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .toLowerCase();
  const digest = createHash('sha1').update(remoteUrl).digest('hex').slice(0, 10);
  const filename = `${basename}-${digest}${extension}`;
  return {
    filePath: path.join(directory, filename),
    webPath: `${webRoot}/${filename}`,
  };
}

async function syncAssets(remoteUrls, directory, webRoot, label) {
  const uniqueUrls = [...new Set(remoteUrls.filter(Boolean))];
  await mkdir(directory, { recursive: true });
  let downloaded = 0;
  let present = 0;
  const queue = [...uniqueUrls];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const remoteUrl = queue.shift();
      const asset = assetPath(remoteUrl, directory, webRoot);
      try {
        await access(asset.filePath);
        present += 1;
        continue;
      } catch {
        // Download below.
      }
      if (!SHOULD_FETCH) {
        throw new Error(`Missing ${label} asset ${asset.filePath}; rerun with --fetch`);
      }
      await writeFile(asset.filePath, await fetchBytes(remoteUrl));
      downloaded += 1;
    }
  });
  await Promise.all(workers);
  console.log(`${label}: ${uniqueUrls.length} assets (${downloaded} downloaded, ${present} present)`);
}

async function syncMapTiles() {
  await mkdir(MAPS_ASSET_DIR, { recursive: true });
  const tiles = Object.entries(MAPS).flatMap(([mapId, map]) => (
    [0, 1].flatMap((x) => [0, 1].map((y) => ({
      url: `https://cdn.paldb.cc/${map.tileDirectory}/z1x${x}y${y}.webp`,
      file: path.join(MAPS_ASSET_DIR, `${mapId}-z1-x${x}-y${y}.webp`),
    })))
  ));
  for (const tile of tiles) {
    try {
      await access(tile.file);
    } catch {
      if (!SHOULD_FETCH) throw new Error(`Missing map tile ${tile.file}; rerun with --fetch`);
      await writeFile(tile.file, await fetchBytes(tile.url));
    }
  }
  console.log(`Maps: ${tiles.length} local tiles`);
}

async function main() {
  const previousPals = JSON.parse(await readFile(PALS_OUT, 'utf8'));
  const previousByName = new Map(
    previousPals.map((pal) => [pal.name.toLocaleLowerCase('en'), pal]),
  );
  const [englishListHtml, portugueseListHtml] = await Promise.all([
    loadListPage('en'),
    loadListPage('pt'),
  ]);
  const fixedHabitats = await loadFixedHabitats();
  const englishPals = parsePalList(englishListHtml);
  const portugueseBySlug = new Map(
    parsePalList(portugueseListHtml).map((pal) => [pal.slug, pal]),
  );
  if (englishPals.length < 299) {
    throw new Error(`Expected at least 299 Pals from PalDB, found ${englishPals.length}`);
  }

  const results = new Array(englishPals.length);
  const queue = englishPals.map((pal, index) => ({ pal, index }));
  let completed = 0;
  const workers = Array.from({ length: 7 }, async () => {
    while (queue.length) {
      const { pal, index } = queue.shift();
      const [englishHtml, portugueseHtml, habitat] = await Promise.all([
        loadDetailPage(pal.slug, 'en'),
        loadDetailPage(pal.slug, 'pt'),
        loadHabitat(pal.sourceId),
      ]);
      results[index] = {
        detail: parseDetail(englishHtml, portugueseHtml),
        habitat: parseHabitat(habitat, fixedHabitats, pal.sourceId),
      };
      completed += 1;
      if (completed % 20 === 0 || completed === englishPals.length) {
        console.log(`Pal details: ${completed}/${englishPals.length}`);
      }
    }
  });
  await Promise.all(workers);

  const pals = [];
  const details = {};
  for (let index = 0; index < englishPals.length; index += 1) {
    const source = englishPals[index];
    const localized = portugueseBySlug.get(source.slug);
    const previous = previousByName.get(source.name.toLocaleLowerCase('en'));
    const { detail, habitat } = results[index];
    const remoteIcon = source.iconUrl || previous?.iconUrl;
    const pal = {
      id: previous?.id || snakeCase(source.name),
      iconName: previous?.iconName || source.slug.replaceAll(' ', '_'),
      name: source.name,
      names: {
        en: source.name,
        'pt-BR': localized?.name || source.name,
      },
      number: source.number,
      elements: source.elements,
      breedingPower: detail.stats.breedingPower ?? previous?.breedingPower ?? 0,
      workSuitability: source.workSuitability,
      hp: detail.stats.hp,
      attack: detail.stats.attack,
      defense: detail.stats.defense,
      ...(remoteIcon
        ? { iconUrl: assetPath(remoteIcon, PALS_ASSET_DIR, '/assets/pals').webPath }
        : {}),
    };
    pals.push(pal);
    details[source.name] = {
      slug: source.slug,
      sourceId: detail.stats.sourceId || source.sourceId,
      summaries: detail.summaries,
      stats: {
        size: detail.stats.size,
        rarity: detail.stats.rarity,
        hp: detail.stats.hp,
        attack: detail.stats.attack,
        defense: detail.stats.defense,
        food: detail.stats.food,
        meleeAttack: detail.stats.meleeAttack,
        workSpeed: detail.stats.workSpeed,
        support: detail.stats.support,
        captureRate: detail.stats.captureRate,
        maleProbability: detail.stats.maleProbability,
        egg: detail.eggNames,
      },
      level1: detail.level1,
      level80: detail.level80,
      drops: detail.drops.map((drop) => ({
        ...drop,
        ...(drop.iconUrl
          ? { iconUrl: assetPath(drop.iconUrl, DROPS_ASSET_DIR, '/assets/drops').webPath }
          : {}),
      })),
      habitats: habitat,
    };
  }

  await Promise.all([
    syncAssets(
      englishPals.map((pal) => pal.iconUrl),
      PALS_ASSET_DIR,
      '/assets/pals',
      'Pal icons',
    ),
    syncAssets(
      Object.values(details).flatMap((detail) => detail.drops.map((drop) => {
        const original = results
          .find((result) => result.detail.drops.some((candidate) => candidate.slug === drop.slug))
          ?.detail.drops.find((candidate) => candidate.slug === drop.slug);
        return original?.iconUrl;
      })),
      DROPS_ASSET_DIR,
      '/assets/drops',
      'Drop icons',
    ),
    syncMapTiles(),
  ]);

  const failures = [];
  if (!pals.some((pal) => pal.name === 'Astralym')) failures.push('Astralym is missing');
  if (new Set(pals.map((pal) => pal.name)).size !== pals.length) failures.push('duplicate Pal names');
  for (const pal of pals) {
    const detail = details[pal.name];
    if (!pal.iconUrl) failures.push(`${pal.name}: missing local icon`);
    if (!detail?.sourceId) failures.push(`${pal.name}: missing source id`);
    if (!detail?.level80?.hp || !detail?.level80?.attack || !detail?.level80?.defense) {
      failures.push(`${pal.name}: missing level 80 stats`);
    }
    for (const drop of detail?.drops ?? []) {
      if (!drop.iconUrl) failures.push(`${pal.name}: ${drop.names.en} missing local drop icon`);
    }
  }
  const chikipi = details.Chikipi;
  if (JSON.stringify(chikipi?.level80?.hp) !== JSON.stringify([3300, 4020])) {
    failures.push(`Chikipi level 80 HP is ${JSON.stringify(chikipi?.level80?.hp)}`);
  }
  if (!chikipi?.drops?.some((drop) => drop.names.en === 'Chikipi Poultry')) {
    failures.push('Chikipi Poultry drop is missing');
  }
  if (!chikipi?.habitats?.palpagos?.day?.count) {
    failures.push('Chikipi Palpagos habitat is missing');
  }

  if (failures.length) {
    throw new Error(`QUALITY CHECK FAILURES:\n  ${failures.join('\n  ')}`);
  }
  await Promise.all([
    writeFile(PALS_OUT, `${JSON.stringify(pals, null, 2)}\n`),
    writeFile(DETAILS_OUT, `${JSON.stringify(details, null, 2)}\n`),
  ]);
  console.log(`Pals: ${pals.length}`);
  console.log(`Details: ${Object.keys(details).length}`);
  console.log(`Wrote ${PALS_OUT}`);
  console.log(`Wrote ${DETAILS_OUT}`);
}

await main();
