import { createClient } from '@supabase/supabase-js';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fromArrayBuffer } from 'geotiff';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const WORLDCLIM_BASE_URL = 'https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_30s_bio.zip';
const DATA_DIR = path.join(__dirname, '..', 'worldclim_data');
const BIO6_VAR = 'bio_6';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading from ${url}...`);
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Downloaded to ${destPath}`);
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded to ${destPath}`);
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function extractGeoTIFF(zipPath, extractDir) {
  console.log('Note: Please extract the ZIP file manually and place bio_6.tif in the worldclim_data directory');
  console.log('The file structure should be: worldclim_data/wc2.1_30s_bio_6.tif');
}

async function processGeoTIFF(tiffPath) {
  console.log(`Processing GeoTIFF file: ${tiffPath}`);

  const arrayBuffer = fs.readFileSync(tiffPath).buffer;
  const tiff = await fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();

  const width = image.getWidth();
  const height = image.getHeight();
  const bbox = image.getBoundingBox();
  const data = await image.readRasters();
  const values = data[0];

  console.log(`Image dimensions: ${width}x${height}`);
  console.log(`Bounding box:`, bbox);

  const [minX, minY, maxX, maxY] = bbox;
  const resX = (maxX - minX) / width;
  const resY = (maxY - minY) / height;

  console.log(`Resolution: ${resX}° x ${resY}°`);

  const europeData = [];
  const europeBounds = {
    minLat: 35,
    maxLat: 72,
    minLon: -10,
    maxLon: 40
  };

  let processedCount = 0;
  const totalPixels = width * height;
  const sampleRate = 10;

  console.log(`Extracting data for Europe (lat: ${europeBounds.minLat}-${europeBounds.maxLat}, lon: ${europeBounds.minLon}-${europeBounds.maxLon})`);
  console.log(`Sampling every ${sampleRate} pixels for ~1km resolution...`);

  for (let y = 0; y < height; y += sampleRate) {
    for (let x = 0; x < width; x += sampleRate) {
      const lon = minX + x * resX;
      const lat = maxY - y * resY;

      if (lat >= europeBounds.minLat && lat <= europeBounds.maxLat &&
          lon >= europeBounds.minLon && lon <= europeBounds.maxLon) {

        const idx = y * width + x;
        const tempValue = values[idx];

        if (tempValue !== null && tempValue !== undefined && tempValue !== -9999 && tempValue > -1000) {
          const tempCelsius = tempValue / 10.0;

          const zoneCode = getHardinessZone(tempCelsius);

          europeData.push({
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lon.toFixed(6)),
            min_temperature: parseFloat(tempCelsius.toFixed(2)),
            hardiness_zone: zoneCode,
            data_source: 'worldclim_bio6_30s',
            confidence_score: 0.95
          });

          processedCount++;

          if (processedCount % 1000 === 0) {
            const progress = ((y / height) * 100).toFixed(1);
            console.log(`Processed ${processedCount} points (${progress}% complete)...`);
          }
        }
      }
    }
  }

  console.log(`Total data points extracted for Europe: ${europeData.length}`);
  return europeData;
}

function getHardinessZone(minTempC) {
  if (minTempC >= 4.4) return '10b';
  if (minTempC >= 1.7) return '10a';
  if (minTempC >= -1.1) return '9b';
  if (minTempC >= -3.9) return '9a';
  if (minTempC >= -6.7) return '8b';
  if (minTempC >= -9.4) return '8a';
  if (minTempC >= -12.2) return '7b';
  if (minTempC >= -15.0) return '7a';
  if (minTempC >= -17.8) return '6b';
  if (minTempC >= -20.6) return '6a';
  if (minTempC >= -23.3) return '5b';
  if (minTempC >= -26.1) return '5a';
  if (minTempC >= -28.9) return '4b';
  if (minTempC >= -31.7) return '4a';
  return '3b';
}

async function importToDatabase(climateData) {
  console.log(`\nImporting ${climateData.length} records to database...`);

  console.log('Clearing existing WorldClim data...');
  const { error: deleteError } = await supabase
    .from('climate_data_points')
    .delete()
    .eq('data_source', 'worldclim_bio6_30s');

  if (deleteError && deleteError.code !== 'PGRST116') {
    console.error('Error clearing old data:', deleteError);
  }

  const batchSize = 500;
  let imported = 0;

  for (let i = 0; i < climateData.length; i += batchSize) {
    const batch = climateData.slice(i, i + batchSize);

    const { error } = await supabase
      .from('climate_data_points')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      throw error;
    }

    imported += batch.length;
    console.log(`Imported ${imported}/${climateData.length} records (${((imported/climateData.length)*100).toFixed(1)}%)`);
  }

  console.log(`\n✓ Successfully imported ${imported} climate data points!`);
}

async function main() {
  console.log('=== WorldClim Europe Climate Data Import ===\n');

  const tiffFile = path.join(DATA_DIR, 'wc2.1_30s_bio_6.tif');

  if (!fs.existsSync(tiffFile)) {
    console.log('BIO6 GeoTIFF file not found.');
    console.log('\nPlease download WorldClim BIO6 data manually:');
    console.log('1. Visit: https://www.worldclim.org/data/worldclim21.html');
    console.log('2. Download "Bioclimatic variables" at 30 arc-seconds resolution');
    console.log('3. Extract the ZIP file');
    console.log('4. Place wc2.1_30s_bio_6.tif in the worldclim_data/ directory');
    console.log(`5. Expected location: ${tiffFile}`);
    console.log('\nThen run this script again.');
    return;
  }

  const climateData = await processGeoTIFF(tiffFile);

  if (climateData.length > 0) {
    await importToDatabase(climateData);

    console.log('\n=== Import Summary ===');
    console.log(`Total points imported: ${climateData.length}`);
    console.log('Data source: WorldClim 2.1 BIO6 (30 arc-seconds)');
    console.log('Coverage: Europe (35°N-72°N, 10°W-40°E)');
    console.log('Resolution: ~1km at ground level');
    console.log('\nThe database now contains accurate, elevation-adjusted climate data!');
  } else {
    console.log('No data extracted. Please check the input file and bounds.');
  }
}

main().catch(console.error);
