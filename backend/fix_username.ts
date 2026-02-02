import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUsername() {
    // Update the admin user's username from email to proper username
    const result = await prisma.user.update({
        where: { email: 'bisayadmin@gmail.com' },
        data: { username: 'bisayadmin' }
    });
    
    console.log('Updated user:', result.email, '-> username:', result.username);
}

fixUsername()
    .then(() => console.log('Done!'))
    .catch(console.error)
    .finally(() => prisma.$disconnect());
