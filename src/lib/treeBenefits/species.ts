import { SpeciesInfo } from './types';

/**
 * Biomass coefficients ln B = β₀ + β₁·ln DBH (Chojnacky, Heath & Jenkins 2014),
 * grouped by genus / family / wood specific gravity.
 */
export const CHOJ: Record<string, [number, number]> = {
  pinusL: [-2.6177, 2.4638], pinusH: [-3.0506, 2.6465], abiesH: [-3.1774, 2.6426], cupM: [-2.7765, 2.4195], cupH: [-2.6327, 2.4757],
  larix: [-2.3012, 2.3853], piceaH: [-2.1364, 2.3233], pseudo: [-2.4623, 2.4852],
  acerH: [-1.8011, 2.3852], betM: [-2.2271, 2.4513], betH: [-1.8096, 2.3480], misc: [-2.2118, 2.4133], fab: [-2.5095, 2.5437],
  fagD: [-2.0705, 2.4410], fagE: [-2.2198, 2.4410], hamam: [-2.6390, 2.5466], hippo: [-2.4108, 2.4177], magn: [-2.5497, 2.5011],
  oleaH: [-1.8384, 2.3524], salL: [-2.6863, 2.4561],
  carya: [-2.5095, 2.6175], betL: [-2.5932, 2.5349], tsugaL: [-2.3480, 2.3876],
};

/** Species / genus table: S shading factor (Nowak 1996), ev evergreen, grp biomass group. */
export const SPECIES: Record<string, SpeciesInfo> = {
  'pinus sylvestris': { S: 0.86, ev: 1, grp: 'pinusL' }, 'pinus nigra': { S: 0.91, ev: 1, grp: 'pinusH' }, 'pinus': { S: 0.88, ev: 1, grp: 'pinusL' },
  'picea': { S: 0.90, ev: 1, grp: 'piceaH' }, 'abies': { S: 0.90, ev: 1, grp: 'abiesH' }, 'larix': { S: 0.86, ev: 0, grp: 'larix' },
  'cupressus': { S: 0.90, ev: 1, grp: 'cupH' }, 'thuja': { S: 0.90, ev: 1, grp: 'cupM' }, 'taxus': { S: 0.92, ev: 1, grp: 'cupH' }, 'pseudotsuga': { S: 0.89, ev: 1, grp: 'pseudo' },
  'acer palmatum': { S: 0.85, ev: 0, grp: 'acerH' }, 'acer platanoides': { S: 0.88, ev: 0, grp: 'acerH' }, 'acer campestre': { S: 0.86, ev: 0, grp: 'acerH' },
  'acer pseudoplatanus': { S: 0.88, ev: 0, grp: 'acerH' }, 'acer': { S: 0.87, ev: 0, grp: 'acerH' },
  'aesculus': { S: 0.86, ev: 0, grp: 'hippo' }, 'tilia': { S: 0.89, ev: 0, grp: 'hippo' },
  'carpinus': { S: 0.85, ev: 0, grp: 'betH' }, 'betula': { S: 0.79, ev: 0, grp: 'betM' }, 'corylus': { S: 0.88, ev: 0, grp: 'betM' },
  'ostrya': { S: 0.85, ev: 0, grp: 'betH' }, 'alnus': { S: 0.84, ev: 0, grp: 'betM' },
  'celtis': { S: 0.86, ev: 0, grp: 'misc' }, 'ulmus': { S: 0.85, ev: 0, grp: 'misc' }, 'platanus': { S: 0.89, ev: 0, grp: 'misc' }, 'prunus': { S: 0.85, ev: 0, grp: 'misc' },
  'pyrus': { S: 0.88, ev: 0, grp: 'misc' }, 'malus': { S: 0.87, ev: 0, grp: 'misc' }, 'sorbus': { S: 0.84, ev: 0, grp: 'misc' }, 'crataegus': { S: 0.86, ev: 0, grp: 'misc' },
  'arbutus': { S: 0.87, ev: 1, grp: 'misc' }, 'laurus': { S: 0.90, ev: 1, grp: 'misc' }, 'cinnamomum': { S: 0.90, ev: 1, grp: 'misc' }, 'morus': { S: 0.85, ev: 0, grp: 'misc' }, 'ficus': { S: 0.88, ev: 0, grp: 'misc' },
  'quercus ilex': { S: 0.88, ev: 1, grp: 'fagE' }, 'quercus suber': { S: 0.86, ev: 1, grp: 'fagE' }, 'quercus': { S: 0.86, ev: 0, grp: 'fagD' }, 'fagus': { S: 0.88, ev: 0, grp: 'fagD' }, 'castanea': { S: 0.86, ev: 0, grp: 'fagD' },
  'fraxinus': { S: 0.83, ev: 0, grp: 'oleaH' }, 'olea': { S: 0.84, ev: 1, grp: 'oleaH' }, 'ligustrum': { S: 0.88, ev: 1, grp: 'oleaH' },
  'populus': { S: 0.84, ev: 0, grp: 'salL' }, 'salix': { S: 0.84, ev: 0, grp: 'salL' },
  'robinia': { S: 0.82, ev: 0, grp: 'fab' }, 'gleditsia': { S: 0.80, ev: 0, grp: 'fab' }, 'cercis': { S: 0.85, ev: 0, grp: 'fab' }, 'ceratonia': { S: 0.88, ev: 1, grp: 'fab' },
  'sophora': { S: 0.82, ev: 0, grp: 'fab' }, 'styphnolobium': { S: 0.82, ev: 0, grp: 'fab' }, 'jacaranda': { S: 0.80, ev: 0, grp: 'fab' }, 'tipuana': { S: 0.83, ev: 0, grp: 'fab' }, 'juglans': { S: 0.82, ev: 0, grp: 'fab' },
  'liquidambar': { S: 0.86, ev: 0, grp: 'hamam' }, 'parrotia': { S: 0.86, ev: 0, grp: 'hamam' }, 'magnolia': { S: 0.88, ev: 0, grp: 'magn' }, 'liriodendron': { S: 0.86, ev: 0, grp: 'magn' },
  'amelanchier': { S: 0.84, ev: 0, grp: 'misc' }, 'cornus': { S: 0.86, ev: 0, grp: 'misc' }, 'zelkova': { S: 0.86, ev: 0, grp: 'misc' }, 'cedrus': { S: 0.88, ev: 1, grp: 'pinusH' },
  'sequoiadendron': { S: 0.90, ev: 1, grp: 'cupH' }, 'metasequoia': { S: 0.85, ev: 0, grp: 'cupM' }, 'ilex': { S: 0.90, ev: 1, grp: 'misc' }, 'photinia': { S: 0.88, ev: 1, grp: 'misc' },
  'lagerstroemia': { S: 0.84, ev: 0, grp: 'misc' }, 'albizia': { S: 0.78, ev: 0, grp: 'fab' },
  'paulownia': { S: 0.85, ev: 0, grp: 'misc' }, 'melia': { S: 0.83, ev: 0, grp: 'misc' }, 'tamarix': { S: 0.75, ev: 0, grp: 'misc' }, 'citrus': { S: 0.90, ev: 1, grp: 'misc' },
  'chorisia': { S: 0.80, ev: 0, grp: 'misc' }, 'ginkgo': { S: 0.83, ev: 0, grp: 'misc' },
  'ailanthus': { S: 0.82, ev: 0, grp: 'misc' }, 'catalpa': { S: 0.84, ev: 0, grp: 'misc' }, 'koelreuteria': { S: 0.83, ev: 0, grp: 'misc' },
};

// species-level entries (shading factor S after Nowak 1996 / i-Tree species table, rounded)
Object.assign(SPECIES, {
  'aesculus x carnea': { S: 0.86, ev: 0, grp: 'hippo' }, 'aesculus hippocastanum': { S: 0.87, ev: 0, grp: 'hippo' }, 'arbutus unedo': { S: 0.87, ev: 1, grp: 'misc' }, 'carpinus betulus': { S: 0.85, ev: 0, grp: 'betH' },
  'celtis australis': { S: 0.86, ev: 0, grp: 'misc' }, 'ceratonia siliqua': { S: 0.88, ev: 1, grp: 'fab' }, 'cercis siliquastrum': { S: 0.85, ev: 0, grp: 'fab' }, 'chorisia speciosa': { S: 0.80, ev: 0, grp: 'misc' },
  'cinnamomum camphora': { S: 0.90, ev: 1, grp: 'misc' }, 'citrus nobilis': { S: 0.90, ev: 1, grp: 'misc' }, 'corylus avellana': { S: 0.88, ev: 0, grp: 'betM' }, 'cupressus sempervirens': { S: 0.90, ev: 1, grp: 'cupH' },
  'fraxinus ornus': { S: 0.83, ev: 0, grp: 'oleaH' }, 'fraxinus oxycarpa': { S: 0.83, ev: 0, grp: 'oleaH' }, 'fraxinus excelsior': { S: 0.83, ev: 0, grp: 'oleaH' }, 'jacaranda mimosifolia': { S: 0.80, ev: 0, grp: 'fab' },
  'laurus nobilis': { S: 0.90, ev: 1, grp: 'misc' }, 'melia azedarach': { S: 0.83, ev: 0, grp: 'misc' }, 'morus alba': { S: 0.85, ev: 0, grp: 'misc' }, 'olea europaea': { S: 0.84, ev: 1, grp: 'oleaH' },
  'ostrya carpinifolia': { S: 0.85, ev: 0, grp: 'betH' }, 'platanus x acerifolia': { S: 0.89, ev: 0, grp: 'misc' }, 'platanus x hispanica': { S: 0.89, ev: 0, grp: 'misc' }, 'populus alba': { S: 0.84, ev: 0, grp: 'salL' },
  'populus canescens': { S: 0.84, ev: 0, grp: 'salL' }, 'populus nigra': { S: 0.83, ev: 0, grp: 'salL' }, 'prunus avium': { S: 0.85, ev: 0, grp: 'misc' }, 'prunus serrulata': { S: 0.86, ev: 0, grp: 'misc' },
  'paulownia tomentosa': { S: 0.85, ev: 0, grp: 'misc' }, 'pyrus communis': { S: 0.88, ev: 0, grp: 'misc' }, 'pyrus calleryana': { S: 0.88, ev: 0, grp: 'misc' }, 'quercus cerris': { S: 0.86, ev: 0, grp: 'fagD' },
  'quercus frainetto': { S: 0.86, ev: 0, grp: 'fagD' }, 'quercus petraea': { S: 0.86, ev: 0, grp: 'fagD' }, 'quercus pubescens': { S: 0.85, ev: 0, grp: 'fagD' }, 'quercus robur': { S: 0.86, ev: 0, grp: 'fagD' },
  'salix alba': { S: 0.84, ev: 0, grp: 'salL' }, 'salix fragilis': { S: 0.84, ev: 0, grp: 'salL' }, 'tamarix ramosissima': { S: 0.75, ev: 0, grp: 'misc' }, 'tilia cordata': { S: 0.89, ev: 0, grp: 'hippo' },
  'tilia tomentosa': { S: 0.89, ev: 0, grp: 'hippo' }, 'tilia platyphyllos': { S: 0.89, ev: 0, grp: 'hippo' }, 'tipuana tipu': { S: 0.83, ev: 0, grp: 'fab' }, 'ulmus minor': { S: 0.85, ev: 0, grp: 'misc' },
  'parrotia persica': { S: 0.86, ev: 0, grp: 'hamam' }, 'fagus sylvatica': { S: 0.88, ev: 0, grp: 'fagD' }, 'betula pendula': { S: 0.79, ev: 0, grp: 'betM' }, 'pinus pinea': { S: 0.88, ev: 1, grp: 'pinusH' },
  'robinia pseudoacacia': { S: 0.82, ev: 0, grp: 'fab' }, 'gleditsia triacanthos': { S: 0.80, ev: 0, grp: 'fab' }, 'liquidambar styraciflua': { S: 0.86, ev: 0, grp: 'hamam' }, 'ginkgo biloba': { S: 0.83, ev: 0, grp: 'misc' },
  'sorbus aucuparia': { S: 0.84, ev: 0, grp: 'misc' }, 'malus domestica': { S: 0.87, ev: 0, grp: 'misc' }, 'picea abies': { S: 0.90, ev: 1, grp: 'piceaH' },
  'abies alba': { S: 0.90, ev: 1, grp: 'abiesH' }, 'larix decidua': { S: 0.86, ev: 0, grp: 'larix' }, 'juglans regia': { S: 0.82, ev: 0, grp: 'fab' }, 'castanea sativa': { S: 0.86, ev: 0, grp: 'fagD' },
} satisfies Record<string, SpeciesInfo>);

// additional genera (Enea plant database); palm = height-based biomass
Object.assign(SPECIES, {
  'alnus': { S: 0.84, ev: 0, grp: 'betL' }, 'carya': { S: 0.84, ev: 0, grp: 'carya' }, 'syringa': { S: 0.85, ev: 0, grp: 'oleaH' }, 'elaeagnus': { S: 0.80, ev: 0, grp: 'misc' }, 'tsuga': { S: 0.90, ev: 1, grp: 'tsugaL' },
  'hippophae': { S: 0.78, ev: 0, grp: 'misc' }, 'cercidiphyllum': { S: 0.85, ev: 0, grp: 'misc' }, 'zanthoxylum': { S: 0.80, ev: 0, grp: 'misc' }, 'hamamelis': { S: 0.85, ev: 0, grp: 'hamam' }, 'juniperus': { S: 0.90, ev: 1, grp: 'cupM' },
  'punica': { S: 0.82, ev: 0, grp: 'misc' }, 'gymnocladus': { S: 0.78, ev: 0, grp: 'fab' }, 'nyssa': { S: 0.86, ev: 0, grp: 'misc' }, 'vitex': { S: 0.80, ev: 0, grp: 'misc' }, 'arctostaphylos': { S: 0.85, ev: 1, grp: 'misc' },
  'taxodium': { S: 0.82, ev: 0, grp: 'cupM' }, 'mespilus': { S: 0.85, ev: 0, grp: 'misc' }, 'chamaecyparis': { S: 0.90, ev: 1, grp: 'cupM' }, 'diospyros': { S: 0.86, ev: 0, grp: 'misc' }, 'eriobotrya': { S: 0.90, ev: 1, grp: 'misc' },
  'cydonia': { S: 0.86, ev: 0, grp: 'misc' }, 'eucalyptus': { S: 0.80, ev: 1, grp: 'misc' }, 'nothofagus': { S: 0.84, ev: 0, grp: 'fagD' }, 'heptacodium': { S: 0.84, ev: 0, grp: 'misc' },
  'magnolia grandiflora': { S: 0.90, ev: 1, grp: 'magn' }, 'quercus phellos': { S: 0.85, ev: 0, grp: 'fagD' }, 'quercus rubra': { S: 0.86, ev: 0, grp: 'fagD' }, 'quercus palustris': { S: 0.86, ev: 0, grp: 'fagD' }, 'quercus alba': { S: 0.86, ev: 0, grp: 'fagD' },
  'pinus mugo': { S: 0.90, ev: 1, grp: 'pinusH' }, 'pinus cembra': { S: 0.90, ev: 1, grp: 'pinusL' }, 'pinus strobus': { S: 0.86, ev: 1, grp: 'pinusL' }, 'pinus thunbergii': { S: 0.90, ev: 1, grp: 'pinusH' }, 'pinus heldreichii': { S: 0.90, ev: 1, grp: 'pinusH' },
  'prunus laurocerasus': { S: 0.90, ev: 1, grp: 'misc' }, 'prunus lusitanica': { S: 0.90, ev: 1, grp: 'misc' }, 'ilex aquifolium': { S: 0.90, ev: 1, grp: 'misc' }, 'ficus carica': { S: 0.86, ev: 0, grp: 'misc' },
  // palms and palm-like plants: biomass from height (Frangi & Lugo 1985), no DBH allometry
  'chamaerops': { S: 0.70, ev: 1, grp: 'misc', palm: 1 }, 'brahea': { S: 0.70, ev: 1, grp: 'misc', palm: 1 }, 'butia': { S: 0.70, ev: 1, grp: 'misc', palm: 1 }, 'phoenix': { S: 0.72, ev: 1, grp: 'misc', palm: 1 }, 'dypsis': { S: 0.70, ev: 1, grp: 'misc', palm: 1 },
  'trachycarpus': { S: 0.70, ev: 1, grp: 'misc', palm: 1 }, 'washingtonia': { S: 0.70, ev: 1, grp: 'misc', palm: 1 }, 'jubaea': { S: 0.72, ev: 1, grp: 'misc', palm: 1 },
  'cycas': { S: 0.70, ev: 1, grp: 'misc', palm: 1 }, 'yucca': { S: 0.65, ev: 1, grp: 'misc', palm: 1 }, 'strelitzia': { S: 0.75, ev: 1, grp: 'misc', palm: 1 }, 'dicksonia': { S: 0.80, ev: 1, grp: 'misc', palm: 1 }, 'musa': { S: 0.75, ev: 0, grp: 'misc', palm: 1 },
} satisfies Record<string, SpeciesInfo>);

/** Maximum tree height (m) for growth damping, by genus / species. */
const HMAX: Record<string, number> = {
  pinus: 30, picea: 35, abies: 35, larix: 30, cupressus: 25, thuja: 15, taxus: 15, pseudotsuga: 40, 'acer palmatum': 8, acer: 25, aesculus: 25, tilia: 30, carpinus: 20, betula: 22, corylus: 8,
  ostrya: 18, celtis: 22, ulmus: 28, platanus: 32, prunus: 15, pyrus: 15, malus: 10, sorbus: 12, crataegus: 8, arbutus: 8, laurus: 12, cinnamomum: 20, morus: 12, ficus: 15, quercus: 30, fagus: 35,
  castanea: 28, fraxinus: 30, olea: 12, ligustrum: 8, populus: 30, salix: 22, robinia: 22, gleditsia: 22, cercis: 10, ceratonia: 12, sophora: 20, styphnolobium: 20, jacaranda: 15, tipuana: 20,
  juglans: 25, liquidambar: 25, parrotia: 10, magnolia: 15, liriodendron: 30, paulownia: 18, melia: 15, tamarix: 6, citrus: 6, chorisia: 18, ginkgo: 28, ailanthus: 20, catalpa: 15, koelreuteria: 12,
  amelanchier: 8, cornus: 8, zelkova: 25, cedrus: 30, sequoiadendron: 50, metasequoia: 35, ilex: 12, photinia: 6, lagerstroemia: 7, albizia: 10,
};

const HMAX_EXTRA: Record<string, number> = {
  alnus: 25, carya: 25, syringa: 8, elaeagnus: 8, tsuga: 30, hippophae: 6, cercidiphyllum: 20, zanthoxylum: 6, hamamelis: 5, juniperus: 15, punica: 5, gymnocladus: 20, nyssa: 20, vitex: 5, arctostaphylos: 3,
  taxodium: 35, mespilus: 5, chamaecyparis: 20, diospyros: 10, eriobotrya: 8, cydonia: 6, eucalyptus: 40, nothofagus: 15, heptacodium: 6, chamaerops: 4, brahea: 12, butia: 6, phoenix: 18, dypsis: 8,
  trachycarpus: 10, washingtonia: 20, jubaea: 20, cycas: 3, yucca: 4, strelitzia: 8, dicksonia: 5, musa: 5, 'pinus mugo': 5, 'pinus cembra': 20, 'prunus laurocerasus': 6, 'acer griseum': 10,
  'acer shirasawanum': 8, 'acer japonicum': 8, 'acer buergerianum': 12, 'acer ginnala': 8, 'acer tataricum': 8, 'magnolia stellata': 4, 'magnolia liliiflora': 4, 'malus toringo': 5, 'prunus persica': 6,
  'prunus dulcis': 8, 'prunus armeniaca': 6, 'prunus domestica': 8, 'citrus': 6, 'ulmus minor': 25,
};

const HMAX_ALL: Record<string, number> = { ...HMAX, ...HMAX_EXTRA };

export const DEF_HARD: SpeciesInfo = { S: 0.85, ev: 0, grp: 'misc', dflt: 1 };

/** Normalise a botanical name: drop cultivar quotes, rank markers, vernacular tails. */
export function normName(name: string): { g: string; spKey: string; alt: string | null } {
  const n = (name || '').toLowerCase().replace(/['‘’"][^'‘’"]*['‘’"]?/g, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  const toks = n.split(' ').filter(t => t && !/^(l\.|ssp\.?|subsp\.?|var\.?|f\.|cv\.?|espalier|bonsai|-bonsai|hochstamm|halbstamm)$/.test(t));
  const g = toks[0] || '';
  const hyb = toks[1] === 'x' || toks[1] === '×';
  const spKey = hyb ? toks.slice(0, 3).join(' ') : toks.slice(0, 2).join(' ');
  return { g, spKey, alt: hyb ? toks.slice(0, 2).join(' ') : null };
}

export function lookupSpecies(name: string): SpeciesInfo {
  const { g, spKey } = normName(name);
  if (SPECIES[spKey]) return { ...SPECIES[spKey] };
  if (SPECIES[g]) return { ...SPECIES[g], genus: 1 };
  return { ...DEF_HARD };
}

export function hmaxOf(name: string): number {
  const { g, spKey, alt } = normName(name);
  return HMAX_ALL[spKey] || (alt && HMAX_ALL[alt]) || HMAX_ALL[g] || 20;
}
