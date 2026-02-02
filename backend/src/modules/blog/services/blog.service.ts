import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateArticleDto } from '../dto/blog.dto';
import { sanitizeHtml, sanitizeText } from '../../../common/utils/html-sanitizer';

@Injectable()
export class BlogService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.article.findMany({
            where: { published: true },
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(slug: string) {
        const article = await this.prisma.article.findUnique({
            where: { slug },
            include: { author: { select: { name: true } } },
        });
        if (!article) throw new NotFoundException('Article not found');
        return article;
    }

    async create(userId: string, data: CreateArticleDto) {
        // Destructure to separate scalar fields from relations
        const { projectId, ...articleData } = data;

        // SECURITY: Sanitize HTML/text content to prevent XSS
        return this.prisma.article.create({
            data: {
                title: sanitizeText(articleData.title),
                slug: sanitizeText(articleData.slug),
                content: sanitizeHtml(articleData.content),
                published: articleData.published,
                author: {
                    connect: { id: userId },
                },
                // Only connect project if projectId is provided
                ...(projectId ? {
                    project: {
                        connect: { id: projectId },
                    },
                } : {}),
            },
        });
    }
}
