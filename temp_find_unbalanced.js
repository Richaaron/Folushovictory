const fs = require('fs');
const path = require('path');
const files = [
  'frontend-vue/src/views/admin/TeacherManagement.vue',
  'frontend-vue/src/views/admin/StudentManagement.vue',
  'frontend-vue/src/views/admin/MasterBroadsheet.vue'
];
const selfClosing = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const tplMatch = content.match(/<template>[\s\S]*?<\/template>/i);
  if (!tplMatch) {
    console.log(file + ' - no template found');
    continue;
  }
  const tpl = tplMatch[0];
  const regex = /<\/?([A-Za-z0-9_-]+)([^>]*)>/g;
  const stack = [];
  const errors = [];
  let match;
  while ((match = regex.exec(tpl))) {
    const full = match[0];
    const tag = match[1];
    const isClose = full.startsWith('</');
    const isSelf = full.endsWith('/>') || selfClosing.has(tag.toLowerCase());
    const line = tpl.slice(0, match.index).split('\n').length;
    if (isClose) {
      if (stack.length === 0) {
        errors.push({ line, msg: `closing without opening </${tag}>` });
      } else {
        const top = stack[stack.length - 1];
        if (top.tag === tag) {
          stack.pop();
        } else {
          errors.push({ line, msg: `expected </${top.tag}> but found </${tag}>` });
          let found = false;
          for (let i = stack.length - 2; i >= 0; i--) {
            if (stack[i].tag === tag) {
              stack.splice(i);
              found = true;
              break;
            }
          }
          if (!found) {
            // ignore to continue parsing
          }
        }
      }
    } else if (!isSelf) {
      stack.push({ tag, line, full });
    }
  }
  console.log('====', file, '====');
  console.log('unclosed stack:', stack.map(x => `${x.tag}@${x.line}`));
  console.log('errors:', errors);
}
