/** Moodboard export: shared types. All lengths are millimetres on an A4 landscape page (297 × 210). */

export type MoodboardType = 'saison' | 'pflanzenauswahl' | 'portrait';

/** Plant groups used by the "Pflanzenauswahl" board (one column each). */
export type PlantGroup = 'baeume' | 'straeucher' | 'graeser_stauden' | 'kletter_boden';

export interface MoodboardPlant {
  id: string | number;
  botanicalName: string;
  commonName?: string | null;
  /** Column on the "Pflanzenauswahl" board. null = plant cannot be placed there. */
  group?: PlantGroup | null;
}

/** One picture from the image search (same Supabase database as the Academy). */
export interface MoodboardImage {
  id: string;
  /** Public URL that can be loaded by the browser (CORS must allow it for the PDF export). */
  url: string;
  /** Plant this picture belongs to. */
  plantId: string | number;
  /** Tags from the image search, e.g. ["Herbst", "Blüte", "Habitus"]. */
  tags: string[];
  /** Pixel size if known; used to put portrait pictures into tall slots. */
  width?: number | null;
  height?: number | null;
  /** 0..1, how sure we are the picture shows the plant (curated folder ≈ 1, AI tag ≈ 0.3). Higher is used first. */
  relevance?: number;
  /** Where the plant match came from: species folder, file name, seasonality folder, tag or genus only. */
  matchSource?: 'ordner' | 'dateiname' | 'saisonordner' | 'tag' | 'gattung';
  /** true = season from folder/file name/curated tag, false = guessed from AI tags. */
  seasonCertain?: boolean;
  /** Dropbox path, shown in the picture picker. */
  path?: string;
}

export interface MoodboardSlot {
  id: string;
  /** Column key, e.g. 'herbst' or 'baeume'. */
  column: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Tags that make a picture a good match for this slot (e.g. garden scenes for the big centre slot). */
  prefer?: readonly string[];
}

export interface MoodboardColumn {
  key: string;
  /** Label printed above the column (empty for boards without labels). */
  label: string;
  /**
   * Tags that make a picture fit this column (lowercase, compared without umlauts).
   * Empty = every picture of a plant in this column fits.
   */
  tags: string[];
  /** Only plants of this group go into the column ("Pflanzenauswahl"). */
  group?: PlantGroup;
}

export interface MoodboardLayout {
  type: MoodboardType;
  /** Template letter on the enea templates (G, F, J). The PDF prints the page number instead. */
  code: string;
  name: string;
  description: string;
  /** Default for the third header part "Projekt | Konzept | <subtitle>". */
  subtitle: string;
  columns: MoodboardColumn[];
  slots: MoodboardSlot[];
  /** Minimum number of selected plants before the board can be generated. */
  minPlants: number;
  /** Maximum number of selected plants (null = no limit). */
  maxPlants: number | null;
  /** Number of plants that gives a good result; shown as a hint. */
  recommendedPlants: string;
  /** true = one page per selected plant by default ("Pflanzenportrait"); can be switched off. */
  onePagePerPlant: boolean;
}

/** Which picture sits in which slot. null = no picture found, slot stays grey. */
export interface SlotAssignment {
  slotId: string;
  image: MoodboardImage | null;
  plant: MoodboardPlant | null;
}

export interface MoodboardPage {
  layout: MoodboardLayout;
  /** Short description for the preview, e.g. the plant name of a portrait page. */
  detail: string;
  /** The plant of a portrait page (one page per plant), otherwise null. */
  plant: MoodboardPlant | null;
  slots: SlotAssignment[];
}

export interface MoodboardWarning {
  level: 'error' | 'warning';
  message: string;
}
