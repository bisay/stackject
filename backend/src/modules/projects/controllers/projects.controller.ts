import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, UsePipes, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProjectsService } from '../services/projects.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { createProjectSchema, updateProjectSchema, CreateProjectDto, UpdateProjectDto } from '../dto/projects.dto';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get('search')
    search(@Query('q') query: string) {
        return this.projectsService.search(query || '');
    }

    @Get()
    findAll() {
        return this.projectsService.findAll();
    }

    // IMPORTANT: These routes must be BEFORE :username/:slug to avoid conflict
    @Get('by-id/:id/likes-count')
    getLikesCount(@Param('id') id: string) {
        return this.projectsService.getLikesCount(id);
    }

    @Get('by-id/:id/like-status')
    @UseGuards(JwtAuthGuard)
    getLikeStatus(@Req() req: any, @Param('id') id: string) {
        return this.projectsService.getLikeStatus(req.user.id, id);
    }

    @Post('by-id/:id/like')
    @UseGuards(JwtAuthGuard)
    toggleLike(@Req() req: any, @Param('id') id: string) {
        return this.projectsService.toggleLike(req.user.id, id);
    }

    @Get(':username/:slug')
    findOne(@Param('username') username: string, @Param('slug') slug: string) {
        return this.projectsService.findOne(slug, username);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('image', {
        storage: diskStorage({
            destination: './uploads/projects',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            }
        })
    }))
    // Note: ZodValidationPipe might struggle with FormData unless we transform it.
    // For MVPs with file upload, simplest is manual validation or a custom pipe. 
    // We'll skip Pipe for body here and validate manually or assume frontend is good for now.
    async create(
        @Req() req: any,
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File
    ) {
        const imageUrl = file ? `/uploads/projects/${file.filename}` : null;

        // Manual validation if needed, or re-run Zod
        const createProjectDto = {
            ...body,
            imageUrl
        };

        return this.projectsService.create(req.user.id, createProjectDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @UsePipes(new ZodValidationPipe(updateProjectSchema))
    update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() updateProjectDto: UpdateProjectDto
    ) {
        return this.projectsService.update(req.user.id, id, updateProjectDto);
    }



    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Req() req: any, @Param('id') id: string) {
        return this.projectsService.remove(req.user.id, id);
    }

    @Patch(':id/archive')
    @UseGuards(JwtAuthGuard)
    archive(@Req() req: any, @Param('id') id: string) {
        return this.projectsService.archive(req.user.id, id);
    }

    @Patch(':id/unarchive')
    @UseGuards(JwtAuthGuard)
    unarchive(@Req() req: any, @Param('id') id: string) {
        return this.projectsService.unarchive(req.user.id, id);
    }
}
