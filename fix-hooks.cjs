const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = execSync('grep -rl "use" src/features/ src/hooks/').toString().split('\n').filter(Boolean);

for (const file of files) {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Remove is_deleted: { $eq: false }
  if (content.includes('is_deleted: { $eq: false }')) {
    content = content.replace(/is_deleted:\s*\{\s*\$eq:\s*false\s*\},?/g, '');
    changed = true;
  }

  // Remove sort: [...]
  if (content.includes('sort: [')) {
    content = content.replace(/,\s*sort:\s*\[.*?\]/gs, '');
    content = content.replace(/sort:\s*\[.*?\]\s*,?/gs, '');
    changed = true;
  }

  // Clean up empty selectors
  if (changed) {
    content = content.replace(/selector:\s*\{\s*\}/g, '');
    content = content.replace(/find\(\{\s*\}\)/g, 'find()');
    content = content.replace(/,\s*\}/g, '}');
    content = content.replace(/\{\s*,/g, '{');
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  }
}
