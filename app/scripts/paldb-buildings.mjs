const PALDB_ORIGIN = 'https://paldb.cc';

export const BUILDING_CATEGORIES = [
  'Production', 'Pal', 'Storage', 'Food', 'Infrastructure',
  'Lighting', 'Foundations', 'Defenses', 'Furniture', 'Other',
];

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

export function parsePaldbVersion(html) {
  const match = html.match(/<a href="version">(v[^<]+)<\/a>\s*([\d/]+)/i);
  if (!match) throw new Error('Could not find the PalDB version footer');
  return { version: textContent(match[1]), date: match[2] };
}

export function parseBuildingCategory(html, { category, locale }) {
  const marker = '<div class="col"><div class="card itemPopup">';
  const buildings = [];
  for (const chunk of html.split(marker).slice(1)) {
    const heading = chunk.match(
      /<a class="itemname" data-hover="\?s=MapObjects%2F([^"&]+)" href="([^"]+)">([\s\S]*?)<\/a>/i,
    );
    if (!heading) continue;
    const sourceId = decodeSourceId(heading[1]);
    const iconMatch = chunk.match(/<div class="hover_icon_bg[\s\S]*?<img[^>]*src="([^"]+)"/i);
    const technologyMatch = chunk.match(
      /data-hover="\?s=Technology%2F[^"]+"[^>]*>[\s\S]*?<\/span><\/span><span class="border p-1">\s*(\d+)\s*<\/span>/i,
    );
    const recipesStart = chunk.indexOf('<div class="recipes">');
    const recipesHtml = recipesStart >= 0 ? chunk.slice(recipesStart) : '';
    // PalDB uses either a direct Items hover key or a generated cache URL.
    // The locale-independent href is present in both variants.
    const ingredientPattern = /<a class="itemname"[^>]*href="([^"/]+)"[^>]*>([\s\S]*?)<\/a><\/div>\s*<div>\s*([\d,]+)\s*<\/div>/gi;
    const ingredients = [];
    let ingredientMatch;
    while ((ingredientMatch = ingredientPattern.exec(recipesHtml))) {
      const imageMatch = ingredientMatch[2].match(/src="([^"]+)"/i);
      ingredients.push({
        sourceId: decodeSourceId(ingredientMatch[1]),
        name: textContent(ingredientMatch[2]),
        quantity: Number(ingredientMatch[3].replaceAll(',', '')),
        iconUrl: imageMatch?.[1],
      });
    }
    buildings.push({
      sourceId,
      pageSlug: decodeHtml(heading[2]),
      name: textContent(heading[3]),
      iconUrl: iconMatch?.[1],
      technologyLevel: technologyMatch ? Number(technologyMatch[1]) : undefined,
      ingredients,
      category,
      locale,
    });
  }
  return buildings;
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'find-my-pal crafting catalog updater/1.0' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastError?.message ?? String(lastError)}`);
}

async function mapWithConcurrency(values, concurrency, callback) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await callback(values[index]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

export async function fetchPaldbBuildings({ log = console.log } = {}) {
  const requests = BUILDING_CATEGORIES.flatMap((category) => ['en', 'pt'].map((locale) => ({ category, locale })));
  const pages = await mapWithConcurrency(requests, 3, async ({ category, locale }) => {
    const url = `${PALDB_ORIGIN}/${locale}/${category}`;
    log(`Fetching ${url}`);
    const html = await fetchText(url);
    return { category, locale, url, html, buildings: parseBuildingCategory(html, { category, locale }) };
  });
  const englishPages = pages.filter((page) => page.locale === 'en');
  const portuguesePages = pages.filter((page) => page.locale === 'pt');
  const english = englishPages.flatMap((page) => page.buildings);
  const portuguese = portuguesePages.flatMap((page) => page.buildings);
  const englishIds = new Set(english.map((building) => building.sourceId));
  const portugueseIds = new Set(portuguese.map((building) => building.sourceId));
  if (englishIds.size !== english.length) throw new Error('PalDB returned duplicate English building IDs');
  if (portugueseIds.size !== portuguese.length) throw new Error('PalDB returned duplicate Portuguese building IDs');
  const missingPortugueseIds = [...englishIds].filter((id) => !portugueseIds.has(id));
  const extraPortugueseIds = [...portugueseIds].filter((id) => !englishIds.has(id));
  if (missingPortugueseIds.length || extraPortugueseIds.length) {
    log(`Portuguese coverage: ${englishIds.size - missingPortugueseIds.length}/${englishIds.size}`);
    if (missingPortugueseIds.length) log(`Missing PT IDs: ${missingPortugueseIds.join(', ')}`);
    if (extraPortugueseIds.length) log(`Extra PT IDs ignored: ${extraPortugueseIds.join(', ')}`);
  }
  return {
    version: parsePaldbVersion(englishPages[0].html),
    english,
    portuguese: portuguese.filter((building) => englishIds.has(building.sourceId)),
    pages,
    missingPortugueseIds,
  };
}

function normalizedName(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function snakeCase(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '').toLowerCase();
}

function isoDate(value) {
  const [year, month, day] = value.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function findExistingEntity(entities, sourceId, englishName, kind) {
  const candidates = entities.filter((entity) => !kind || entity.kind === kind);
  return candidates.find((entity) => entity.sourceId === sourceId)
    ?? candidates.find((entity) => entity.id === sourceId)
    ?? candidates.find((entity) => entity.iconName === sourceId)
    ?? candidates.find((entity) => normalizedName(entity.names.en) === normalizedName(englishName));
}

export function mergeBuildingsIntoCatalog(catalog, fetched, now = new Date()) {
  const oldStructures = catalog.entities.filter((entity) => entity.kind === 'structure');
  const oldStructureIds = new Set(oldStructures.map((entity) => entity.id));
  const oldStructureRecipeByOutput = new Map(catalog.recipes
    .filter((recipe) => oldStructureIds.has(recipe.output.entityId)).map((recipe) => [recipe.output.entityId, recipe]));
  const portugueseById = new Map(fetched.portuguese.map((building) => [building.sourceId, building]));
  const canonicalBuildingIdBySource = new Map();
  const buildingEntities = [];
  for (const building of fetched.english) {
    if (!building.ingredients.length) throw new Error(`Building ${building.sourceId} has no construction recipe`);
    const existing = findExistingEntity(oldStructures, building.sourceId, building.name, 'structure');
    const id = existing?.id ?? building.sourceId;
    const portuguese = portugueseById.get(building.sourceId);
    canonicalBuildingIdBySource.set(building.sourceId, id);
    buildingEntities.push({
      id, sourceId: building.sourceId, kind: 'structure',
      names: { en: building.name, ...(portuguese?.name ? { 'pt-BR': portuguese.name } : {}) },
      iconName: building.sourceId, ...(building.iconUrl ? { iconUrl: building.iconUrl } : {}), selectable: true,
    });
  }

  const mergedNonStructureEntities = catalog.entities.filter((entity) => entity.kind !== 'structure').map((entity) => ({ ...entity }));
  const ingredientDetails = new Map();
  for (const building of fetched.english) {
    const portugueseIngredients = new Map((portugueseById.get(building.sourceId)?.ingredients ?? [])
      .map((ingredient) => [ingredient.sourceId, ingredient]));
    for (const ingredient of building.ingredients) {
      const current = ingredientDetails.get(ingredient.sourceId) ?? ingredient;
      ingredientDetails.set(ingredient.sourceId, { ...current, ptName: portugueseIngredients.get(ingredient.sourceId)?.name ?? current.ptName });
    }
  }
  const canonicalIngredientIdBySource = new Map();
  for (const ingredient of ingredientDetails.values()) {
    const existing = findExistingEntity(mergedNonStructureEntities, ingredient.sourceId, ingredient.name);
    if (existing) {
      canonicalIngredientIdBySource.set(ingredient.sourceId, existing.id);
      Object.assign(existing, { sourceId: ingredient.sourceId,
        ...(existing.iconName ? {} : { iconName: ingredient.sourceId }), ...(ingredient.iconUrl ? { iconUrl: ingredient.iconUrl } : {}) });
    } else {
      canonicalIngredientIdBySource.set(ingredient.sourceId, ingredient.sourceId);
      mergedNonStructureEntities.push({
        id: ingredient.sourceId, sourceId: ingredient.sourceId, kind: 'material',
        names: { en: ingredient.name, ...(ingredient.ptName ? { 'pt-BR': ingredient.ptName } : {}) },
        iconName: ingredient.sourceId, ...(ingredient.iconUrl ? { iconUrl: ingredient.iconUrl } : {}), selectable: false,
      });
    }
  }

  const canonicalBuildingIdByName = new Map(buildingEntities.map((entity) => [normalizedName(entity.names.en), entity.id]));
  const oldStationIdMap = new Map(oldStructures.map((entity) => [entity.id, canonicalBuildingIdByName.get(normalizedName(entity.names.en))]));
  const materialRecipes = catalog.recipes.filter((recipe) => !oldStructureIds.has(recipe.output.entityId)).map((recipe) => ({
    ...recipe, stationIds: recipe.stationIds.map((id) => oldStationIdMap.get(id) ?? id),
  }));
  const buildingRecipes = fetched.english.map((building) => {
    const outputId = canonicalBuildingIdBySource.get(building.sourceId);
    const previous = oldStructureRecipeByOutput.get(outputId);
    return {
      id: previous?.id ?? `building_${snakeCase(building.sourceId)}`,
      output: { entityId: outputId, quantity: 1 },
      ingredients: building.ingredients.map((ingredient) => ({
        entityId: canonicalIngredientIdBySource.get(ingredient.sourceId), quantity: ingredient.quantity,
      })),
      stationIds: [], ...(building.technologyLevel ? { technologyLevel: building.technologyLevel } : {}),
      sourceUrl: `${PALDB_ORIGIN}/en/${building.pageSlug}`, isDefault: true,
    };
  });
  const retrievedAt = now.toISOString().slice(0, 10);
  const buildingSources = fetched.pages.map((page) => ({
    name: `PalDB ${page.locale.toUpperCase()} ${page.category} buildings`, url: page.url, retrievedAt,
  }));
  const retainedSources = catalog.sources.filter((source) => !/^PalDB (?:EN|PT) .* buildings$/.test(source.name));
  return {
    ...catalog,
    gameVersion: `PalDB ${fetched.version.version} (${isoDate(fetched.version.date)})`,
    generatedAt: now.toISOString(), sources: [...retainedSources, ...buildingSources],
    entities: [...mergedNonStructureEntities, ...buildingEntities], recipes: [...materialRecipes, ...buildingRecipes],
  };
}
