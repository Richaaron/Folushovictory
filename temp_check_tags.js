const fs = require('fs');
const path = 'frontend-vue/src/views/admin/MasterBroadsheet.vue';
const content = fs.readFileSync(path, 'utf8');
const m = content.match(/<template>[\s\S]*?<\/template>/i);
const tpl = m ? m[0] : content;
const regex = /<\/?([A-Za-z0-9_-]+)([^>]*)>/g;
const selfClosing = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
let stack = [];
let errors = [];
let match;
while ((match = regex.exec(tpl))) {
  const full = match[0];
  const tag = match[1];
  const isClose = full.startsWith('</');
  const isSelf = full.endsWith('/>') || selfClosing.has(tag.toLowerCase());
  const line = tpl.slice(0, match.index).split('\n').length;
  if (isClose) {
    if (stack.length === 0) {
      errors.push([line, 'closing without opening', tag]);
    } else {
      const top = stack[stack.length - 1];
      if (top.tag === tag) {
        stack.pop();
      } else {
        errors.push([line, `expected </${top.tag}> but found </${tag}>`, tag]);
        let found = false;
        for (let i = stack.length - 2; i >= 0; i--) {
          if (stack[i].tag === tag) {
            stack = stack.slice(0, i);
            found = true;
            break;
          }
        }
      }
    }
  } else if (!isSelf) {
    stack.push({ tag, line });
  }
}
console.log('unclosed', stack);
console.log('errors', errors);
