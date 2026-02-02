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
                const ext = file.originalname.split('.').pop();
                cb(null, `${uniqueSuffix}.${ext}`);
            }
        })
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
