import { Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// No file type restrictions - allow all files
const BLOCKED_EXTENSIONS: string[] = [];

@Controller('files')
export class FilesController {
    constructor(private readonly filesService: FilesService) { }

    @Get('projects/:projectId')
    async getFiles(@Param('projectId') projectId: string, @Query('parent') parent: string, @Req() req: any) {
        // Simple passthrough, no complex auth checks causing crash
        console.log(`📂 Get Files for Project: ${projectId}, Parent: ${parent || 'root'}`);
        return this.filesService.getProjectFiles(projectId, parent);
    }

    @Post('projects/:projectId/upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req: any, file, cb) => {
                // Ensure request is authenticated
                if (!req.user || !req.user.id) {
                    return cb(new Error('User not authenticated in upload'), '');
                }
                const userId = req.user.id;
                const projectId = req.params?.projectId || req.query?.projectId || 'unknown-project';
                const uploadPath = join(process.cwd(), 'uploads', 'users', userId, projectId);
                if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                // Sanitize filename to prevent path traversal
                const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
                cb(null, `${uniqueSuffix}-${safeName}`);
            }
        }),
        limits: {
            fileSize: 500 * 1024 * 1024, // 500MB max per file
        },
        fileFilter: (req, file, cb) => {
            // Block dangerous file extensions
            const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase();
            if (BLOCKED_EXTENSIONS.includes(ext)) {
                return cb(new Error(`File type ${ext} is not allowed for security reasons`), false);
            }
            cb(null, true);
        }
    }))
    async uploadFile(
        @Param('projectId') projectId: string,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any,
        @Body() body: { filePath?: string, description?: string, replaceMode?: string }
    ) {
        if (!file) throw new BadRequestException('No file uploaded');
        const path = body.filePath || file.originalname;
        const userId = req.user?.id;
        return this.filesService.uploadFile(projectId, file, path, {
            userId,
            description: body.description,
            replaceMode: body.replaceMode // 'replace', 'keep-both', or undefined (check first)
        });
    }

    @Get('projects/:projectId/check-duplicate')
    @UseGuards(JwtAuthGuard)
    async checkDuplicate(
        @Param('projectId') projectId: string,
        @Query('filePath') filePath: string
    ) {
        return this.filesService.checkDuplicateFile(projectId, filePath);
    }

    @Get('projects/:projectId/change-logs')
    async getChangeLogs(
        @Param('projectId') projectId: string,
        @Query('limit') limit?: string
    ) {
        return this.filesService.getChangeLogs(projectId, limit ? parseInt(limit) : 50);
    }

    @Get('projects/:projectId/:fileId/content')
    async getContent(
        @Param('projectId') projectId: string,
        @Param('fileId') fileId: string
    ) {
        return this.filesService.getFileContent(fileId);
    }

    @Post('projects/:projectId/files/directory')
    async handleDirectory(
        @Param('projectId') projectId: string,
        @Body() body: { name?: string, path?: string, parentId?: string }
    ) {
        console.log(`🟡 [DIR] Request received. ProjectId: ${projectId}`);
        try {
            const parentId = (body.path === '/' || !body.path) ? null : body.path;

            // LIST FILES
            if (body.path && body.name === undefined) {
                return this.filesService.getProjectFiles(projectId, parentId || undefined);
            }

            // CREATE DIRECTORY - Open creation for now as per "Revert" request
            if (typeof body.name === 'string' && body.name.trim() !== '') {
                return this.filesService.createDirectory(projectId, body.name.trim(), body.parentId || parentId || undefined);
            }
            throw new BadRequestException('Invalid directory payload.');
        } catch (error) {
            throw error;
        }
    }
    @Get('projects/:projectId/download')
    @UseGuards(OptionalJwtAuthGuard)
    async downloadProject(
        @Param('projectId') projectId: string,
        @Req() req: any,
        @Res() res: Response
    ) {
        // Check if user is logged in
        const userId = req.user?.id;
        if (!userId) {
            // Redirect to login page with return URL
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const returnUrl = encodeURIComponent(req.originalUrl);
            return res.redirect(`${frontendUrl}/login?message=login_required&returnUrl=${returnUrl}`);
        }
        
        // Track the download
        await this.filesService.trackDownload(projectId, userId);
        return this.filesService.downloadProjectZip(projectId, res);
    }

    @Get('projects/:projectId/downloads')
    async getProjectDownloads(
        @Param('projectId') projectId: string,
        @Query('limit') limit?: string
    ) {
        return this.filesService.getProjectDownloads(projectId, limit ? parseInt(limit) : 50);
    }

    @Get('projects/:projectId/:fileId/download')
    async downloadSingleFile(
        @Param('fileId') fileId: string,
        @Res() res: Response
    ) {
        return this.filesService.downloadFileStream(fileId, res);
    }

    @Get('projects/:projectId/:fileId/raw')
    async serveRawFile(
        @Param('fileId') fileId: string,
        @Res() res: Response
    ) {
        return this.filesService.serveFileRaw(fileId, res);
    }

    @Post('projects/:projectId/files/delete')
    @UseGuards(JwtAuthGuard)
    async deleteFile(
        @Param('projectId') projectId: string,
        @Body() body: { path: string },
        @Req() req: any
    ) {
        const userId = req.user?.id;
        return this.filesService.deleteFileOrDirectory(projectId, body.path, userId);
    }
}
