import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDiscussionDto } from '../dto/discussions.dto';
import { sanitizeHtml, sanitizeText } from '../../../common/utils/html-sanitizer';

@Injectable()
export class DiscussionsService {
    constructor(private prisma: PrismaService) { }

    async findAll(projectId?: string) {
        const where = projectId ? { projectId } : {};
        return this.prisma.discussion.findMany({
            where,
            include: {
                author: { select: { id: true, name: true, avatarUrl: true, username: true, role: true } },
                project: { select: { name: true, slug: true, owner: { select: { username: true } } } },
                mentions: {
                    include: {
                        project: {
                            select: { id: true, name: true, slug: true, description: true, imageUrl: true, owner: { select: { username: true } } }
                        }
                    }
                },
                comments: { select: { id: true } },
                likes: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const discussion = await this.prisma.discussion.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, avatarUrl: true, username: true, role: true } },
                project: { select: { name: true, slug: true, owner: { select: { username: true } } } },
                comments: {
                    include: {
                        author: { select: { id: true, name: true, avatarUrl: true, username: true, role: true } },
                        likes: true,
                        parent: {
                            include: { author: { select: { name: true, avatarUrl: true, username: true, role: true } } }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                mentions: {
                    include: {
                        project: {
                            select: { id: true, name: true, slug: true, description: true, imageUrl: true, owner: { select: { username: true } } }
                        }
                    }
                },
                likes: true,
            },
        });

        if (!discussion) throw new NotFoundException('Discussion not found');
        return discussion;
    }

    async toggleLike(userId: string, commentId: string) {
        const existing = await this.prisma.commentLike.findUnique({
            where: {
                userId_commentId: { userId, commentId }
            }
        });

        if (existing) {
            await this.prisma.commentLike.delete({
                where: { id: existing.id }
            });
            return { liked: false };
        } else {
            await this.prisma.commentLike.create({
                data: { userId, commentId }
            });
            return { liked: true };
        }
    }

    async toggleDiscussionLike(userId: string, discussionId: string) {
        const existing = await this.prisma.discussionLike.findUnique({
            where: {
                userId_discussionId: { userId, discussionId }
            }
        });

        if (existing) {
            await this.prisma.discussionLike.delete({
                where: { id: existing.id }
            });
            return { liked: false };
        } else {
            await this.prisma.discussionLike.create({
                data: { userId, discussionId }
            });
            return { liked: true };
        }
    }

    async create(userId: string, data: CreateDiscussionDto) {
        // Verify project exists if provided
        if (data.projectId) {
            const project = await this.prisma.project.findUnique({ where: { id: data.projectId } });
            if (!project) throw new NotFoundException('Project not found');
        }

        // SECURITY: Sanitize HTML content to prevent XSS
        const sanitizedContent = sanitizeHtml(data.content);
        const sanitizedTitle = sanitizeText(data.title);

        const discussion = await this.prisma.discussion.create({
            data: {
                title: sanitizedTitle,
                content: sanitizedContent,
                projectId: data.projectId, // Now optional
                authorId: userId,
                tags: data.tags || [],
            },
        });

        // Mention Logic
        // Regex to find: data-id="UUID" (Standard Tiptap)
        const mentionRegex = /data-id="([a-f0-9-]+)"/g;
        let match;
        const mentionedProjectIds = new Set<string>();

        while ((match = mentionRegex.exec(sanitizedContent)) !== null) {
            mentionedProjectIds.add(match[1]);
        }

        if (mentionedProjectIds.size > 0) {
            for (const projectId of Array.from(mentionedProjectIds)) {
                // Validate project existence and get owner
                const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true, ownerId: true, name: true } });

                if (project) {
                    // Create ProjectMention
                    await this.prisma.projectMention.create({
                        data: {
                            projectId: project.id,
                            discussionId: discussion.id,
                        }
                    });

                    // Notify Project Owner (if not self)
                    if (project.ownerId !== userId) {
                        await this.prisma.notification.create({
                            data: {
                                userId: project.ownerId,
                                type: 'MENTION',
                                message: `Your project "${project.name}" was mentioned in "${discussion.title}".`,
                                link: `/discussion/${discussion.id}`,
                            }
                        });
                    }
                }
            }
        }

        return discussion;
    }
    async addComment(userId: string, discussionId: string, content: string, parentId?: string) {
        const discussion = await this.prisma.discussion.findUnique({ where: { id: discussionId } });
        if (!discussion) throw new NotFoundException('Discussion not found');

        // Verify parent comment exists if provided
        if (parentId) {
            const parent = await this.prisma.comment.findUnique({ where: { id: parentId } });
            if (!parent) throw new NotFoundException('Parent comment not found');
        }

        // SECURITY: Sanitize HTML content to prevent XSS
        const sanitizedContent = sanitizeHtml(content);

        const comment = await this.prisma.comment.create({
            data: {
                content: sanitizedContent,
                discussionId,
                authorId: userId,
                parentId, // Optional threading
            },
        });

        // Notify Discussion Author (if not self)
        if (discussion.authorId !== userId) {
            await this.prisma.notification.create({
                data: {
                    userId: discussion.authorId,
                    type: 'REPLY',
                    message: `New reply on your discussion: "${discussion.title}"`,
                    link: `/discussion/${discussion.id}`,
                }
            });
        }

        return comment;
    }

    async remove(userId: string, id: string) {
        const discussion = await this.prisma.discussion.findUnique({ where: { id } });
        if (!discussion) throw new NotFoundException('Discussion not found');

        if (discussion.authorId !== userId) {
            // Check if admin? For now only owner.
            throw new NotFoundException('You are not the author of this discussion');
        }

        return this.prisma.discussion.delete({ where: { id } });
    }
}
