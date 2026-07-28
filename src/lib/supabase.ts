import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function optimizeImageUrl(
  url: string | null | undefined,
  _options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url) return '';
  return url;
}

export interface Plant {
  id: number;
  botanical_name: string;
  common_name_de?: string;
  common_name_en?: string;

  // Plant categories
  category_shrub?: boolean;
  category_tree?: boolean;
  category_palm?: boolean;
  category_perennial?: boolean;
  category_annual?: boolean;
  category_biannual?: boolean;
  category_grass?: boolean;
  category_succulent?: boolean;
  category_bulb?: boolean;
  category_acquatic?: boolean;
  category_nonvascular?: boolean;
  category_fern?: boolean;
  category_climbing_plant?: boolean;
  category_formal_hedge?: boolean;
  category_wild_hedge?: boolean;
  category_toxic_plant?: boolean;
  category_ground_cover?: boolean;
  category_culinary_plant?: boolean;
  category_medicinal_herbs?: boolean;

  // Exposure requirements
  exposure_sun?: boolean;
  exposure_shade?: boolean;
  exposure_halfshade?: boolean;

  // Soil types
  soil_sandy?: boolean;
  soil_clay?: boolean;
  soil_loamy?: boolean;

  // Usage categories
  usage_solitary_garden?: boolean;
  usage_solitary_park?: boolean;
  usage_solitary_terrace?: boolean;
  usage_trees_in_groups?: boolean;
  usage_grasses?: boolean;
  usage_ferns?: boolean;
  usage_waterplants_pond?: boolean;
  usage_medicinal_herbs?: boolean;
  usage_ground_cover?: boolean;
  usage_seasonal?: boolean;
  usage_climbing?: boolean;
  usage_tuberous_rooted?: boolean;
  usage_formal_hedge?: boolean;
  usage_wild_hedge?: boolean;
  usage_tropical?: boolean;

  // Climate zones
  zone_2a?: boolean;
  zone_2b?: boolean;
  zone_3a?: boolean;
  zone_3b?: boolean;
  zone_4a?: boolean;
  zone_4b?: boolean;
  zone_5a?: boolean;
  zone_5b?: boolean;
  zone_6a?: boolean;
  zone_6b?: boolean;
  zone_7a?: boolean;
  zone_7b?: boolean;
  zone_8a?: boolean;
  zone_8b?: boolean;
  zone_9a?: boolean;
  zone_9b?: boolean;
  zone_10a?: boolean;
  zone_10b?: boolean;

  // Seasonal colors
  color_jan?: string;
  color_feb?: string;
  color_mar?: string;
  color_apr?: string;
  color_may?: string;
  color_jun?: string;
  color_jul?: string;
  color_aug?: string;
  color_sep?: string;
  color_oct?: string;
  color_nov?: string;
  color_dec?: string;

  // Second seasonal colors (optional, shown diagonally split in blooming calendar)
  color2_jan?: string;
  color2_feb?: string;
  color2_mar?: string;
  color2_apr?: string;
  color2_may?: string;
  color2_jun?: string;
  color2_jul?: string;
  color2_aug?: string;
  color2_sep?: string;
  color2_oct?: string;
  color2_nov?: string;
  color2_dec?: string;

  // Special traits
  traits_change_with_location?: string;
  tree_of_the_future?: boolean;
  layer?: string;

  // Perennial size (only for perennials)
  perennial_size?: string;

  // Plant characteristics
  characteristic_evergreen?: boolean;
  characteristic_deciduous?: boolean;
  characteristic_native?: boolean;
  characteristic_butterflies?: boolean;
  characteristic_bees?: boolean;
  characteristic_honeybees?: boolean;
  characteristic_bumblebees?: boolean;
  characteristic_hoverflies?: boolean;
  characteristic_beetles?: boolean;
  characteristic_birds?: boolean;

  // Image
  image_url?: string;

  created_at?: string;
  updated_at?: string;
}

export type StoneCategory = 'tile' | 'cobblestone' | 'both' | null;

export interface Stone {
  id: number;
  name: string;
  morphology?: string;
  producer_seller?: string;
  origin?: string;
  stone_color?: string;
  stone_category?: StoneCategory;

  // Climate zones
  mediterranean_zone?: boolean;
  central_europe_zone?: boolean;
  alpine_zone?: boolean;

  // Applications/Uses
  use_tiles?: boolean;
  use_block_steps?: boolean;
  use_paving?: boolean;
  use_walls?: boolean;
  use_pool?: boolean;
  use_chippings?: boolean;

  // Surface finishes
  finish_split?: boolean;
  finish_flamed?: boolean;
  finish_flamed_wild?: boolean;
  finish_split_antique_wild?: boolean;
  finish_blasted?: boolean;
  finish_sawn?: boolean;
  finish_hammered?: boolean;
  finish_brushed?: boolean;
  finish_polished?: boolean;
  finish_honed?: boolean;

  // Frost resistance
  frost_resistant?: boolean;
  less_frost_resistant?: boolean;
  not_frost_resistant?: boolean;

  // Images
  image_url?: string;
  finish_split_image_url?: string;
  finish_flamed_image_url?: string;
  finish_blasted_image_url?: string;
  finish_sawn_image_url?: string;
  finish_hammered_image_url?: string;
  finish_brushed_image_url?: string;
  finish_polished_image_url?: string;
  finish_honed_image_url?: string;

  created_at?: string;
  updated_at?: string;
}

export interface StoneCombination {
  id: string;
  tile_stone_id: number;
  cobblestone_stone_id: number;
  combination_name?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  tile_stone?: Stone;
  cobblestone_stone?: Stone;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectZone {
  id: string;
  project_id?: string;
  user_id: string;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectShare {
  id: string;
  project_id: string;
  owner_id: string;
  shared_with_user_id: string;
  permission: 'view' | 'edit';
  created_at: string;
}

export interface ProjectShareWithUser extends ProjectShare {
  user_profile?: { id: string; email: string; full_name: string | null };
}

export interface SharedProjectEntry {
  share: ProjectShare;
  project: Project;
  owner_profile?: { id: string; email: string; full_name: string | null };
}

export interface UserSearchResult {
  id: string;
  email: string;
  full_name: string | null;
}

export interface UserSelection {
  id: string;
  user_id: string;
  project_id?: string;
  zone_id?: string;
  plant_id?: number;
  stone_id?: number;
  quantity: number;
  notes?: string;
  parent_selection_id?: string;
  is_tile_combination?: boolean;
  combination_reference?: string;
  created_at: string;
  plant?: Plant;
  stone?: Stone;
  project?: Project;
  zone?: ProjectZone;
  child_selections?: UserSelection[];
}
