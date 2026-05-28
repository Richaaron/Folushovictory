const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Usage: node temp_dump_tags.js <path>');
  process.exit(1);
}
const content = fs.readFileSync(path, 'utf8');
const tplMatch = content.match(/<template>[\s\S]*?<\/template>/i);
if (!tplMatch) {
  console.error('No <template> block found');
  process.exit(1);
}
const tpl = tplMatch[0];
const regex = /<\/?([A-Za-z0-9_-]+)([^>]*)>/g;
const lines = tpl.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  let lineText = lines[i];
  let m;
  while ((m = regex.exec(lineText))) {
    const full = m[0];
    console.log(`${(i+1).toString().padStart(4,' ')} ${full.startsWith('</') ? 'CLOSE' : 'OPEN '} ${m[1]} ${full}`);
  }
}
