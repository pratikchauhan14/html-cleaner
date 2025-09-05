import esbuild from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// Build function
async function build() {
  try {
    const context = await esbuild.context({
      entryPoints: [join(__dirname, 'src', 'main.js')],
      bundle: true,
      minify: isProduction,
      sourcemap: !isProduction,
      outfile: join(__dirname, 'dist', 'bundle.js'),
      target: ['es2020'],
      format: 'esm',
    });

    if (process.argv.includes('--watch')) {
      await context.watch();
      console.log('Watching for JavaScript changes...');
    } else {
      await context.rebuild();
      process.exit(0);
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
