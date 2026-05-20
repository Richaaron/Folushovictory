import { assertConfig } from "../src/config.js";
import { SafeDatabase } from "../src/firestore-utils/index.js";

assertConfig();
const { data: classes } = await SafeDatabase.query("classes", [], { pageSize: 100 });
console.log(JSON.stringify(classes, null, 2));
process.exit(0);
