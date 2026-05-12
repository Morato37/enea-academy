#!/usr/bin/env node

/**
 * Database Restore Script
 * Restores a database backup created by create_full_backup.mjs
 *
 * Usage: node restore_backup.mjs <backup-file.json>
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function restoreBackup(backupFile) {
  console.log(`🔄 Restoring database from ${backupFile}...\n`);

  try {
    // Read backup file
    const backup = JSON.parse(readFileSync(backupFile, 'utf8'));
    console.log(`📅 Backup created: ${backup.created_at}\n`);

    // Restore plants_flat
    if (backup.tables.plants_flat) {
      console.log('📦 Restoring plants_flat...');
      const plants = backup.tables.plants_flat;

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < plants.length; i += batchSize) {
        const batch = plants.slice(i, i + batchSize);
        const { error } = await supabase
          .from('plants_flat')
          .upsert(batch, { onConflict: 'id' });

        if (error) throw error;
        console.log(`  ✅ Restored ${Math.min(i + batchSize, plants.length)}/${plants.length} plants`);
      }
    }

    // Restore plant_images
    if (backup.tables.plant_images) {
      console.log('📦 Restoring plant_images...');
      const images = backup.tables.plant_images;

      const { error } = await supabase
        .from('plant_images')
        .upsert(images, { onConflict: 'id' });

      if (error) throw error;
      console.log(`✅ Restored ${images.length} plant images`);
    }

    // Restore projects
    if (backup.tables.projects) {
      console.log('📦 Restoring projects...');
      const projects = backup.tables.projects;

      const { error } = await supabase
        .from('projects')
        .upsert(projects, { onConflict: 'id' });

      if (error) throw error;
      console.log(`✅ Restored ${projects.length} projects`);
    }

    // Restore user_selections
    if (backup.tables.user_selections) {
      console.log('📦 Restoring user_selections...');
      const selections = backup.tables.user_selections;

      const { error } = await supabase
        .from('user_selections')
        .upsert(selections, { onConflict: 'id' });

      if (error) throw error;
      console.log(`✅ Restored ${selections.length} user selections`);
    }

    // Restore geocode_cache
    if (backup.tables.geocode_cache) {
      console.log('📦 Restoring geocode_cache...');
      const geocode = backup.tables.geocode_cache;

      const { error } = await supabase
        .from('geocode_cache')
        .upsert(geocode, { onConflict: 'id' });

      if (error) throw error;
      console.log(`✅ Restored ${geocode.length} geocode entries`);
    }

    console.log('\n✅ Database restored successfully!');

  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

// Get backup file from command line
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Please provide a backup file: node restore_backup.mjs <backup-file.json>');
  process.exit(1);
}

restoreBackup(backupFile);
