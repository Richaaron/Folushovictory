import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();

async function run() {
  const { data: maimunaScores } = await SafeDatabase.query("scores", [["enteredBy", "==", "tch-2026-009"]], { pageSize: 1000 });
  const { data: patriciaScores } = await SafeDatabase.query("scores", [["enteredBy", "==", "tch-2026-013"]], { pageSize: 1000 });

  const { data: classes } = await SafeDatabase.query("classes", [], { pageSize: 100 });
  const { data: subjects } = await SafeDatabase.query("subjects", [], { pageSize: 1000 });

  console.log(`Maimuna Musa (tch-2026-009) has entered ${maimunaScores.length} scores total.`);
  const maimunaByClass = {};
  maimunaScores.forEach(s => {
    const clsName = classes.find(c => c.id === s.classId)?.name || s.classId;
    const subName = subjects.find(sub => sub.id === s.subjectId)?.name || s.subjectId;
    const key = `${clsName} - ${subName}`;
    if (!maimunaByClass[key]) maimunaByClass[key] = { total: 0, nonZero: 0 };
    maimunaByClass[key].total++;
    if (s.ca1 > 0 || s.ca2 > 0 || s.exam > 0) {
      maimunaByClass[key].nonZero++;
    }
  });
  console.log("Maimuna scores summary by class/subject:", JSON.stringify(maimunaByClass, null, 2));

  console.log(`\nPatricia Olofu (tch-2026-013) has entered ${patriciaScores.length} scores total.`);
  const patriciaByClass = {};
  patriciaScores.forEach(s => {
    const clsName = classes.find(c => c.id === s.classId)?.name || s.classId;
    const subName = subjects.find(sub => sub.id === s.subjectId)?.name || s.subjectId;
    const key = `${clsName} - ${subName}`;
    if (!patriciaByClass[key]) patriciaByClass[key] = { total: 0, nonZero: 0 };
    patriciaByClass[key].total++;
    if (s.ca1 > 0 || s.ca2 > 0 || s.exam > 0) {
      patriciaByClass[key].nonZero++;
    }
  });
  console.log("Patricia scores summary by class/subject:", JSON.stringify(patriciaByClass, null, 2));
}

run().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
