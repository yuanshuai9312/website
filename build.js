const fs = require('fs/promises');
const path = require('path');
const nunjucks = require('nunjucks');

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');
const distDir = path.join(__dirname, 'dist');

nunjucks.configure(srcDir, { autoescape: true });

async function build() {
  await fs.mkdir(distDir, { recursive: true });
  const files = await fs.readdir(pagesDir);
  for (const file of files) {
    if (file.endsWith('.njk')) {
      const out = nunjucks.render(path.join('pages', file));
      const outPath = path.join(distDir, file.replace(/\.njk$/, '.html'));
      await fs.writeFile(outPath, out, 'utf8');
    }
  }
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
