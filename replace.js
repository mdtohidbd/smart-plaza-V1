const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(srcDir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('/api/contacts/companies')) {
    content = content.replace(/\/api\/contacts\/companies/g, '/api/suppliers');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
console.log('Replacement complete.');
