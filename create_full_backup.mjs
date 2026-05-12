#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates a complete backup of all important tables that can be restored later
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createBackup() {
  console.log('🔄 Creating database backup...\n');

  const backup = {
    created_at: new Date().toISOString(),
    tables: {}
  };

  try {
    // Backup plants_flat
    console.log('📦 Backing up plants_flat...');
    const { data: plants, error: plantsError } = await supabase
      .from('plants_flat')
      .select('*')
      .order('id');

    if (plantsError) throw plantsError;
    backup.tables.plants_flat = plants;
    console.log(`✅ Backed up ${plants.length} plants`);

    // Backup plant_images
    console.log('📦 Backing up plant_images...');
    const { data: plantImages, error: imagesError } = await supabase
      .from('plant_images')
      .select('*')
      .order('plant_id, display_order');

    if (imagesError) throw imagesError;
    backup.tables.plant_images = plantImages;
    console.log(`✅ Backed up ${plantImages.length} plant images`);

    // Backup user_selections
    console.log('📦 Backing up user_selections...');
    const { data: selections, error: selectionsError } = await supabase
      .from('user_selections')
      .select('*');

    if (selectionsError) throw selectionsError;
    backup.tables.user_selections = selections;
    console.log(`✅ Backed up ${selections.length} user selections`);

    // Backup projects
    console.log('📦 Backing up projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*');

    if (projectsError) throw projectsError;
    backup.tables.projects = projects;
    console.log(`✅ Backed up ${projects.length} projects`);

    // Backup geocode_cache
    console.log('📦 Backing up geocode_cache...');
    const { data: geocode, error: geocodeError } = await supabase
      .from('geocode_cache')
      .select('*');

    if (geocodeError) throw geocodeError;
    backup.tables.geocode_cache = geocode;
    console.log(`✅ Backed up ${geocode.length} geocode entries`);

    // Save backup to file
    const filename = `database_backup_${new Date().toISOString().split('T')[0]}.json`;
    writeFileSync(filename, JSON.stringify(backup, null, 2));
    console.log(`\n✅ Backup created successfully: ${filename}`);
    console.log(`📊 Total size: ${(JSON.stringify(backup).length / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

createBackup();
