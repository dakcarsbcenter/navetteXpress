import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkEnums() {
    try {
        const enums = await db.execute(sql`SELECT typname FROM pg_type WHERE typtype = 'e'`);
        console.log('Existing enums:', enums.rows.map((r: any) => r.typname));
    } catch (error) {
        console.error('Error checking enums:', error);
    } finally {
        process.exit();
    }
}

checkEnums();
