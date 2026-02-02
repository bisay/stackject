
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { sanitizeHtml } from '../../../common/utils/html-sanitizer';

@Injectable()
export class MessagesService {
    constructor(private prisma: PrismaService) { }

    async sendMessage(senderId: string, receiverId: string, content: string, attachmentUrl?: string, attachmentType?: string) {
        // SECURITY: Sanitize HTML content to prevent XSS
        const sanitizedContent = sanitizeHtml(content);
        
        return this.prisma.message.create({
            data: {
                senderId,
                receiverId,
                content: sanitizedContent,
                attachmentUrl,
                attachmentType
            },
            include: {
                sender: { select: { id: true, username: true, name: true, avatarUrl: true } },
                receiver: { select: { id: true, username: true, name: true, avatarUrl: true } }
            }
        });
    }

    async getConversations(userId: string) {
        // Group messages to find unique conversation partners
        // This is complex with prisma group by, so we'll fetch recent messages and filter manually or use raw query.
        // For simplicity: specific query logic.
        // Fetch separate lists of sent and received, then uniqueify partners. (Not efficient for scale but ok for MVP)

        // Better: Get all messages involving user, distinct on partner. 
        // Prisma doesn't support 'distinct on' other fields easily with multiple conditions.

        // Simple strategy: Fetch all messages where user is sender OR receiver, order by createdAt desc.
        // Then client or service filters unique. Service is better.

        const messages = await this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, username: true, name: true, avatarUrl: true } },
                receiver: { select: { id: true, username: true, name: true, avatarUrl: true } }
            },
            // take: 50 // Limit 
        });

        const conversations = new Map();

        for (const msg of messages) {
            const partner = msg.senderId === userId ? msg.receiver : msg.sender;
            if (!conversations.has(partner.id)) {
                conversations.set(partner.id, {
                    partner,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            if (msg.receiverId === userId && !msg.read) {
                conversations.get(partner.id).unreadCount++;
            }
        }

        return Array.from(conversations.values());
    }

    async getMessages(userId: string, partnerId: string) {
        return this.prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: partnerId },
                    { senderId: partnerId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, username: true, name: true, avatarUrl: true } }
            }
        });
    }

    async markAsRead(userId: string, partnerId: string) {
        return this.prisma.message.updateMany({
            where: {
                senderId: partnerId,
                receiverId: userId,
                read: false
            },
            data: {
                read: true
            }
        });
    }
}
