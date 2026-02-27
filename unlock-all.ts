
import "dotenv/config";
import { db } from "./src/db";
import { users } from "./src/schema";
import { isNotNull } from "drizzle-orm";

async function unlockAll() {
    try {
        console.log("Connecting to database...");
        const result = await db
            .update(users)
            .set({
                loginAttempts: 0,
                accountLockedUntil: null,
                lastFailedLogin: null,
                updatedAt: new Date()
            })
            .where(isNotNull(users.accountLockedUntil));

        console.log("Unlocked users successfully.");
    } catch (e) {
        console.error("Error unlocking users:", e);
    }
    process.exit(0);
}

unlockAll();
