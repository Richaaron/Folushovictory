const fs=require('fs');
const { parse } = require('@vue/compiler-sfc');
const files=['src/views/admin/TeacherManagement.vue','src/views/admin/StudentManagement.vue','src/views/admin/MasterBroadsheet.vue'];
for(const file of files){
  const source=fs.readFileSync(file,'utf8');
  const { errors }=parse(source,{filename:file});
  console.log('FILE '+file+' errors '+errors.length);
  for(const err of errors){
    console.log(err.message);
    if(err.loc) console.log(JSON.stringify(err.loc));
  }
}
