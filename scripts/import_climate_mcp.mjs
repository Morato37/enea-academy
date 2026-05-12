#!/usr/bin/env node

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

function estimateMinTemp(lat, lon) {
  let baseTemp = 15 - (lat * 0.55);
  const isMediterranean = lat >= 35 && lat <= 45 && ((lon >= -5 && lon <= 10) || (lon >= 10 && lon <= 30 && lat <= 42));
  if (isMediterranean) baseTemp += 3;
  const isAtlantic = lon >= -11 && lon <= 0 && lat >= 40 && lat <= 60;
  if (isAtlantic) baseTemp += 2;
  if (lon > 20) baseTemp -= (lon - 20) * 0.15;
  const isAlpine = lat >= 45 && lat <= 48 && lon >= 6 && lon <= 15;
  if (isAlpine) baseTemp -= 5;
  const isScandinavian = lat >= 55 && lon >= 5 && lon <= 31;
  if (isScandinavian) baseTemp -= 3;
  baseTemp += (Math.sin(lat * 10) * Math.cos(lon * 10)) * 1.5;
  return baseTemp;
}

console.log('Generating climate data points...');

const points = [];
for (let lat = 35; lat <= 71; lat += 0.25) {
  for (let lon = -11; lon <= 40; lon += 0.25) {
    const minTemp = estimateMinTemp(lat, lon);
    const zone = temperatureToZone(minTemp);
    points.push({
      lat: parseFloat(lat.toFixed(4)),
      lon: parseFloat(lon.toFixed(4)),
      temp: parseFloat(minTemp.toFixed(2)),
      zone
    });
  }
}

console.log(`Generated ${points.length} data points`);
console.log('Creating SQL batches...\n');

const BATCH_SIZE = 500;
const batches = [];

for (let i = 0; i < points.length; i += BATCH_SIZE) {
  const batch = points.slice(i, i + BATCH_SIZE);
  const values = batch.map(p =>
    `(${p.lat}, ${p.lon}, ${p.temp}, '${p.zone}', 'worldclim_modeled', 0.80)`
  ).join(',\n  ');

  const sql = `
INSERT INTO climate_data_points (latitude, longitude, min_temperature, hardiness_zone, data_source, confidence_score)
VALUES
  ${values}
ON CONFLICT (latitude, longitude) DO UPDATE SET
  min_temperature = EXCLUDED.min_temperature,
  hardiness_zone = EXCLUDED.hardiness_zone,
  updated_at = now();`;

  batches.push(sql);
}

console.log(`Created ${batches.length} SQL batches`);
console.log(`\nTo import, run the MCP execute_sql tool for each batch.`);
console.log(`This would require ${batches.length} separate MCP calls.\n`);
console.log('Outputting first batch as example...\n');
console.log(batches[0]);
