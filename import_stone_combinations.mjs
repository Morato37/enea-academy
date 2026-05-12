import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const stoneCombinations = [
  {
    tileId: 4,
    cobblestoneIds: [4, 10]
  },
  {
    tileId: 18,
    cobblestoneIds: [10, 17]
  },
  {
    tileId: 23,
    cobblestoneIds: []
  },
  {
    tileId: 1,
    cobblestoneIds: [1]
  },
  {
    tileId: 10,
    cobblestoneIds: [10, 16]
  },
  {
    tileId: 2,
    cobblestoneIds: []
  },
  {
    tileId: 15,
    cobblestoneIds: []
  },
  {
    tileId: 7,
    cobblestoneIds: [7]
  },
  {
    tileId: 8,
    cobblestoneIds: [8]
  },
  {
    tileId: 9,
    cobblestoneIds: [9, 20]
  },
  {
    tileId: 11,
    cobblestoneIds: [11, 17]
  },
  {
    tileId: 21,
    cobblestoneIds: [21, 17]
  },
  {
    tileId: 20,
    cobblestoneIds: [20, 17]
  }
];

async function getStoneById(stoneId) {
  const { data, error } = await supabase
    .from('stones')
    .select('id, name')
    .eq('id', stoneId)
    .maybeSingle();

  if (error) {
    console.error(`Error finding stone ID ${stoneId}:`, error);
    return null;
  }

  return data;
}

async function updateStoneCategories() {
  console.log('Updating stone categories...');

  const allTileIds = [...new Set(stoneCombinations.map(c => c.tileId))];
  const allCobblestoneIds = [...new Set(stoneCombinations.flatMap(c => c.cobblestoneIds))];

  for (const tileId of allTileIds) {
    const stone = await getStoneById(tileId);
    if (stone) {
      const category = allCobblestoneIds.includes(tileId) ? 'both' : 'tile';
      const { error } = await supabase
        .from('stones')
        .update({ stone_category: category })
        .eq('id', stone.id);

      if (error) {
        console.error(`Error updating tile category for ${stone.name}:`, error);
      } else {
        console.log(`✓ Set ${stone.name} as ${category}`);
      }
    }
  }

  for (const cobblestoneId of allCobblestoneIds) {
    if (allTileIds.includes(cobblestoneId)) {
      continue;
    }

    const stone = await getStoneById(cobblestoneId);
    if (stone) {
      const { error } = await supabase
        .from('stones')
        .update({ stone_category: 'cobblestone' })
        .eq('id', stone.id);

      if (error) {
        console.error(`Error updating cobblestone category for ${stone.name}:`, error);
      } else {
        console.log(`✓ Set ${stone.name} as cobblestone`);
      }
    }
  }
}

async function importCombinations() {
  console.log('Starting stone combinations import...\n');

  await updateStoneCategories();

  console.log('\nImporting tile-cobblestone combinations...');

  for (const combo of stoneCombinations) {
    const tileStone = await getStoneById(combo.tileId);

    if (!tileStone) {
      console.error(`⨯ Could not find tile ID: ${combo.tileId}`);
      continue;
    }

    console.log(`\nProcessing tile: ${tileStone.name} (ID: ${tileStone.id})`);

    if (combo.cobblestoneIds.length === 0) {
      console.log(`  ℹ No cobblestones defined for this tile`);
      continue;
    }

    let displayOrder = 0;
    for (const cobblestoneId of combo.cobblestoneIds) {
      const cobblestoneStone = await getStoneById(cobblestoneId);

      if (!cobblestoneStone) {
        console.error(`  ⨯ Could not find cobblestone ID: ${cobblestoneId}`);
        continue;
      }

      const { error } = await supabase
        .from('stone_combinations')
        .upsert({
          tile_stone_id: tileStone.id,
          cobblestone_stone_id: cobblestoneStone.id,
          combination_name: `${tileStone.name} + ${cobblestoneStone.name}`,
          display_order: displayOrder++
        }, {
          onConflict: 'tile_stone_id,cobblestone_stone_id'
        });

      if (error) {
        console.error(`  ⨯ Error creating combination:`, error);
      } else {
        console.log(`  ✓ Added combination: ${tileStone.name} + ${cobblestoneStone.name}`);
      }
    }
  }

  console.log('\n✓ Import completed!');
}

importCombinations().catch(console.error);
