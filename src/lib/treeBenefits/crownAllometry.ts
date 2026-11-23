import { UTD_SPECIES, UtdComponent, UtdEquation } from './urbanTreeDb';

/**
 * Species-specific tree dimensions from DBH, after the USDA Urban Tree Database
 * (McPherson, van Doorn & Peper 2016). Used when crown width or crown base were not measured.
 *
 * Lookup order: species → close European relative (PROXIES) → mean of the genus.
 * Within a species, the prediction is the mean over the temperate US regions that have data.
 * Checked against the 4'885 measured trees of these regions in the database: median
 * predicted/measured = 1.00 (height), 0.99 (crown diameter), 1.00 (crown height), 1.08 (leaf area).
 */

export type UtdMatch = 'species' | 'proxy' | 'genus';

export interface UtdAllometry {
  match: UtdMatch;
  /** Database entries used, e.g. ['acer platanoides']. */
  basis: string[];
  /** Tree height m, crown diameter m, crown height m, leaf area m² for a DBH in cm. */
  predict: (component: UtdComponent, dbh: number) => number;
}

/** European species without own data → closest species in the database (same growth habit). */
const PROXIES: Record<string, string> = {
  'acer pseudoplatanus': 'acer platanoides',
  'tilia platyphyllos': 'tilia cordata',
  'tilia x europaea': 'tilia cordata',
  'tilia europaea': 'tilia cordata',
  'tilia x intermedia': 'tilia cordata',
  'platanus x hispanica': 'platanus x acerifolia',
  'platanus hispanica': 'platanus x acerifolia',
  'platanus acerifolia': 'platanus x acerifolia',
  'aesculus x carnea': 'aesculus hippocastanum',
  'pinus mugo': 'pinus sylvestris',
};

function evaluate(eq: UtdEquation, dbh: number): number {
  const [, name, a, b, c, d, e, min, max] = eq;
  const x = Math.max(0.1, dbh);
  const mse = c; // loglog/exp models: column c is the mean squared error
  const ll = Math.log(Math.log(x + 1));
  let y: number;
  switch (name) {
    case 'lin': y = a + b * x; break;
    case 'quad': y = a + b * x + c * x * x; break;
    case 'cub': y = a + b * x + c * x * x + d * x ** 3; break;
    case 'quart': y = a + b * x + c * x * x + d * x ** 3 + e * x ** 4; break;
    case 'loglogw1': y = Math.exp(a + b * ll + mse / 2); break;
    case 'loglogw2': y = Math.exp(a + b * ll + Math.sqrt(x) * mse / 2); break;
    case 'loglogw3': y = Math.exp(a + b * ll + x * mse / 2); break;
    case 'loglogw4': y = Math.exp(a + b * ll + x * x * mse / 2); break;
    case 'expow1': y = Math.exp(a + b * x + mse / 2); break;
    case 'expow2': y = Math.exp(a + b * x + Math.sqrt(x) * mse / 2); break;
    case 'expow3': y = Math.exp(a + b * x + x * mse / 2); break;
    case 'expow4': y = Math.exp(a + b * x + x * x * mse / 2); break;
    default: return NaN;
  }
  // appsMin/appsMax bound the predicted value (dataset metadata)
  return Math.min(max, Math.max(min, y));
}

const mean = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length;

function speciesPredict(key: string, component: UtdComponent, dbh: number): number {
  return mean(UTD_SPECIES[key][component].map(eq => evaluate(eq, dbh)));
}

/** Lower-case botanical name without cultivar, author and hybrid sign variants. */
export function normalizeBotanical(name: string): string {
  return name
    .toLowerCase()
    .replace(/['‘’"“”][^'‘’"“”]*['‘’"“”]/g, ' ')  // cultivar
    .replace(/×/g, 'x')
    .replace(/\s+/g, ' ')
    .trim();
}

const isCultivarEntry = (key: string) => key.includes("'");

export function utdAllometry(botanicalName: string): UtdAllometry | null {
  const norm = normalizeBotanical(botanicalName);
  const words = norm.split(' ');
  const species = words[1] === 'x' ? words.slice(0, 3).join(' ') : words.slice(0, 2).join(' ');
  const build = (match: UtdMatch, basis: string[]): UtdAllometry => ({
    match,
    basis,
    predict: (component, dbh) => mean(basis.map(key => speciesPredict(key, component, dbh))),
  });

  if (UTD_SPECIES[species]) return build('species', [species]);
  const proxy = PROXIES[species];
  if (proxy && UTD_SPECIES[proxy]) return build('proxy', [proxy]);
  const genus = Object.keys(UTD_SPECIES).filter(key => key.split(' ')[0] === words[0] && !isCultivarEntry(key));
  return genus.length ? build('genus', genus) : null;
}
