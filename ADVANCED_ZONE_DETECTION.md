# Advanced Zone Detection System

## Overview

The hardiness zone detection system now includes high-resolution climate data, microclimate adjustments, and admin verification capabilities for maximum accuracy.

## System Architecture

### 1. Multi-Tiered Detection Priority

The system checks sources in this order:

1. **Admin Verified Zones** (99% confidence)
   - Manual overrides from `zone_adjustments` table
   - Jelitto-verified city zones
   - Takes absolute priority

2. **High-Resolution Climate Data** (85-95% confidence)
   - Temperature-based zones from WorldClim
   - Stored in `climate_data_points` table
   - Calculated from actual minimum temperatures

3. **City Database** (99% confidence)
   - 80+ major European cities
   - Direct name matching
   - Supports local and English names

4. **Regional Boundaries** (75-96% confidence)
   - Geographic boundary matching
   - Elevation-adjusted
   - Priority scoring for verified data

5. **Fallback Estimation** (65% confidence)
   - Latitude-based calculation
   - Refined ranges for European locations

### 2. Microclimate Adjustment System

After base zone detection, the system applies microclimate factors:

#### Urban Heat Island
- **Effect**: +0.3 to +0.5 zones
- **Examples**: Milano center, Roma, Paris, Berlin
- **Reason**: Cities are 1-2°C warmer than surroundings

#### Coastal Moderation
- **Effect**: +0.5 to +1.0 zones
- **Examples**: Ligurian coast, French Riviera, Sicily coast
- **Reason**: Ocean moderates temperature extremes

#### Valley Cooling
- **Effect**: -0.3 to -0.5 zones
- **Examples**: Alpine valleys, Po Valley cold pockets
- **Reason**: Cold air drainage and pooling

#### Lake Effect
- **Effect**: +0.4 to +0.5 zones
- **Examples**: Lake Garda, Lake Como, Lake Maggiore
- **Reason**: Large water bodies moderate temperatures

## Database Tables

### climate_data_points
High-resolution temperature data for precise zone calculation.

```sql
CREATE TABLE climate_data_points (
  id uuid PRIMARY KEY,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  min_temperature numeric NOT NULL,
  hardiness_zone text NOT NULL,
  data_source text DEFAULT 'manual',
  confidence_score numeric DEFAULT 0.85,
  elevation integer,
  notes text
);
```

**Data Sources:**
- `worldclim`: WorldClim global climate database
- `weather_station`: Historical weather station data
- `manual`: Manually entered climate data
- `estimated_climate_avg`: Calculated averages

### microclimate_factors
Geographic factors that adjust hardiness zones.

```sql
CREATE TABLE microclimate_factors (
  id uuid PRIMARY KEY,
  location_name text NOT NULL,
  latitude_min numeric NOT NULL,
  latitude_max numeric NOT NULL,
  longitude_min numeric NOT NULL,
  longitude_max numeric NOT NULL,
  factor_type text NOT NULL,
  zone_adjustment numeric NOT NULL,
  description text,
  confidence_score numeric DEFAULT 0.80,
  is_active boolean DEFAULT true
);
```

**Factor Types:**
- `urban_heat_island`: City warming effect
- `coastal_moderation`: Ocean temperature buffering
- `valley_pooling`: Cold air drainage
- `lake_effect`: Large water body moderation
- `wind_exposure`: Wind chill effects
- `elevation`: Altitude adjustment (handled separately)
- `custom`: User-defined factors

### zone_adjustments
Admin-verified zone overrides for specific locations.

```sql
CREATE TABLE zone_adjustments (
  id uuid PRIMARY KEY,
  location_identifier text UNIQUE NOT NULL,
  latitude numeric,
  longitude numeric,
  original_zone text,
  adjusted_zone text NOT NULL,
  adjustment_reason text NOT NULL,
  verified_by text,
  confidence_score numeric DEFAULT 0.99,
  is_active boolean DEFAULT true
);
```

## Admin Interface

### Zone Management Tab

Access via Admin Dashboard → Zone Management

#### Features:

1. **Zone Adjustments**
   - Override automatic detection
   - Add verified zones for specific locations
   - Track original vs adjusted zones
   - Add verification notes and sources

2. **Microclimate Factors**
   - Define geographic areas with special climate effects
   - Set zone adjustments (+/- zones)
   - Enable/disable factors
   - Track confidence levels

3. **Actions**
   - Add new adjustments and factors
   - Activate/deactivate entries
   - Delete obsolete data
   - View all current settings

## WorldClim Data Import

### Using the Import Script

```bash
# Import sample European city data
node scripts/import_worldclim_data.mjs import

# Add a single climate data point
node scripts/import_worldclim_data.mjs add 45.4642 9.1900 -3.5

# Query climate data near coordinates
node scripts/import_worldclim_data.mjs query 45.4642 9.1900
```

### Temperature to Zone Conversion

The system uses USDA zone definitions:

| Zone | Min Temperature (°C) | Min Temperature (°F) |
|------|---------------------|---------------------|
| 10b  | ≥ -1.1             | ≥ 30                |
| 10a  | -3.9 to -1.1       | 25 to 30            |
| 9b   | -6.7 to -3.9       | 20 to 25            |
| 9a   | -9.4 to -6.7       | 15 to 20            |
| 8b   | -12.2 to -9.4      | 10 to 15            |
| 8a   | -15.0 to -12.2     | 5 to 10             |
| 7b   | -17.8 to -15.0     | 0 to 5              |
| 7a   | -20.6 to -17.8     | -5 to 0             |
| 6b   | -23.3 to -20.6     | -10 to -5           |
| 6a   | -26.1 to -23.3     | -15 to -10          |

### Importing Full WorldClim Dataset

1. Download WorldClim data:
   - Visit: https://www.worldclim.org/data/worldclim21.html
   - Download: BIO6 (Minimum temperature of coldest month)
   - Resolution: 2.5 or 5 minute

2. Extract temperature values using Python:

```python
import rasterio
import numpy as np

# Load WorldClim GeoTIFF
with rasterio.open('wc2.1_2.5m_bio_6.tif') as src:
    # Read temperature data
    temp_data = src.read(1)

    # Convert to Celsius (WorldClim is in °C * 10)
    temp_celsius = temp_data / 10.0

    # For each coordinate:
    lat, lon = 45.4642, 9.1900
    row, col = src.index(lon, lat)
    min_temp = temp_celsius[row, col]

    # Convert to zone using temperatureToZone() function
```

3. Bulk insert into database

## Example Zone Detection Results

### Milano, Italy
```
Input: "Milano, Italy"
Result:
  - Base Zone: 9a (City Database)
  - Microclimate: Urban Heat (+0.5)
  - Final Zone: 9a
  - Confidence: 99%
  - Source: Admin verified (Jelitto)
  - Factors: Urban Heat (+0.5)
```

### Generic Po Valley Coordinates (45.2°N, 9.5°E)
```
Input: 45.2, 9.5
Result:
  - Base Zone: 9a (Boundary Database)
  - Microclimate: None
  - Final Zone: 9a
  - Confidence: 94%
  - Source: Jelitto boundary data
```

### Ligurian Coast (44.0°N, 8.5°E)
```
Input: 44.0, 8.5
Result:
  - Base Zone: 9a (Boundary Database)
  - Microclimate: Coastal Moderation (+1.0)
  - Final Zone: 9b
  - Confidence: 93%
  - Source: Jelitto boundary data
  - Factors: Coastal Effect (+1.0)
```

### Unknown Small Village (45.5°N, 10.0°E)
```
Input: 45.5, 10.0
Result:
  - Base Zone: 8b (Fallback)
  - Microclimate: None
  - Final Zone: 8b
  - Confidence: 65%
  - Source: Estimated from coordinates
```

## API Usage

### Programmatic Zone Detection

```typescript
import { detectZonesFromAddress } from './lib/zoneDetection';

// Detect zone for an address
const result = await detectZonesFromAddress('Milano, Italy');

console.log(result);
// {
//   zones: ['9a'],
//   confidence: 0.99,
//   region: 'Milano',
//   source: 'admin_verified',
//   microclimateFactors: 'Urban Heat (+0.5)',
//   adjustments: [
//     { factor: 'admin_override', adjustment: 0, description: 'Admin-verified zone', confidence: 0.99 }
//   ]
// }
```

### Direct Microclimate Calculation

```typescript
import { calculateEnhancedZone } from './lib/microclimate';

// Calculate zone with microclimate adjustments
const result = await calculateEnhancedZone(
  '9a',           // base zone
  45.4642,        // latitude
  9.1900,         // longitude
  'Milano, Italy' // optional address for admin overrides
);

console.log(result);
// {
//   baseZone: '9a',
//   adjustedZone: '9a',
//   adjustments: [{ factor: 'urban_heat_island', adjustment: 0.5, ... }],
//   totalAdjustment: 0.5,
//   confidence: 0.92
// }
```

## Best Practices

### For Admin Users

1. **Verify Critical Locations First**
   - Add zone adjustments for your most queried cities
   - Include verification sources (Jelitto, USDA, local data)

2. **Define Microclimate Zones Carefully**
   - Use conservative adjustment values (0.3-0.5 zones)
   - Only define well-documented effects
   - Test with known locations before activating

3. **Regular Updates**
   - Review and update zones annually
   - Check for climate shifts
   - Add new cities as needed

### For Developers

1. **Always Check Confidence Scores**
   - High (≥90%): Trust fully
   - Good (75-89%): Generally reliable
   - Moderate (65-74%): Use with caution
   - Low (<65%): Consider manual verification

2. **Show Data Sources**
   - Display source to users (Admin verified, Jelitto, etc.)
   - Show microclimate adjustments applied
   - Provide confidence indicators

3. **Handle Edge Cases**
   - Mountain regions: elevation adjustments critical
   - Coastal areas: check for coastal moderation
   - City centers: consider urban heat island

## Maintenance

### Updating Zone Data

```sql
-- Update a verified zone
UPDATE zone_adjustments
SET adjusted_zone = '9a',
    adjustment_reason = 'Updated from 2024 Jelitto data',
    updated_at = now()
WHERE location_identifier = 'Milano, Italy';

-- Add a new microclimate factor
INSERT INTO microclimate_factors (
  location_name, latitude_min, latitude_max,
  longitude_min, longitude_max, factor_type,
  zone_adjustment, description
) VALUES (
  'New Urban Area', 45.0, 45.2, 9.0, 9.2,
  'urban_heat_island', 0.4,
  'Growing urban center with heat island effect'
);
```

### Database Backup

Regular backups recommended for:
- `zone_adjustments`
- `microclimate_factors`
- `climate_data_points`
- `city_hardiness_zones`

## Performance Considerations

- City lookups: O(1) with indexes
- Boundary checks: O(n) filtered by lat/lon
- Microclimate factors: O(m) where m is factors in area
- Overall: <100ms for most queries

## Future Enhancements

1. **Real-time Weather Data Integration**
   - Track actual minimum temperatures
   - Update zones based on climate trends

2. **Machine Learning Zone Prediction**
   - Train on known zones
   - Predict for unmapped areas

3. **User Feedback System**
   - Allow users to report incorrect zones
   - Crowd-source zone verification

4. **Automated WorldClim Import**
   - Direct GeoTIFF processing
   - Scheduled updates from WorldClim

5. **Mobile App Integration**
   - GPS-based zone detection
   - Offline zone database
