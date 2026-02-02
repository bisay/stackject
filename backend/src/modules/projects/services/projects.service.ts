import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from '../dto/projects.dto';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import { sanitizeText } from '../../../common/utils/html-sanitizer';
import { slugify } from '../../../common/utils/slugify';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.project.findMany({
            where: { status: { not: 'archived' }, visibility: 'public' },
            include: { owner: { select: { id: true, name: true, username: true, role: true } as any } },
        });
    }

    async search(query: string) {
        if (!query) {
            return this.prisma.project.findMany({
                where: { status: 'active', visibility: 'public' },
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, slug: true, imageUrl: true }
            });
        }

        return this.prisma.project.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { slug: { contains: query, mode: 'insensitive' } },
                ],
                status: 'active',
                visibility: 'public'
            },
            take: 5,
            select: { id: true, name: true, slug: true, imageUrl: true }
        });
    }

    async findOne(slug: string, username?: string) {
        const where: any = { slug };
        if (username) {
            where.owner = { username };
        }

        const project = await this.prisma.project.findFirst({
            where,
            include: {
                owner: { select: { id: true, name: true, username: true, role: true } as any },
                _count: { select: { discussions: true, followers: true } }
            },
        });

        if (!project) throw new NotFoundException('Project not found');
        return project;
    }

    async create(userId: string, data: CreateProjectDto) {
        // Generate proper slug from name or provided slug
        const baseSlug = data.slug || data.name;
        const projectSlug = slugify(baseSlug);

        if (!projectSlug) {
            throw new ForbiddenException('Invalid project name/slug');
        }

        // Check slug availability for this user
        const existing = await this.prisma.project.findFirst({
            where: {
                slug: projectSlug,
                ownerId: userId
            }
        });

        if (existing) throw new ForbiddenException('You already have a project with this slug');

        // SECURITY: Sanitize text inputs to prevent XSS
        return this.prisma.project.create({
            data: {
                name: sanitizeText(data.name),
                slug: projectSlug,
                description: sanitizeText(data.description || ''),
                repoUrl: data.repoUrl || null,
                demoUrl: data.demoUrl || null,
                // Handle tags: if it's a string, split it. If array (from Zod transform), use it. 
                // Since Zod schema above says string, let's assume raw string for now and split here if needed, 
                // OR we'll change Zod to accept array if we parse JSON in controller.
                // For simplicity, let's say UI sends "React,Nest" string.
                tags: (data.tags as any)?.split(',').map((t: string) => t.trim()).filter((t: string) => t) || [],
                visibility: data.visibility || 'public',
                imageUrl: (data as any).imageUrl || null, // Passed from controller
                status: 'active',
                owner: {
                    connect: { id: userId }
                }
            },
        });
    }

    async update(userId: string, id: string, data: UpdateProjectDto) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');

        if (project.ownerId !== userId) {
            throw new ForbiddenException('You are not the owner of this project');
        }

        // SECURITY: Sanitize text inputs to prevent XSS
        const updateData: any = {};
        if (data.name) updateData.name = sanitizeText(data.name);
        if (data.description) updateData.description = sanitizeText(data.description);
        if (data.repoUrl) updateData.repoUrl = data.repoUrl;
        if (data.demoUrl) updateData.demoUrl = data.demoUrl;
        if (data.visibility) updateData.visibility = data.visibility;
        
        // Transform tags if present
        if (typeof data.tags === 'string') {
            updateData.tags = (data.tags as string).split(',').map((t: string) => sanitizeText(t.trim())).filter((t: string) => t);
        } else if (Array.isArray(data.tags)) {
            updateData.tags = (data.tags as string[]).map((t: string) => sanitizeText(t)).filter((t: string) => t);
        }

        return this.prisma.project.update({
            where: { id },
            data: updateData,
        });
    }

    async remove(userId: string, id: string) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');

        if (project.ownerId !== userId) {
            throw new ForbiddenException('You are not the owner of this project');
        }

        // Clean up physical file storage
        const projectUploadPath = join(process.cwd(), 'uploads', 'users', userId, id);
        try {
            if (existsSync(projectUploadPath)) {
                rmSync(projectUploadPath, { recursive: true, force: true });
            }
        } catch (error) {
            console.error(`Failed to delete project files at ${projectUploadPath}:`, error);
            // We continue to delete the DB record even if file cleanup fails, 
            // but logging it is important.
        }

        return this.prisma.project.delete({
            where: { id },
        });
    }

    async archive(userId: string, id: string) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');

        if (project.ownerId !== userId) {
            throw new ForbiddenException('You are not the owner of this project');
        }

        return this.prisma.project.update({
            where: { id },
            data: { status: 'archived', visibility: 'private' }
        });
    }
    async unarchive(userId: string, id: string) {
        const project = await this.prisma.project.findUnique({ where: { id } });
        if (!project) throw new NotFoundException('Project not found');

        if (project.ownerId !== userId) {
            throw new ForbiddenException('You are not the owner of this project');
        }

        return this.prisma.project.update({
            where: { id },
            data: { status: 'active', visibility: 'public' }
        });
    }

    async toggleLike(userId: string, projectId: string) {
        const existingLike = await this.prisma.projectLike.findUnique({
            where: { userId_projectId: { userId, projectId } }
        });

        if (existingLike) {
            await this.prisma.projectLike.delete({
                where: { id: existingLike.id }
            });
        } else {
            await this.prisma.projectLike.create({
                data: { userId, projectId }
            });
        }

        // Get updated count
        const count = await this.prisma.projectLike.count({
            where: { projectId }
        });

        return { liked: !existingLike, count };
    }

    async getLikeStatus(userId: string, projectId: string) {
        const like = await this.prisma.projectLike.findUnique({
            where: { userId_projectId: { userId, projectId } }
        });
        return { liked: !!like };
    }

    async getLikesCount(projectId: string) {
        const count = await this.prisma.projectLike.count({
            where: { projectId }
        });
        return { count };
    }
}
