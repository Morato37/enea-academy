# WorldClim Europe Data Import Guide

This guide explains how to import real, elevation-adjusted climate data for Europe at 30 arc-second resolution (~1km).

## Why WorldClim?

WorldClim provides scientifically validated climate data that accounts for:
- **Actual temperature measurements** from weather stations
- **Elevation effects** - high-altitude areas like Sankt Moritz get correct zones
- **Topographic influences** - valleys, mountains, coastal effects
- **30 arc-second resolution** - approximately 1km² grid cells

## Quick Start

### Step 1: Download WorldClim BIO6 Data

1. Visit: https://www.worldclim.org/data/worldclim21.html
2. Scroll to **"Bioclimatic variables"**
3. Download the **30 arc-seconds (~1km²)** resolution
4. Extract the downloaded ZIP file

You'll get multiple BIO files. We need **BIO6** (minimum temperature of coldest month).

### Step 2: Place the File

Create the directory and place the file:

```bash
mkdir -p worldclim_data
cp /path/to/extracted/wc2.1_30s_bio_6.tif worldclim_data/
```

The file should be at: `worldclim_data/wc2.1_30s_bio_6.tif`

### Step 3: Run the Import Script

```bash
node scripts/worldclim_europe_import.mjs
```

The script will:
- ✓ Load the GeoTIFF file (global coverage)
- ✓ Extract data for Europe (35°N-72°N, 10°W-40°E)
- ✓ Sample at ~1km resolution
- ✓ Convert temperatures from WorldClim format (°C × 10) to °C
- ✓ Calculate hardiness zones automatically
- ✓ Import ~50,000+ data points to the database

### Step 4: Verify

Test Sankt Moritz to verify the fix:
- **Before**: Zone 8a (incorrect, based on latitude only)
- **After**: Zone 6a (correct, accounts for 1,800m elevation)

## What Gets Imported

The script extracts climate data for all of Europe:

| Region | Coverage |
|--------|----------|
| **Latitude** | 35°N to 72°N (Spain to Scandinavia) |
| **Longitude** | 10°W to 40°E (Ireland to Eastern Europe) |
| **Resolution** | ~1 km² grid cells |
| **Data Points** | ~50,000+ for Europe |

## How It Works

### Temperature Conversion

WorldClim stores temperatures as: `value = °C × 10`

Example:
- Raw value: `-206`
- Actual temp: `-206 / 10 = -20.6°C`
- Zone: **6a** (−20.6°C to −17.8°C)

### Zone Mapping

The script automatically converts temperatures to USDA zones:

| Min Temp (°C) | Zone |
|---------------|------|
| ≥ 4.4 | 10b |
| 1.7 to 4.4 | 10a |
| −1.1 to 1.7 | 9b |
| −3.9 to −1.1 | 9a |
| −6.7 to −3.9 | 8b |
| −9.4 to −6.7 | 8a |
| −12.2 to −9.4 | 7b |
| −15.0 to −12.2 | 7a |
| −17.8 to −15.0 | 6b |
| −20.6 to −17.8 | 6a |
| −23.3 to −20.6 | 5b |
| < −23.3 | 5a or lower |

## Benefits

### Before (Simplified Model)
- Based only on latitude
- No elevation consideration
- Sankt Moritz: Zone 8a ❌ (wrong)

### After (WorldClim Data)
- Real measurements from weather stations
- Elevation properly accounted for
- Sankt Moritz: Zone 6a ✓ (correct)

## Troubleshooting

### File Not Found
```
Error: worldclim_data/wc2.1_30s_bio_6.tif not found
```

**Solution**: Download the file from WorldClim and place it in `worldclim_data/`

### Memory Issues

If you encounter memory errors with the full resolution:
1. The script already samples every 10th pixel for performance
2. You can increase the `sampleRate` variable in the script (e.g., 20 or 30)

### Database Errors

If import fails:
- Check your `.env` file has correct Supabase credentials
- Ensure the `climate_data_points` table exists
- Check network connection to Supabase

## Data Backup

The existing climate data has been backed up to `climate_data_points_backup` table before import.

To restore the old data:
```sql
DELETE FROM climate_data_points WHERE data_source = 'worldclim_bio6_30s';
INSERT INTO climate_data_points SELECT * FROM climate_data_points_backup;
```

## Next Steps

After importing WorldClim data:

1. **Test the application** - zones should now be accurate
2. **Check Alpine regions** - Sankt Moritz, Innsbruck, Zermatt should all show correct zones
3. **Monitor performance** - the ~50,000 data points should query quickly with spatial indexes

## Technical Details

- **Data Source**: WorldClim 2.1 (https://www.worldclim.org/)
- **Variable**: BIO6 (Minimum Temperature of Coldest Month)
- **Resolution**: 30 arc-seconds (~0.93 km at equator)
- **Coordinate System**: WGS84 (EPSG:4326)
- **Coverage**: Global (we extract Europe only)
- **Data Points**: ~50,000+ for Europe
- **Confidence Score**: 0.95 (very high)

## References

- WorldClim 2.1: https://www.worldclim.org/data/worldclim21.html
- USDA Hardiness Zones: https://planthardiness.ars.usda.gov/
- BIO6 Variable: Minimum temperature of the coldest month
