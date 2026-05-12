#!/bin/bash
# Split climate data into manageable batches

BATCH_SIZE=400
TOTAL_LINES=$(wc -l < climate_import.sql)
HEADER="INSERT INTO climate_data_points (latitude, longitude, min_temperature, hardiness_zone, data_source, confidence_score) VALUES"
FOOTER="ON CONFLICT (latitude, longitude) DO UPDATE SET min_temperature = EXCLUDED.min_temperature, hardiness_zone = EXCLUDED.hardiness_zone, updated_at = now();"

LINE_NUM=2  # Skip the first INSERT line
BATCH_NUM=1

while [ $LINE_NUM -lt $TOTAL_LINES ]; do
    echo "$HEADER" > "climate_batch_${BATCH_NUM}.sql"
    
    # Get batch lines, remove trailing comma from last line
    tail -n +${LINE_NUM} climate_import.sql | head -n ${BATCH_SIZE} | sed '$ s/,$//' >> "climate_batch_${BATCH_NUM}.sql"
    
    echo "$FOOTER" >> "climate_batch_${BATCH_NUM}.sql"
    
    echo "Created batch $BATCH_NUM (lines $LINE_NUM to $(($LINE_NUM + $BATCH_SIZE - 1)))"
    
    LINE_NUM=$(($LINE_NUM + $BATCH_SIZE))
    BATCH_NUM=$(($BATCH_NUM + 1))
done
