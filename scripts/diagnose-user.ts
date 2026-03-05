
import 'dotenv/config';
import { db } from './src/db';
import { users } from './src/schema';
import { sql } from 'drizzle-orm';

async function diagnoseUser(emailToFind: string) {
    const normalizedEmail = emailToFind.toLowerCase().trim();

    console.log(`🔍 DIAGNOSTIC UTILISATEUR : ${normalizedEmail}`);
    console.log(`📡 URL Base de données : ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0]}`);

    try {
        // 1. Recherche exacte
        const exactMatch = await db
            .select()
            .from(users)
            .where(sql`email = ${emailToFind}`)
            .limit(1);

        // 2. Recherche insensible à la casse
        const caseInsensitiveMatch = await db
            .select()
            .from(users)
            .where(sql`lower(email) = ${normalizedEmail}`)
            .limit(1);

        // 3. Recherche floue
        const partialMatch = await db
            .select()
            .from(users)
            .where(sql`email ILIKE ${'%' + normalizedEmail.split('@')[0] + '%'}`)
            .limit(5);

        if (exactMatch.length > 0) {
            console.log("✅ Match EXACT trouvé !");
            console.log(JSON.stringify(exactMatch[0], (k, v) => k === 'password' ? '***' : v, 2));
        } else if (caseInsensitiveMatch.length > 0) {
            console.log("⚠️ Match INSENSIBLE À LA CASSE trouvé !");
            console.log(`Email en base: ${caseInsensitiveMatch[0].email}`);
            console.log(JSON.stringify(caseInsensitiveMatch[0], (k, v) => k === 'password' ? '***' : v, 2));
        } else {
            console.log("❌ Aucun utilisateur ne correspond exactement.");
            if (partialMatch.length > 0) {
                console.log("💡 Utilisateurs suggérés par correspondance partielle :");
                console.table(partialMatch.map(m => ({ email: m.email, role: m.role, isActive: m.isActive })));
            } else {
                console.log("😭 Aucune suggestion trouvée non plus.");
            }
        }

        const count = await db.select({ total: sql<number>`count(*)` }).from(users);
        console.log(`📊 Nombre total d'utilisateurs en base: ${count[0].total}`);

    } catch (error) {
        console.error("🔥 ERREUR CRITIQUE :");
        console.error(error);
    }
}

const target = process.argv[2] || 'pbenissan@gmail.com';
diagnoseUser(target).then(() => process.exit(0));
