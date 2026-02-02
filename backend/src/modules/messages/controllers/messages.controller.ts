
import { Controller, Get, Post, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { MessagesService } from '../services/messages.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Allowed file types for message attachments
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf', 'text/plain',
    'application/zip', 'application/x-zip-compressed'
];

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post()
    async sendMessage(@Req() req: any, @Body() body: { receiverId: string; content: string; attachmentUrl?: string; attachmentType?: string }) {
        return this.messagesService.sendMessage(req.user.id, body.receiverId, body.content, body.attachmentUrl, body.attachmentType);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = join(process.cwd(), 'uploads', 'messages');
                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                // Sanitize filename
                const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
                const ext = safeName.split('.').pop();
                cb(null, `${uniqueSuffix}.${ext}`);
            }
        }),
        limits: {
            fileSize: 25 * 1024 * 1024, // 25MB max for message attachments
        },
        fileFilter: (req, file, cb) => {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return cb(new Error('File type not allowed. Allowed: images, videos, PDF, text, zip'), false);
            }
            cb(null, true);
        }
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        return { url: `/uploads/messages/${file.filename}`, type: file.mimetype };
    }

    @Get('conversations')
    async getConversations(@Req() req: any) {
        return this.messagesService.getConversations(req.user.id);
    }

    @Get(':partnerId')
    async getMessages(@Req() req: any, @Param('partnerId') partnerId: string) {
        return this.messagesService.getMessages(req.user.id, partnerId);
    }

    @Post(':partnerId/read')
    async markAsRead(@Req() req: any, @Param('partnerId') partnerId: string) {
        return this.messagesService.markAsRead(req.user.id, partnerId);
    }
}
