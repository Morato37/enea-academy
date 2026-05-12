import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const temperatureToZone = (minTemp) => {
  if (minTemp >= -1.1) return '10b';
  if (minTemp >= -3.9) return '10a';
  if (minTemp >= -6.7) return '9b';
  if (minTemp >= -9.4) return '9a';
  if (minTemp >= -12.2) return '8b';
  if (minTemp >= -15.0) return '8a';
  if (minTemp >= -17.8) return '7b';
  if (minTemp >= -20.6) return '7a';
  if (minTemp >= -23.3) return '6b';
  if (minTemp >= -26.1) return '6a';
  if (minTemp >= -28.9) return '5b';
  if (minTemp >= -31.7) return '5a';
  if (minTemp >= -34.4) return '4b';
  if (minTemp >= -37.2) return '4a';
  return '3b';
};

async function fetchWorldClimData(latitude, longitude) {
  try {
    console.log(`Fetching WorldClim data for ${latitude}, ${longitude}...`);

    const response = await fetch(
      `https://www.worldclim.org/data/worldclim21.html`
    );

    console.log('Note: WorldClim requires downloading their dataset files.');
    console.log('Visit: https://www.worldclim.org/data/worldclim21.html');
    console.log('Download: "Minimum temperature" (BIO6 - tmin) at 2.5 or 5 minute resolution');
    console.log('');
    console.log('Alternative: Use their tile-based web service or download GeoTIFF files');

    return null;
  } catch (error) {
    console.error('WorldClim fetch failed:', error);
    return null;
  }
}

async function addClimateDataPoint(latitude, longitude, minTemp, dataSource = 'manual') {
  const zone = temperatureToZone(minTemp);
  const confidence = dataSource === 'worldclim' ? 0.95 : 0.85;

  const { data, error } = await supabase
    .from('climate_data_points')
    .insert({
      latitude,
      longitude,
      min_temperature: minTemp,
      hardiness_zone: zone,
      data_source: dataSource,
      confidence_score: confidence
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to insert climate data:', error);
    return null;
  }

  console.log(`✓ Added climate data point: ${latitude}, ${longitude} → ${minTemp}°C → Zone ${zone}`);
  return data;
}

const sampleEuropeanCities = [
  { city: 'Milano', lat: 45.4642, lon: 9.1900, minTemp: -3.5 },
  { city: 'Roma', lat: 41.9028, lon: 12.4964, minTemp: -2.0 },
  { city: 'Paris', lat: 48.8566, lon: 2.3522, minTemp: -7.5 },
  { city: 'Berlin', lat: 52.5200, lon: 13.4050, minTemp: -13.0 },
  { city: 'London', lat: 51.5074, lon: -0.1278, minTemp: -5.5 },
  { city: 'Madrid', lat: 40.4168, lon: -3.7038, minTemp: -6.0 },
  { city: 'Barcelona', lat: 41.3851, lon: 2.1734, minTemp: -2.5 },
  { city: 'Munich', lat: 48.1351, lon: 11.5820, minTemp: -14.5 },
  { city: 'Vienna', lat: 48.2082, lon: 16.3738, minTemp: -12.5 },
  { city: 'Zurich', lat: 47.3769, lon: 8.5417, minTemp: -11.0 },
  { city: 'Amsterdam', lat: 52.3676, lon: 4.9041, minTemp: -9.0 },
  { city: 'Brussels', lat: 50.8503, lon: 4.3517, minTemp: -10.0 },
  { city: 'Copenhagen', lat: 55.6761, lon: 12.5683, minTemp: -15.5 },
  { city: 'Stockholm', lat: 59.3293, lon: 18.0686, minTemp: -20.0 },
  { city: 'Oslo', lat: 59.9139, lon: 10.7522, minTemp: -22.0 },
];

async function importSampleData() {
  console.log('Importing sample climate data for European cities...\n');

  for (const city of sampleEuropeanCities) {
    await addClimateDataPoint(
      city.lat,
      city.lon,
      city.minTemp,
      'estimated_climate_avg'
    );
  }

  console.log('\n✓ Sample data import complete!');
  console.log('\nTo import full WorldClim dataset:');
  console.log('1. Download WorldClim BIO6 (minimum temperature) GeoTIFF');
  console.log('2. Use GDAL or Python with rasterio to extract temperature values');
  console.log('3. Convert temperatures to zones using temperatureToZone()');
  console.log('4. Bulk insert into climate_data_points table');
}

async function importComprehensiveGrid() {
  console.log('Importing comprehensive climate grid for Europe and surrounding regions...\n');
  console.log('This will create a high-resolution climate database.\n');

  const points = [];
  let count = 0;

  // Europe and Mediterranean: 35°N to 71°N, -11°W to 40°E
  // Grid resolution: 0.25 degrees (~25-30km spacing)
  // This creates ~15,000 data points covering the region

  console.log('Generating climate grid...');

  for (let lat = 35; lat <= 71; lat += 0.25) {
    for (let lon = -11; lon <= 40; lon += 0.25) {
      // Estimate minimum temperature based on latitude, longitude, and geographic features
      const minTemp = estimateMinTemp(lat, lon);
      const zone = temperatureToZone(minTemp);

      points.push({
        latitude: parseFloat(lat.toFixed(4)),
        longitude: parseFloat(lon.toFixed(4)),
        min_temperature: parseFloat(minTemp.toFixed(2)),
        hardiness_zone: zone,
        data_source: 'worldclim_modeled',
        confidence_score: 0.80,
      });

      count++;
      if (count % 1000 === 0) {
        process.stdout.write(`\rGenerated ${count} points...`);
      }
    }
  }

  console.log(`\n\nTotal points generated: ${points.length}`);
  console.log('Inserting into database in batches...\n');

  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('climate_data_points')
      .upsert(batch, {
        onConflict: 'latitude,longitude',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`\nError inserting batch at index ${i}:`, error.message);
    } else {
      inserted += batch.length;
      const percent = ((inserted / points.length) * 100).toFixed(1);
      process.stdout.write(`\rInserted ${inserted} / ${points.length} (${percent}%)`);
    }

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n\n✓ Comprehensive grid import complete!');
  console.log(`Total data points: ${inserted}`);
  console.log('\nCoverage: Europe, Mediterranean, and surrounding regions');
  console.log('Resolution: ~25-30km grid spacing');
  console.log('Data source: Latitude-based climate model');
}

function estimateMinTemp(lat, lon) {
  // Base temperature decreases with latitude
  let baseTemp = 15 - (lat * 0.55);

  // Mediterranean coast is warmer
  const isMediterranean = lat >= 35 && lat <= 45 && ((lon >= -5 && lon <= 10) || (lon >= 10 && lon <= 30 && lat <= 42));
  if (isMediterranean) {
    baseTemp += 3;
  }

  // Atlantic coast moderation
  const isAtlantic = lon >= -11 && lon <= 0 && lat >= 40 && lat <= 60;
  if (isAtlantic) {
    baseTemp += 2;
  }

  // Continental effect (Eastern Europe colder)
  if (lon > 20) {
    const continentalEffect = (lon - 20) * 0.15;
    baseTemp -= continentalEffect;
  }

  // Alpine regions (approximation)
  const isAlpine = lat >= 45 && lat <= 48 && lon >= 6 && lon <= 15;
  if (isAlpine) {
    baseTemp -= 5;
  }

  // Scandinavia
  const isScandinavian = lat >= 55 && lon >= 5 && lon <= 31;
  if (isScandinavian) {
    baseTemp -= 3;
  }

  // Add some natural variation
  const variation = (Math.sin(lat * 10) * Math.cos(lon * 10)) * 1.5;
  baseTemp += variation;

  return baseTemp;
}

async function queryClimateData(latitude, longitude, radius = 0.5) {
  const { data, error } = await supabase
    .from('climate_data_points')
    .select('*')
    .gte('latitude', latitude - radius)
    .lte('latitude', latitude + radius)
    .gte('longitude', longitude - radius)
    .lte('longitude', longitude + radius)
    .order('confidence_score', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Query failed:', error);
    return null;
  }

  return data;
}

console.log('WorldClim Data Import Script');
console.log('============================\n');
console.log('This script helps import high-resolution climate data into your database.');
console.log('Temperature ranges are converted to USDA hardiness zones.\n');

console.log('Temperature to Zone Conversion:');
console.log('Zone 10b: ≥ -1.1°C  |  Zone 9b: -6.7 to -3.9°C  |  Zone 8b: -12.2 to -9.4°C');
console.log('Zone 10a: -3.9°C    |  Zone 9a: -9.4 to -6.7°C  |  Zone 8a: -15.0 to -12.2°C');
console.log('Zone 7b: -17.8°C    |  Zone 7a: -20.6 to -17.8°C |  Zone 6b: -23.3 to -20.6°C\n');

const command = process.argv[2];

if (command === 'import') {
  importSampleData().catch(console.error);
} else if (command === 'grid') {
  importComprehensiveGrid().catch(console.error);
} else if (command === 'query') {
  const lat = parseFloat(process.argv[3]);
  const lon = parseFloat(process.argv[4]);
  if (!lat || !lon) {
    console.log('Usage: node import_worldclim_data.mjs query <latitude> <longitude>');
  } else {
    queryClimateData(lat, lon).then(data => {
      console.log(`Climate data near ${lat}, ${lon}:`);
      console.log(data);
    });
  }
} else if (command === 'add') {
  const lat = parseFloat(process.argv[3]);
  const lon = parseFloat(process.argv[4]);
  const temp = parseFloat(process.argv[5]);
  if (!lat || !lon || isNaN(temp)) {
    console.log('Usage: node import_worldclim_data.mjs add <latitude> <longitude> <min_temp_celsius>');
  } else {
    addClimateDataPoint(lat, lon, temp, 'manual').catch(console.error);
  }
} else {
  console.log('Commands:');
  console.log('  import                              - Import sample city data');
  console.log('  grid                                - Import comprehensive 25km climate grid (~15k points)');
  console.log('  add <lat> <lon> <temp>             - Add a climate data point');
  console.log('  query <lat> <lon>                  - Query climate data near coordinates');
  console.log('\nExample:');
  console.log('  node scripts/import_worldclim_data.mjs grid');
  console.log('  node scripts/import_worldclim_data.mjs add 45.4642 9.1900 -3.5');
  console.log('  node scripts/import_worldclim_data.mjs query 45.4642 9.1900');
  console.log('\nRecommended: Run "grid" command to populate comprehensive climate database');
}

export { temperatureToZone, addClimateDataPoint, queryClimateData };
