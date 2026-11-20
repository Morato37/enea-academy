/**
 * Pure helpers that decide, for one row of the image search (dropbox_images_index),
 * which plant it shows, how sure we are, and which season it belongs to.
 *
 * Signals, strongest first:
 *  1. Curated Dropbox folders: PLANTS/<CATEGORY>/<Genus>/<Genus species>/…
 *  2. The species name in the file name.
 *  3. The folder "Plants Seasonality/<English common name>/" with SPRING_/FALL_/… file names.
 *  4. An exact tag with the botanical name (AI tags, often wrong or attached to unrelated pictures).
 *  5. Pictures loose in the genus folder (only the genus is known).
 *
 * No database access here, so the rules can be tested against image_catalog.json.
 */

export type SeasonKey = 'fruehling' | 'sommer' | 'herbst' | 'winter';
export type MatchSource = 'ordner' | 'dateiname' | 'saisonordner' | 'tag' | 'gattung';

export const SEASON_KEYS: SeasonKey[] = ['fruehling', 'sommer', 'herbst', 'winter'];

/** Lowercase, ä/ö/ü → ae/oe/ue, ß → ss, accents removed, everything else non-alphanumeric → single space. */
export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/×/g, ' x ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export interface PlantName {
  /** "acer", always set */
  genus: string;
  /** "acer palmatum" or "magnolia x soulangeana"; null if the name has no epithet */
  species: string | null;
  /** Words of the species without the hybrid "x", e.g. ["magnolia", "soulangeana"] */
  speciesWords: string[];
  /** "osakazuki" for "Acer palmatum 'Osakazuki'", else null */
  cultivar: string | null;
  /** Tags that the old exact-tag search used (full name and species). */
  tagAliases: string[];
}

export function parsePlantName(botanicalName: string): PlantName {
  const cultivarMatch = botanicalName.match(/['‘’"“”]([^'‘’"“”]+)['‘’"“”]/);
  const cultivar = cultivarMatch ? normalizeName(cultivarMatch[1]) || null : null;
  const full = normalizeName(botanicalName);
  const words = normalizeName(botanicalName.replace(/['‘’"“”][^'‘’"“”]*['‘’"“”]/g, ' ')).split(' ').filter(Boolean);
  const genus = words[0] ?? full;
  let speciesWords: string[] = [];
  let species: string | null = null;
  if (words[1] === 'x' && words[2]) {
    speciesWords = [genus, words[2]];
    species = `${genus} x ${words[2]}`;
  } else if (words[1] && !['spec', 'sp', 'spp', 'species'].includes(words[1])) {
    speciesWords = [genus, words[1]];
    species = `${genus} ${words[1]}`;
  }
  const tagAliases = [...new Set([full, species ?? ''])].filter(tag => tag.length >= 6);
  return { genus, species, speciesWords, cultivar, tagAliases };
}

/** SQL ILIKE pattern that finds the species anywhere in a path (words joined by %, so "-", "_", " x " all match). */
export function speciesPathPattern(name: PlantName): string | null {
  if (!name.speciesWords.length) return null;
  return `%${name.speciesWords.map(escapeLike).join('%')}%`;
}

export function genusFolderPattern(name: PlantName): string {
  return `%/plants/%/${escapeLike(name.genus)}/%`;
}

/** PLANTS/_SEASONALITY/<Season>/<Genus>/… */
export function seasonalityGenusPattern(name: PlantName): string {
  return `%/plants/\\_seasonality/%/${escapeLike(name.genus)}/%`;
}

export function commonNameFolderPattern(commonNameEn: string): string {
  return `%/plants seasonality/${escapeLike(commonNameEn.trim().toLowerCase())}/%`;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, m => `\\${m}`);
}

const speciesRegexCache = new Map<string, RegExp>();

/** Does a normalized text contain the species as separate words ("acer palmatum", "magnolia x soulangeana")? */
function containsSpecies(normalizedText: string, name: PlantName): boolean {
  if (!name.speciesWords.length) return false;
  const [g, e] = name.speciesWords;
  const key = `${g} ${e}`;
  let regex = speciesRegexCache.get(key);
  if (!regex) {
    regex = new RegExp(`(^| )${g}( x)? ${e}( |$)`);
    speciesRegexCache.set(key, regex);
  }
  return regex.test(normalizedText);
}

export interface PathInfo {
  segments: string[];
  fileName: string;
  /** Category folder below PLANTS ("TREES", "_SEASONALITY"), null if the picture is not under PLANTS. */
  plantsCategory: string | null;
  /** Folders below the category, e.g. ["Acer", "Acer palmatum"] or ["Parrotia persica"] or ["Winter", "Ginkgo"]. */
  plantDirs: string[];
  /** Season folder in PLANTS/_SEASONALITY/<Season>/, normalized ("autumn"), else null. */
  curatedSeasonFolder: string | null;
  /** English common name folder below "Plants Seasonality". */
  seasonalityFolder: string | null;
}

export function parsePath(path: string): PathInfo {
  const segments = path.replace(/\\/g, '/').split('/').filter(Boolean);
  const fileName = segments[segments.length - 1] ?? '';
  const dirs = segments.slice(0, -1);
  const plantsIndex = dirs.findIndex(s => s.toLowerCase() === 'plants');
  const plantsCategory = plantsIndex >= 0 && plantsIndex + 1 < dirs.length ? dirs[plantsIndex + 1] : null;
  const plantDirs = plantsCategory ? dirs.slice(plantsIndex + 2) : [];
  const isSeasonality = plantsCategory?.toLowerCase() === '_seasonality';
  const seasonalityIndex = dirs.findIndex(s => s.toLowerCase() === 'plants seasonality');
  return {
    segments,
    fileName,
    plantsCategory,
    plantDirs: isSeasonality ? plantDirs.slice(1) : plantDirs,
    curatedSeasonFolder: isSeasonality && plantDirs[0] ? normalizeName(plantDirs[0]) : null,
    seasonalityFolder: seasonalityIndex >= 0 && seasonalityIndex + 1 < dirs.length ? dirs[seasonalityIndex + 1] : null,
  };
}

/** Folders like "0_Trees - unsorted" or "Hanging unsorted" say nothing about the plant. */
function isUnsortedFolder(normalizedDir: string): boolean {
  return /^\d/.test(normalizedDir) || /(^| )(unsorted|misc|diverse|various|div|sonstige)( |$)/.test(normalizedDir);
}

export interface PlantMatch {
  source: MatchSource;
  /** 0..1, how sure we are that the picture shows this plant (and is a good plant picture). */
  relevance: number;
}

/**
 * Decides whether a row belongs to the plant. Returns null if not, or if a curated folder
 * clearly says it is a different plant (the folder wins over AI tags).
 */
export function matchImageToPlant(
  path: string,
  tags: string[],
  name: PlantName,
  commonNameEn?: string | null,
): PlantMatch | null {
  const info = parsePath(path);
  const dirs = info.plantDirs.map(normalizeName).filter(dir => dir && !isUnsortedFolder(dir));
  const fileName = normalizeName(info.fileName.replace(/\.[a-z0-9]+$/i, ''));
  const inPlants = info.plantsCategory !== null;
  const cultivarBonus = name.cultivar && normalizeName(path).includes(name.cultivar) ? 0.05 : 0;

  // 1. curated plant folder: "TREES/Acer/Acer palmatum/" or "TREES/Parrotia persica/"
  if (dirs.some(dir => containsSpecies(dir, name))) {
    return { source: 'ordner', relevance: (info.curatedSeasonFolder ? 0.9 : 0.95) + cultivarBonus };
  }

  // A curated folder for a *different* plant: ignore the picture, whatever the tags say.
  // The first folder word is the genus ("Acer", "Parrotia persica" → parrotia); a deeper folder
  // starting with our genus but naming another epithet is another species.
  const folderGenus = dirs[0]?.split(' ')[0] ?? null;
  const folderSaysOtherGenus = folderGenus !== null && /^[a-z]{3,}$/.test(folderGenus) && folderGenus !== name.genus;
  const folderSaysOtherSpecies = !folderSaysOtherGenus && name.speciesWords.length > 0
    && dirs.some(dir => dir.startsWith(`${name.genus} `) && /^[a-z]+ (x )?[a-z]{3,}/.test(dir) && !containsSpecies(dir, name));

  // 2. species in the file name
  if (containsSpecies(fileName, name) && !folderSaysOtherSpecies) {
    return { source: 'dateiname', relevance: (inPlants ? 0.85 : 0.6) + cultivarBonus };
  }

  // 3a. "PLANTS/_SEASONALITY/Winter/Ginkgo/": curated season picture of the genus
  if (info.curatedSeasonFolder && folderGenus === name.genus && !folderSaysOtherSpecies) {
    return { source: 'saisonordner', relevance: 0.75 };
  }
  // 3b. "Plants Seasonality/<English common name>/"
  if (commonNameEn && info.seasonalityFolder && normalizeName(info.seasonalityFolder) === normalizeName(commonNameEn)) {
    return { source: 'saisonordner', relevance: 0.8 };
  }

  if (folderSaysOtherGenus || folderSaysOtherSpecies) return null;

  // 4. exact tag
  const tagSet = new Set(tags.map(normalizeName));
  if (name.tagAliases.some(alias => tagSet.has(alias))) {
    return { source: 'tag', relevance: (inPlants ? 0.5 : 0.3) + cultivarBonus };
  }

  // 5. loose in the genus folder, file name does not name another species
  if (dirs.length === 1 && dirs[0] === name.genus && !info.curatedSeasonFolder) {
    const other = fileName.match(new RegExp(`(^| )${name.genus} ([a-z]{3,})`));
    const otherEpithet = other?.[2];
    if (otherEpithet && otherEpithet !== name.speciesWords[1] && !/^\d/.test(otherEpithet)) return null;
    return { source: 'gattung', relevance: 0.2 };
  }
  return null;
}

// ── Seasons ─────────────────────────────────────────────────────────────────

/** Season words in folder and file names (normalized, matched as whole words). */
const PATH_SEASON_WORDS: Record<SeasonKey, RegExp> = {
  fruehling: /(^| )(fruehling|fruehjahr|vorfruehling|spring|srping|primavera)( |$)/,
  sommer: /(^| )(sommer|summer|estate)( |$)/,
  herbst: /(^| )(herbst|autumn|autum|fall|autunno)( |$)/,
  winter: /(^| )(winter|inverno)( |$)/,
};

/** Curated "@" tags from the Dropbox folder import. */
const CURATED_SEASON_TAGS: Record<string, SeasonKey> = {
  '@spring': 'fruehling', '@summer': 'sommer', '@autumn': 'herbst', '@winter': 'winter',
};

/**
 * Exact AI tags that hint at a season. "spring" and "summer" are attached to almost every green
 * picture, so they only count when nothing more specific is there.
 */
const AI_SEASON_TAGS: Record<SeasonKey, string[]> = {
  fruehling: ['spring', 'springtime', 'spring season', 'season spring', 'fruehling', 'vorfruehling', 'fruehjahr', 'spring blossoms'],
  sommer: ['summer', 'summer season', 'season summer', 'early summer', 'late summer', 'summery', 'sommer', 'sommerlich', 'summer mood'],
  herbst: ['autumn', 'fall', 'fall colors', 'fall color', 'fall foliage', 'fall season', 'autumn colors', 'autumn leaves', 'autumnal',
    'autumn season', 'autumn mood', 'early autumn', 'season autumn', 'herbst', 'herbstlich', 'herbstfarbe', 'herbstfaerbung', 'herbstlaub'],
  winter: ['winter', 'snow', 'frost', 'frosty', 'snowfall', 'snow covered', 'snowy landscape', 'blanket of snow', 'snowy', 'schnee',
    'frozen', 'hoarfrost', 'winter season', 'season winter', 'winterlich', 'winteraspekt'],
};

const AI_SEASON_LOOKUP = new Map<string, SeasonKey>(
  SEASON_KEYS.flatMap(season => AI_SEASON_TAGS[season].map(tag => [tag, season] as [string, SeasonKey])),
);

export interface SeasonInfo {
  seasons: SeasonKey[];
  /** true = from folder, file name or curated tag; false = guessed from AI tags. */
  certain: boolean;
}

function seasonsInText(text: string): SeasonKey[] {
  if (/(^| )(four|4|all) seasons?( |$)/.test(text)) return [];
  return SEASON_KEYS.filter(season => PATH_SEASON_WORDS[season].test(text));
}

/**
 * Season of a picture. Priority:
 *  1. curated folder PLANTS/_SEASONALITY/<Season>/ (wins over everything, even "FALL_…" file names in /Winter/)
 *  2. a season word at the start of the file name ("FALL_wild-geranium-late-summer.jpg" → autumn only)
 *  3. season words anywhere in folders/file name, plus curated "@autumn"-style tags
 *  4. AI tags (weak)
 */
export function detectSeasons(path: string, tags: string[]): SeasonInfo {
  const info = parsePath(path);
  const curated = info.curatedSeasonFolder ? seasonsInText(info.curatedSeasonFolder) : [];
  if (curated.length) return { seasons: curated, certain: true };

  const fileText = normalizeName(info.fileName.replace(/\.[a-z0-9]+$/i, ''));
  const leading = seasonsInText(fileText.split(' ').slice(0, 2).join(' '));
  if (leading.length === 1) return { seasons: leading, certain: true };

  const strong = new Set<SeasonKey>();
  for (const segment of info.segments) {
    for (const season of seasonsInText(normalizeName(segment.replace(/\.[a-z0-9]+$/i, '')))) strong.add(season);
  }
  for (const tag of tags) {
    const curated = CURATED_SEASON_TAGS[tag.trim().toLowerCase()];
    if (curated) strong.add(curated);
  }
  if (strong.size) return { seasons: SEASON_KEYS.filter(s => strong.has(s)), certain: true };

  const weak = new Set<SeasonKey>();
  for (const tag of tags) {
    const season = AI_SEASON_LOOKUP.get(normalizeName(tag));
    if (season) weak.add(season);
  }
  // Autumn colours and snow are specific; spring/summer next to them are filler words.
  if (weak.has('herbst') || weak.has('winter')) {
    return { seasons: SEASON_KEYS.filter(s => (s === 'herbst' || s === 'winter') && weak.has(s)), certain: false };
  }
  return { seasons: SEASON_KEYS.filter(s => weak.has(s)), certain: false };
}

/** Tags handed to the moodboard: original tags without any season words, plus the detected seasons. */
export function moodboardTags(tags: string[], seasons: SeasonInfo): string[] {
  const cleaned = tags.filter(tag => !AI_SEASON_LOOKUP.has(normalizeName(tag)) && !CURATED_SEASON_TAGS[tag.trim().toLowerCase()]);
  return [...cleaned, ...seasons.seasons];
}

/**
 * Final ranking score: plant certainty first, then how clear the season is.
 * Pictures with one certain season are the best material for the season board.
 */
export function imageRelevance(match: PlantMatch, seasons: SeasonInfo): number {
  let score = match.relevance;
  if (seasons.certain) score += 0.05;
  else if (seasons.seasons.length > 1) score -= 0.05;
  return Math.max(0, Math.min(1, score));
}
