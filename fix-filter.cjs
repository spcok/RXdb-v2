const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('grep -rl "use" src/features/ src/hooks/').toString().split('\n').filter(Boolean);

for (const file of files) {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace docs.map(...) with docs.map(...).filter(d => !d.is_deleted)
  // Only if it doesn't already have filter(d => !d.is_deleted)
  const mapRegex = /docs\.map\(([^)]+)\s*=>\s*([^)]+)\.toJSON\(\)([^)]*)\)/g;
  content = content.replace(mapRegex, (match, param, obj, cast) => {
    if (content.includes('.filter(')) return match; // Skip if already filtering
    changed = true;
    return `${match}.filter(d => !d.is_deleted)`;
  });

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Added filter to ${file}`);
  }
}
