
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const username = 'bisaymayorccasuhendra'; // Hardcoded based on user request/screenshot
    console.log(`Promoting user @${username} to ADMIN...`);

    try {
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            console.error(`User @${username} not found!`);
            // Try searching by similar name just in case? No, strict.
            process.exit(1);
        }

        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
        });

        console.log(`Success! User @${updated.username} is now an ADMIN.`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
