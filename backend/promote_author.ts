
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const title = "ini cuma tes wkw";
    console.log(`Searching for discussion: "${title}"...`);

    const discussion = await prisma.discussion.findFirst({
        where: { title: { contains: "tes" } }, // Vague search to match
        include: { author: true }
    });

    if (!discussion) {
        console.error("Discussion not found!");
        // Fallback: Check if there is a 'bisay' user effectively?
        // Let's try to promote 'bisay' just in case if discussion search fails?
        // No, let's list all discussions to be sure.
        const allDiscussions = await prisma.discussion.findMany({ select: { title: true } });
        console.log("Available titles:", allDiscussions.map(d => d.title));
        process.exit(1);
    }

    console.log(`Found discussion: "${discussion.title}"`);
    console.log(`Author: ${discussion.author.username} (ID: ${discussion.author.id})`);
    console.log(`Current Role: ${discussion.author.role}`);

    if (discussion.author.role === 'ADMIN') {
        console.log("User is ALREADY an Admin.");
    } else {
        console.log("Promoting to ADMIN...");
        await prisma.user.update({
            where: { id: discussion.author.id },
            data: { role: 'ADMIN' }
        });
        console.log("Done! User is now ADMIN.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
