import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UsePipes, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DiscussionsService } from '../services/discussions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { createDiscussionSchema, CreateDiscussionDto } from '../dto/discussions.dto';

@Controller('discussions')
export class DiscussionsController {
    constructor(private readonly discussionsService: DiscussionsService) { }

    @Get()
    findAll(@Query('projectId') projectId?: string) {
        return this.discussionsService.findAll(projectId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.discussionsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UsePipes(new ZodValidationPipe(createDiscussionSchema))
    create(@Req() req: any, @Body() createDiscussionDto: CreateDiscussionDto) {
        return this.discussionsService.create(req.user.id, createDiscussionDto);
    }

    @Post(':id/comments')
    @UseGuards(JwtAuthGuard)
    addComment(@Req() req: any, @Param('id') id: string, @Body() body: { content: string, parentId?: string }) {
        return this.discussionsService.addComment(req.user.id, id, body.content, body.parentId);
    }

    @Post('comments/:id/like')
    @UseGuards(JwtAuthGuard)
    toggleLike(@Req() req: any, @Param('id') id: string) {
        return this.discussionsService.toggleLike(req.user.id, id);
    }

    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    toggleDiscussionLike(@Req() req: any, @Param('id') id: string) {
        return this.discussionsService.toggleDiscussionLike(req.user.id, id);
    }

    @Post('upload-image')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req: any, file, cb) => {
                const uploadPath = join(process.cwd(), 'uploads', 'community');
                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                // Sanitize extension
                const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
                cb(null, `${uniqueSuffix}.${ext}`);
            }
        }),
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB max for images
        },
        fileFilter: (req, file, cb) => {
            // Only allow images
            const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedMimes.includes(file.mimetype)) {
                return cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
            }
            // Block dangerous extensions hidden in filename
            const blockedExts = ['.exe', '.bat', '.cmd', '.sh', '.php', '.jsp', '.js', '.html', '.htm'];
            const nameLower = file.originalname.toLowerCase();
            if (blockedExts.some(ext => nameLower.includes(ext))) {
                return cb(new Error('Invalid file type'), false);
            }
            cb(null, true);
        }
    }))
    uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');
        // Return public URL (assuming ServeStatic is set to /uploads)
        return { url: `/uploads/community/${file.filename}` };
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Req() req: any, @Param('id') id: string) {
        return this.discussionsService.remove(req.user.id, id);
    }
}
