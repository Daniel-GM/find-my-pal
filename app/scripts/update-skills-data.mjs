// Regenerates active skills and partner skills from PalDB.
//
// By default this reads the cached snapshots in .memory/scratch. Use --fetch
// to refresh the lists and every Pal detail page before regenerating the data.
//
//   node app/scripts/update-skills-data.mjs [--fetch]

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const PALDB_ORIGIN = 'https://paldb.cc';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SNAPSHOT_DIR = path.join(REPO_ROOT, '.memory', 'scratch');
const ACTIVE_OUT = path.join(REPO_ROOT, 'app', 'src', 'data', 'json', 'activeSkills.json');
const PARTNER_OUT = path.join(REPO_ROOT, 'app', 'src', 'data', 'json', 'partnerSkills.json');
const RANK_CACHE = path.join(SNAPSHOT_DIR, 'Partner_Skill_ranks.json');
const SHOULD_FETCH = process.argv.includes('--fetch');

const ELEMENT_BY_CLASS = {
  '00': 'neutral',
  '01': 'fire',
  '02': 'water',
  '03': 'electric',
  '04': 'grass',
  '05': 'dark',
  '06': 'dragon',
  '07': 'ground',
  '08': 'ice',
};

function compactText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function sourceIdFromHover(value = '') {
  const decoded = decodeURIComponent(value.replaceAll('&amp;', '&'));
  return decoded.match(/EPalWazaID::([^&]+)/)?.[1] ?? '';
}

function snakeCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'text/html,application/xhtml+xml',
          referer: `${PALDB_ORIGIN}/`,
          'user-agent': 'Mozilla/5.0 find-my-pal skills data updater/1.0',
        },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      }
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? String(lastError)}`);
}

async function loadListPage(page, locale) {
  const file = path.join(SNAPSHOT_DIR, `${page}_${locale}.html`);
  if (SHOULD_FETCH) {
    const url = `${PALDB_ORIGIN}/${locale}/${page}`;
    console.log(`Fetching ${url}`);
    const html = await fetchText(url);
    await mkdir(SNAPSHOT_DIR, { recursive: true });
    await writeFile(file, html);
    return html;
  }
  return readFile(file, 'utf8');
}

function mainActivePane(document) {
  return [...document.querySelectorAll('.tab-pane')]
    .sort(
      (a, b) =>
        b.querySelectorAll('.card.itemPopup.activeSkill').length
        - a.querySelectorAll('.card.itemPopup.activeSkill').length,
    )[0];
}

function parseActiveSkills(html) {
  const document = new JSDOM(html).window.document;
  const pane = mainActivePane(document);
  if (!pane) return [];

  return [...pane.querySelectorAll('.card.itemPopup.activeSkill')].map((card) => {
    const anchor = card.querySelector('.itemHead a[href]');
    const sourceId = sourceIdFromHover(anchor?.getAttribute('data-hover') ?? '');
    const elementClass = [...(anchor?.classList ?? [])]
      .find((className) => className.startsWith('element_color_'));
    const elementCode = elementClass?.match(/(\d{2})$/)?.[1] ?? '00';
    const stats = card.querySelector('.d-flex.pt-1.px-3');
    const statValues = [...(stats?.querySelectorAll('span') ?? [])]
      .map((span) => Number(compactText(span.textContent)))
      .filter(Number.isFinite);
    const description = compactText(card.querySelector('.card-body')?.textContent);

    return {
      id: snakeCase(sourceId || anchor?.getAttribute('href') || anchor?.textContent || ''),
      sourceId,
      slug: anchor?.getAttribute('href') ?? '',
      name: compactText(anchor?.textContent),
      description,
      element: ELEMENT_BY_CLASS[elementCode] ?? 'neutral',
      cooldown: statValues[0] ?? 0,
      power: statValues[1] ?? 0,
      exclusive: /exclusive skill|habilidade exclusiva/i.test(description),
    };
  });
}

function mergeActiveSkills(english, portuguese) {
  const portugueseBySource = new Map(portuguese.map((skill) => [skill.sourceId, skill]));
  return english.map((skill) => {
    const pt = portugueseBySource.get(skill.sourceId);
    return {
      id: skill.id,
      sourceId: skill.sourceId,
      slug: skill.slug,
      names: {
        en: skill.name,
        'pt-BR': pt?.name || skill.name,
      },
      descriptions: {
        en: skill.description,
        'pt-BR': pt?.description || skill.description,
      },
      element: skill.element,
      cooldown: skill.cooldown,
      power: skill.power,
      exclusive: skill.exclusive,
    };
  });
}

function findPartnerPane(document) {
  return [...document.querySelectorAll('.tab-pane')]
    .sort(
      (a, b) =>
        b.querySelectorAll('.card.itemPopup a.itemname[href]').length
        - a.querySelectorAll('.card.itemPopup a.itemname[href]').length,
    )[0];
}

function parsePartnerSkills(html) {
  const document = new JSDOM(html).window.document;
  const pane = findPartnerPane(document);
  if (!pane) return [];

  const seen = new Set();
  return [...pane.querySelectorAll('.card.itemPopup')].flatMap((card) => {
    const anchor = card.querySelector('a.itemname[href]');
    const slug = anchor?.getAttribute('href') ?? '';
    if (!slug || seen.has(slug)) return [];
    seen.add(slug);

    const skillName = compactText(card.querySelector('span.ms-2')?.textContent);
    const icon = [...card.querySelectorAll('.d-flex img.size64')]
      .at(-1)
      ?.getAttribute('src') ?? '';
    const description = compactText(
      [...card.querySelectorAll('.d-flex .flex-grow-1.ms-2')].at(-1)?.textContent,
    );
    return [{
      palName: compactText(anchor?.textContent),
      palSlug: slug,
      skillName,
      description,
      iconUrl: icon,
    }];
  });
}

function numericRangeUnits(description) {
  return [...description.matchAll(/-?\d+(?:\.\d+)?\s*~\s*-?\d+(?:\.\d+)?\)?\s*(%?)/g)]
    .map((match) => match[1] || '');
}

function endpointProgression(description) {
  const ranges = [...description.matchAll(
    /(-?\d+(?:\.\d+)?)\s*~\s*(-?\d+(?:\.\d+)?)\)?\s*(%?)/g,
  )];
  if (!ranges.length) return [];
  return [
    {
      stars: 0,
      level: 1,
      values: ranges.map((range) => `${range[1]}${range[3] || ''}`),
    },
    {
      stars: 4,
      level: 5,
      values: ranges.map((range) => `${range[2]}${range[3] || ''}`),
    },
  ];
}

function parsePartnerRanks(html, description) {
  const document = new JSDOM(html).window.document;
  const heading = [...document.querySelectorAll('h5')]
    .find((node) => /Partner Skill/i.test(compactText(node.textContent)));
  const tables = [...(heading?.parentElement?.querySelectorAll(':scope > table') ?? [])];
  const series = tables.flatMap((table) => {
    const rows = [...table.querySelectorAll('tbody tr')];
    if (rows.length !== 5) return [];
    const parsedRows = rows.map((row, rowIndex) => {
      const cells = row.querySelectorAll('td');
      const level = Number(compactText(cells[0]?.textContent)) || rowIndex + 1;
      let values = [...(cells[1]?.querySelectorAll('span') ?? [])]
        .map((span) => compactText(span.textContent))
        .filter((value) => /^-?\d+(?:\.\d+)?$/.test(value));
      if (!values.length) {
        values = [...compactText(cells[1]?.textContent).matchAll(
          /(?:^|\s)(-?\d+(?:\.\d+)?)(?=\s|$)/g,
        )].map((match) => match[1]);
      }
      return { level, values };
    });
    const width = Math.min(...parsedRows.map((row) => row.values.length));
    return Array.from({ length: width }, (_, valueIndex) => (
      parsedRows.map((row) => ({ level: row.level, value: row.values[valueIndex] }))
    ));
  });

  const ranges = [...description.matchAll(
    /(-?\d+(?:\.\d+)?)\s*~\s*(-?\d+(?:\.\d+)?)\)?\s*(%?)/g,
  )].map((range) => ({ start: range[1], end: range[2], unit: range[3] || '' }));
  if (!ranges.length) return [];

  const matchingSeries = ranges.map((range) => (
    series.find((candidate) =>
      Number(candidate[0]?.value) === Number(range.start)
      && Number(candidate[4]?.value) === Number(range.end))
  ));
  if (ranges.length && matchingSeries.every(Boolean)) {
    return Array.from({ length: 5 }, (_, rowIndex) => ({
      stars: rowIndex,
      level: rowIndex + 1,
      values: matchingSeries.map(
        (candidate, rangeIndex) => `${candidate[rowIndex].value}${ranges[rangeIndex].unit}`,
      ),
    }));
  }

  return endpointProgression(description);
}

async function fetchPartnerRankCache(partnerSkills) {
  const cache = {};
  const queue = [...partnerSkills];
  let completed = 0;
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const skill = queue.shift();
      try {
        const html = await fetchText(`${PALDB_ORIGIN}/en/${skill.palSlug}`);
        cache[skill.palSlug] = parsePartnerRanks(html, skill.description);
      } catch (error) {
        console.warn(`${skill.palName}: ${error.message}`);
        cache[skill.palSlug] = endpointProgression(skill.description);
      }
      completed += 1;
      if (completed % 25 === 0 || completed === partnerSkills.length) {
        console.log(`Partner detail pages: ${completed}/${partnerSkills.length}`);
      }
    }
  });
  await Promise.all(workers);
  await writeFile(RANK_CACHE, `${JSON.stringify(cache, null, 2)}\n`);
  return cache;
}

async function loadPartnerRankCache(partnerSkills) {
  if (SHOULD_FETCH) return fetchPartnerRankCache(partnerSkills);
  try {
    return JSON.parse(await readFile(RANK_CACHE, 'utf8'));
  } catch {
    const previous = JSON.parse(await readFile(PARTNER_OUT, 'utf8'));
    return Object.fromEntries(
      previous
        .filter((skill) => skill.palSlug && skill.rankProgression)
        .map((skill) => [skill.palSlug, skill.rankProgression]),
    );
  }
}

function categoryMap(previous) {
  return new Map(previous.flatMap((skill) => {
    const pairs = [[skill.palName.toLocaleLowerCase('en'), skill.category]];
    if (skill.palSlug) pairs.push([skill.palSlug.toLocaleLowerCase('en'), skill.category]);
    return pairs;
  }));
}

async function main() {
  const [
    activeEnHtml,
    activePtHtml,
    partnerEnHtml,
    partnerPtHtml,
    previousPartner,
  ] = await Promise.all([
    loadListPage('Active_Skills', 'en'),
    loadListPage('Active_Skills', 'pt'),
    loadListPage('Partner_Skill', 'en'),
    loadListPage('Partner_Skill', 'pt'),
    readFile(PARTNER_OUT, 'utf8').then(JSON.parse),
  ]);

  const activeSkills = mergeActiveSkills(
    parseActiveSkills(activeEnHtml),
    parseActiveSkills(activePtHtml),
  );
  if (activeSkills.length !== 315) {
    throw new Error(`Expected 315 active skills, found ${activeSkills.length}`);
  }

  const partnerEn = parsePartnerSkills(partnerEnHtml);
  const partnerPtBySlug = new Map(
    parsePartnerSkills(partnerPtHtml).map((skill) => [skill.palSlug, skill]),
  );
  if (partnerEn.length !== 299) {
    throw new Error(`Expected 299 partner skills, found ${partnerEn.length}`);
  }

  const categories = categoryMap(previousPartner);
  const rankCache = await loadPartnerRankCache(partnerEn);
  const partnerSkills = partnerEn.map((skill) => {
    const pt = partnerPtBySlug.get(skill.palSlug);
    return {
      palName: skill.palName,
      palSlug: skill.palSlug,
      skillName: skill.skillName,
      skillNames: {
        en: skill.skillName,
        'pt-BR': pt?.skillName || skill.skillName,
      },
      description: skill.description,
      descriptions: {
        en: skill.description,
        'pt-BR': pt?.description || skill.description,
      },
      category:
        categories.get(skill.palSlug.toLocaleLowerCase('en'))
        ?? categories.get(skill.palName.toLocaleLowerCase('en'))
        ?? 'utility',
      iconUrl: skill.iconUrl,
      rankProgression:
        rankCache[skill.palSlug]?.length
          ? rankCache[skill.palSlug]
          : endpointProgression(skill.description),
    };
  });

  await Promise.all([
    writeFile(ACTIVE_OUT, `${JSON.stringify(activeSkills, null, 2)}\n`),
    writeFile(PARTNER_OUT, `${JSON.stringify(partnerSkills, null, 2)}\n`),
  ]);

  const allRanks = partnerSkills.filter((skill) => skill.rankProgression.length === 5).length;
  const endpoints = partnerSkills.filter((skill) => skill.rankProgression.length >= 2).length;
  console.log(`Active skills: ${activeSkills.length}`);
  console.log(`Partner skills: ${partnerSkills.length} (${allRanks} with 0★-4★, ${endpoints} with endpoints)`);
}

await main();
