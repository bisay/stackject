/**
 * Script to update all existing project slugs to use dashes instead of spaces
 * Run with: npx ts-node fix_slugs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(text: string): string {
    if (!text) return '';
    
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function main() {
    console.log('🔧 Fixing project slugs...\n');

    const projects = await prisma.project.findMany({
        select: { id: true, slug: true, name: true, ownerId: true }
    });

    let updated = 0;
    let skipped = 0;

    for (const project of projects) {
        const newSlug = slugify(project.slug || project.name);
        
        if (newSlug === project.slug) {
            console.log(`⏭️  Skipped: "${project.name}" (slug already correct: ${project.slug})`);
            skipped++;
            continue;
        }

        // Check if new slug conflicts with another project from same owner
        let finalSlug = newSlug;
        let counter = 0;
        
        while (true) {
            const existing = await prisma.project.findFirst({
                where: {
                    slug: finalSlug,
                    ownerId: project.ownerId,
                    id: { not: project.id }
                }
            });
            
            if (!existing) break;
            
            counter++;
            finalSlug = `${newSlug}-${counter}`;
        }

        await prisma.project.update({
            where: { id: project.id },
            data: { slug: finalSlug }
        });

        console.log(`✅ Updated: "${project.name}"`);
        console.log(`   Old slug: ${project.slug}`);
        console.log(`   New slug: ${finalSlug}\n`);
        updated++;
    }

    console.log('\n📊 Summary:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${projects.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
