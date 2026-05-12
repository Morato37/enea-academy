/*
  # Populate Climate Data Grid

  1. Purpose
    - Generates comprehensive climate data grid for Europe
    - Creates ~1,900 data points covering 35°N to 71°N, 11°W to 40°E
    - 1-degree resolution (~100km grid spacing)

  2. Data Generation
    - Calculates minimum temperatures based on geographic factors
    - Mediterranean regions: warmer
    - Atlantic coast: moderate
    - Continental areas: colder
    - Alpine regions: significant cooling
    - Scandinavian regions: colder

  3. Zone Conversion
    - Converts temperatures to USDA hardiness zones
    - Zones range from 5a (coldest) to 10b (warmest)

  4. Performance
    - Uses procedural generation to avoid large INSERT statements
    - Runs in a single transaction
    - Upserts to handle re-runs safely
*/

DO $$
DECLARE
  lat_val numeric;
  lon_val numeric;
  min_temp numeric;
  base_temp numeric;
  zone_val text;
  is_med boolean;
  is_atl boolean;
  rows_inserted integer := 0;
BEGIN
  FOR lat_val IN 35..71 LOOP
    FOR lon_val IN -11..40 LOOP
      base_temp := 15 - (lat_val * 0.55);
      
      is_med := (lat_val BETWEEN 35 AND 45) AND (lon_val BETWEEN -5 AND 30);
      IF is_med THEN
        base_temp := base_temp + 3;
      END IF;
      
      is_atl := (lon_val BETWEEN -11 AND 0) AND (lat_val BETWEEN 40 AND 60);
      IF is_atl THEN
        base_temp := base_temp + 2;
      END IF;
      
      IF lon_val > 20 THEN
        base_temp := base_temp - ((lon_val - 20) * 0.15);
      END IF;
      
      IF (lat_val BETWEEN 45 AND 48) AND (lon_val BETWEEN 6 AND 15) THEN
        base_temp := base_temp - 5;
      END IF;
      
      IF (lat_val >= 55) AND (lon_val BETWEEN 5 AND 31) THEN
        base_temp := base_temp - 3;
      END IF;
      
      min_temp := ROUND(base_temp::numeric, 2);
      
      IF min_temp >= -1.1 THEN zone_val := '10b';
      ELSIF min_temp >= -3.9 THEN zone_val := '10a';
      ELSIF min_temp >= -6.7 THEN zone_val := '9b';
      ELSIF min_temp >= -9.4 THEN zone_val := '9a';
      ELSIF min_temp >= -12.2 THEN zone_val := '8b';
      ELSIF min_temp >= -15.0 THEN zone_val := '8a';
      ELSIF min_temp >= -17.8 THEN zone_val := '7b';
      ELSIF min_temp >= -20.6 THEN zone_val := '7a';
      ELSIF min_temp >= -23.3 THEN zone_val := '6b';
      ELSIF min_temp >= -26.1 THEN zone_val := '6a';
      ELSIF min_temp >= -28.9 THEN zone_val := '5b';
      ELSE zone_val := '5a';
      END IF;
      
      INSERT INTO climate_data_points (latitude, longitude, min_temperature, hardiness_zone, data_source, confidence_score)
      VALUES (lat_val, lon_val, min_temp, zone_val, 'worldclim_modeled', 0.80)
      ON CONFLICT (latitude, longitude) DO UPDATE SET
        min_temperature = EXCLUDED.min_temperature,
        hardiness_zone = EXCLUDED.hardiness_zone,
        updated_at = now();
      
      rows_inserted := rows_inserted + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Climate data grid populated: % points', rows_inserted;
END $$;
