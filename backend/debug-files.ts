
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- DEBUG START ---');

    // 1. Find User
    const user = await prisma.user.findUnique({ where: { username: 'bisay' } });
    console.log('User bisay ID:', user?.id);

    if (!user) return;

    // 2. Find Project
    const project = await prisma.project.findFirst({
        where: { slug: 'sssssss', ownerId: user.id }
    });
    console.log('Project "sssssss" ID:', project?.id);

    if (project) {
        const files = await prisma.fileNode.findMany({ where: { projectId: project.id } });
        console.log(`Files found in Project ${project.id}:`, files.length);
        files.forEach(f => console.log(` - ${f.name} (${f.id}) [Type: ${f.type}]`));
    } else {
        console.log('Project "sssssss" NOT FOUND directly via slug/owner.');
        // List all projects for user to see if there's a mismatch
        const allProjects = await prisma.project.findMany({ where: { ownerId: user.id } });
        console.log('All projects for bisay:', allProjects.map(p => ({ name: p.name, slug: p.slug, id: p.id })));
    }

    // 3. Check Ghost Files from User Logs
    console.log('\n--- GHOST FILE CHECK ---');
    const ghostIds = [
        'e6469f4d-53db-4613-a6f8-2fd9e41bd612',
        '0f2b4344-f1a3-4d27-bdbb-9e5eb3efd61d'
    ];

    for (const id of ghostIds) {
        const f = await prisma.fileNode.findUnique({ where: { id } });
        console.log(`Ghost File ${id}:`, f ? `FOUND (ProjectId: ${f.projectId})` : 'NOT FOUND');
        if (f && project && f.projectId !== project.id) {
            console.error(`Mismatch! File is attached to ${f.projectId} but Project is ${project.id}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
