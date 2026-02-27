
import { db } from "./src/db";
import { users } from "./src/schema";
import { isNotNull } from "drizzle-orm";

async function checkLockedUsers() {
    try {
        const lockedUsers = await db
            .select()
            .from(users)
            .where(isNotNull(users.accountLockedUntil));

        console.log("Locked Users Count:", lockedUsers.length);
        if (lockedUsers.length > 0) {
            console.log(JSON.stringify(lockedUsers.map(u => ({ email: u.email, lockedUntil: u.accountLockedUntil })), null, 2));
        }
    } catch (e) {
        console.error("Error connecting to DB:", e);
    }
    process.exit(0);
}

checkLockedUsers();
