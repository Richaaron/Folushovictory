import { SafeDatabase } from '../src/firestore-utils/index.js';

const username = process.argv[2];
if (!username) {
  console.error('Usage: node scripts/getUser.js <username>');
  process.exit(1);
}

(async () => {
  try {
    const user = await SafeDatabase.getById('users', String(username).toLowerCase().trim());
    console.log(JSON.stringify(user, null, 2));
  } catch (err) {
    console.error('Error fetching user:', err?.message || err);
    process.exit(2);
  }
})();
