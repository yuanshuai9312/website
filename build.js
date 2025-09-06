const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');

nunjucks.configure(srcDir, { autoescape: true });

fs.readdirSync(pagesDir)
  .filter(f => f.endsWith('.njk'))
  .forEach(file => {
    const out = nunjucks.render(path.join('pages', file));
    const outPath = path.join(__dirname, file.replace(/\.njk$/, '.html'));
    fs.writeFileSync(outPath, out, 'utf8');
  });
