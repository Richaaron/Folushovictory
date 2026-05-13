import { assertConfig } from '../src/config.js';
import { getFirebaseApp, getDb } from '../src/firebase.js';

assertConfig();
getFirebaseApp();
const db = getDb();

const collections = [
  'students',
  'classes',
  'subjects',
  'users',
  'assignments',
  'scores',
  'remarks',
  'publishes',
  'releases',
  'termMeta',
  'config',
  'counters'
];

for (const collection of collections) {
  try {
    const snap = await db.collection(collection).get();
    console.log(`${collection}: ${snap.size}`);
  } catch (err) {
    console.error(`Failed to inspect ${collection}:`, err.message || err);
  }
}
