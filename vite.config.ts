import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'custom-public-copy',
      apply: 'build',
      configResolved(config) {
        // Disable vite's default public dir copying during build
        config.publicDir = false;
      },
      closeBundle() {
        // Copy public files manually, excluding locked files
        import('fs').then(({ copyFileSync, readdirSync, statSync, mkdirSync, existsSync }) => {
          import('path').then(({ join, dirname }) => {
            const copyDir = (src, dest) => {
              if (!existsSync(src)) return;
              mkdirSync(dest, { recursive: true });
              const entries = readdirSync(src);

              for (const entry of entries) {
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
                    const destDir = dirname(destPath);
                    if (!existsSync(destDir)) {
                      mkdirSync(destDir, { recursive: true });
                    }
                    copyFileSync(srcPath, destPath);
                  }
                } catch (err) {
                  console.log(`Error copying ${entry}: ${err.message}`);
                }
              }
            };

            try {
              copyDir('public', 'dist');
              console.log('✓ Public files copied');
            } catch (err) {
              console.error('Error:', err);
            }
          });
        });
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: 'public',
});
