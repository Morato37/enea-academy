const fs = require('fs');
const stones = JSON.parse(fs.readFileSync('/tmp/stones_data.json', 'utf-8'));

const escapeString = (str) => str ? str.replace(/'/g, "''") : '';

console.log('-- Insert stones data');
stones.forEach(stone => {
  const values = [
    stone.id,
    `'${escapeString(stone.name)}'`,
    stone.morphology ? `'${escapeString(stone.morphology)}'` : 'NULL',
    stone.producer_seller ? `'${escapeString(stone.producer_seller)}'` : 'NULL',
    stone.origin ? `'${escapeString(stone.origin)}'` : 'NULL',
    stone.stone_color ? `'${escapeString(stone.stone_color)}'` : 'NULL',
    stone.mediterranean_zone,
    stone.central_europe_zone,
    stone.alpine_zone,
    stone.use_tiles,
    stone.use_block_steps,
    stone.use_paving,
    stone.use_walls,
    stone.use_pool,
    stone.use_chippings,
    stone.finish_split,
    stone.finish_flamed,
    stone.finish_blasted,
    stone.finish_sawn,
    stone.finish_hammered,
    stone.finish_brushed,
    stone.finish_polished,
    stone.finish_honed,
    stone.frost_resistant,
    stone.less_frost_resistant,
    stone.not_frost_resistant
  ];

  console.log(`INSERT INTO stones (id, name, morphology, producer_seller, origin, stone_color, mediterranean_zone, central_europe_zone, alpine_zone, use_tiles, use_block_steps, use_paving, use_walls, use_pool, use_chippings, finish_split, finish_flamed, finish_blasted, finish_sawn, finish_hammered, finish_brushed, finish_polished, finish_honed, frost_resistant, less_frost_resistant, not_frost_resistant) VALUES (${values.join(', ')});`);
});
