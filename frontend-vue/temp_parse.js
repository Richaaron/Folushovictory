const fs = require("fs");
const { parse } = require("@vue/compiler-dom");
const content = fs.readFileSync("src/views/admin/TeacherManagement.vue", "utf8");
const start = content.indexOf("<section class=\"admin-hero-card\"");
const end = content.indexOf("</section>", start);
const snippet = content.slice(start, end + 10);
console.log(snippet);
try {
  parse(snippet);
  console.log("snippet OK");
} catch (e) {
  console.error("ERR", e.message);
  if (e.loc) console.error("loc", JSON.stringify(e.loc));
}