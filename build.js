const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

const srcDir = path.join(__dirname, 'src');
const pagesDir = path.join(srcDir, 'pages');

const env = nunjucks.configure(srcDir, { autoescape: false, trimBlocks: true });

fs.readdirSync(pagesDir)
  .filter(f => f.endsWith('.njk'))
  .forEach(file => {
    const out = env.render(`pages/${file}`);
    const outPath = path.join(__dirname, file.replace(/\.njk$/, '.html'));
    fs.writeFileSync(outPath, out, 'utf8');
  });
