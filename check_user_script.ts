
import 'dotenv/config';
import { db } from './src/db';
import { users } from './src/schema';
import { sql } from 'drizzle-orm';

async function checkUser() {
    const email = 'pbenissan@gmail.com';
    const normalizedEmail = email.toLowerCase().trim();

    console.log("🔍 Checking for user:", normalizedEmail);

    try {
        const userResult = await db
            .select()
            .from(users)
            .where(sql`trim(lower(${users.email})) = ${normalizedEmail}`)
            .limit(1);

        if (userResult.length > 0) {
            console.log("✅ User found in DB:");
            console.log(JSON.stringify(userResult[0], null, 2));
        } else {
            console.log("❌ User NOT found in database with email:", normalizedEmail);

            const countResult = await db.select({ count: sql<number>`count(*)` }).from(users);
            console.log(`📊 Total users in base: ${countResult[0]?.count || 0}`);

            const allUsers = await db.select().from(users).limit(10);
            console.log("Existing users in DB (first 10):", allUsers.map(u => u.email));
        }
    } catch (error) {
        console.error("🔥 Error connecting to DB:", error);
    }
}

checkUser().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
});
