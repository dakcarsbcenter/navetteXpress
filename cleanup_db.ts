import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function cleanup() {
    try {
        await db.execute(sql`DROP TYPE IF EXISTS ad_placement, ad_status, ad_type CASCADE`);
        console.log('Enums dropped');
        await db.execute(sql`DROP TABLE IF EXISTS advertisements CASCADE`);
        console.log('Table dropped');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        process.exit();
    }
}

cleanup();
