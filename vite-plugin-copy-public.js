import { copyFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

export default function copyPublicPlugin() {
  return {
    name: 'copy-public',
    writeBundle() {
      const copyDir = (src, dest) => {
        if (!existsSync(src)) {
          console.log(`Source directory does not exist: ${src}`);
          return;
        }

        mkdirSync(dest, { recursive: true });
        const entries = readdirSync(src);

        for (const entry of entries) {
          // Skip problematic files with spaces in names
          if (entry.includes('image copy')) {
            console.log(`Skipping locked file: ${entry}`);
            continue;
          }

          const srcPath = join(src, entry);
          const destPath = join(dest, entry);

          try {
            const stat = statSync(srcPath);
            if (stat.isDirectory()) {
              copyDir(srcPath, destPath);
            } else {
              // Ensure destination directory exists
              const destDir = dirname(destPath);
              if (!existsSync(destDir)) {
                mkdirSync(destDir, { recursive: true });
              }
              copyFileSync(srcPath, destPath);
              console.log(`Copied: ${entry}`);
            }
          } catch (err) {
            console.log(`Skipping ${entry}: ${err.message}`);
          }
        }
      };

      try {
        copyDir('public', 'dist');
        console.log('✓ Public files copied (excluding locked files)');
      } catch (err) {
        console.error('Error copying public files:', err);
      }
    }
  };
}
