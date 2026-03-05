
import 'dotenv/config';
import { db } from './src/db';
import { users } from './src/schema';
import { sql } from 'drizzle-orm';

async function listUsers() {
    try {
        const allUsers = await db.select().from(users);
        console.log(`📊 Total users in base: ${allUsers.length}`);
        console.log("Check for 'pbenissan':", allUsers.filter(u => u.email.includes('pbenissan')).map(u => u.email));
        console.log("Existing users in DB:", allUsers.map(u => u.email).join(', '));
    } catch (error) {
        console.error("🔥 Error connecting to DB:", error);
    }
}

listUsers().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
});
