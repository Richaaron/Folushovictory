const fs = require('fs');
const path = 'frontend-vue/src/views/admin/MasterBroadsheet.vue';
const content = fs.readFileSync(path, 'utf8');
const tplMatch = content.match(/<template>[\s\S]*?<\/template>/i);
const tpl = tplMatch ? tplMatch[0] : content;
const regex = /<\/?([A-Za-z0-9_-]+)([^>]*)>/g;
let m;
while ((m = regex.exec(tpl))) {
  const full = m[0];
  const tag = m[1];
  const type = full.startsWith('</') ? 'CLOSE' : 'OPEN';
  const selfClosing = full.endsWith('/>');
  const line = tpl.slice(0, m.index).split('\n').length;
  if (tag === 'div' || tag === 'section' || tag === 'table' || tag === 'thead' || tag === 'tbody' || tag === 'tr' || tag === 'th' || tag === 'td' || tag === 'template') {
    console.log(`${line} ${type} ${tag} ${selfClosing ? 'SELF' : ''} ${full.replace(/\n/g,' ')} `);
  }
}
