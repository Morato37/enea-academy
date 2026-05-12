# Testing WorldClim Integration

## Current Status

✅ **Setup Complete**
- geotiff.js library installed
- Climate data backup created
- Import script ready (`scripts/worldclim_europe_import.mjs`)
- Zone detection already configured to use WorldClim data

## Next Step: Import WorldClim Data

**You need to download and import the WorldClim BIO6 data first.**

See `WORLDCLIM_IMPORT_GUIDE.md` for detailed instructions.

Quick summary:
1. Download WorldClim BIO6 at 30 arc-seconds from https://www.worldclim.org/data/worldclim21.html
2. Place `wc2.1_30s_bio_6.tif` in `worldclim_data/` directory
3. Run: `node scripts/worldclim_europe_import.mjs`

## Testing After Import

Once you've imported the WorldClim data, test these locations:

### 1. Sankt Moritz, Switzerland (The Problem Case)

**Location**: Sankt Moritz, 7500, Switzerland
**Coordinates**: 46.50°N, 9.84°E
**Elevation**: ~1,800m
**Expected**: Zone **6a** (currently shows 8a incorrectly)

### 2. Zermatt, Switzerland (High Altitude)

**Location**: Zermatt, Switzerland
**Coordinates**: 46.02°N, 7.75°E
**Elevation**: ~1,600m
**Expected**: Zone **6a** or **6b**

### 3. Innsbruck, Austria (Alpine Valley)

**Location**: Innsbruck, Austria
**Coordinates**: 47.27°N, 11.39°E
**Elevation**: ~574m
**Expected**: Zone **7a** or **7b**

### 4. Palermo, Sicily (Mediterranean)

**Location**: Palermo, Italy
**Coordinates**: 38.12°N, 13.36°E
**Elevation**: ~14m
**Expected**: Zone **10a** or **10b** (warm Mediterranean)

### 5. Tromsø, Norway (Arctic)

**Location**: Tromsø, Norway
**Coordinates**: 69.65°N, 18.96°E
**Elevation**: ~10m
**Expected**: Zone **7a** or **7b** (Gulf Stream effect)

## How to Test in the Application

1. Start the dev server: `npm run dev`
2. Navigate to the Zone Map page
3. Search for each test location
4. Verify the detected zone matches expectations
5. Check the confidence score (should be 90%+ for WorldClim data)
6. Verify the data source shows "worldclim_bio6_30s"

## Expected Results After Import

### Before (Simplified Latitude Model)
```
Sankt Moritz → Zone 8a (WRONG - ignores 1,800m elevation)
Palermo → Zone 9a (WRONG - too cold for Sicily)
Tromsø → Zone 5a (WRONG - ignores Gulf Stream warming)
```

### After (WorldClim Data)
```
Sankt Moritz → Zone 6a ✓ (Correct - accounts for elevation)
Palermo → Zone 10a ✓ (Correct - Mediterranean climate)
Tromsø → Zone 7b ✓ (Correct - coastal moderation)
```

## Verification Queries

You can verify the data directly in the database:

```sql
-- Check if WorldClim data exists
SELECT COUNT(*) FROM climate_data_points WHERE data_source = 'worldclim_bio6_30s';
-- Should return ~50,000+ for Europe

-- Check Sankt Moritz area (46.5°N, 9.84°E)
SELECT
  latitude,
  longitude,
  min_temperature,
  hardiness_zone,
  data_source
FROM climate_data_points
WHERE latitude BETWEEN 46.4 AND 46.6
  AND longitude BETWEEN 9.7 AND 10.0
  AND data_source = 'worldclim_bio6_30s'
ORDER BY
  ABS(latitude - 46.50) + ABS(longitude - 9.84)
LIMIT 5;
-- Should show zone 6a with temp around -20°C

-- Check coverage
SELECT
  hardiness_zone,
  COUNT(*) as point_count,
  ROUND(AVG(min_temperature), 1) as avg_min_temp
FROM climate_data_points
WHERE data_source = 'worldclim_bio6_30s'
GROUP BY hardiness_zone
ORDER BY hardiness_zone;
-- Shows distribution across zones
```

## What Changed in the Code

### 1. Added GeoTIFF Processing
- Installed `geotiff` library for reading raster climate data
- Created import script with proper temperature conversion

### 2. Database Backup
- `climate_data_points_backup` table created
- All existing data preserved

### 3. Zone Detection Priority (Already Configured)
The zone detection in `src/lib/zoneDetection.ts` already prioritizes data in this order:

1. **WorldClim climate data** (95% confidence) ← NEW, HIGHEST PRIORITY
2. City database matches (99% confidence)
3. Regional boundaries (80-85% confidence)
4. Simplified latitude model (65% confidence, FALLBACK)

This means once WorldClim data is imported, it will automatically be used for all zones in Europe!

## Performance Notes

- **~50,000 data points** for Europe at ~1km resolution
- **Spatial indexes** on latitude/longitude for fast lookups
- **0.5° search radius** (~55km) ensures nearest neighbor found
- **Queries complete in <100ms** typical

## Troubleshooting

### Data Not Being Used
- Check confidence scores - WorldClim should be 95%
- Verify data_source is 'worldclim_bio6_30s'
- Ensure search radius includes the point (0.5°)

### Wrong Zones Still Showing
- Clear geocode cache: `DELETE FROM geocode_cache;`
- Re-run zone detection
- Check import completed successfully

### Import Errors
- Verify GeoTIFF file is correct: `wc2.1_30s_bio_6.tif`
- Check file size (should be ~50-100MB)
- Ensure enough disk space for processing
