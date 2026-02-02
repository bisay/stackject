import { Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Dangerous file extensions that should never be uploaded
const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.php', '.jsp', '.cgi', '.dll', '.com', '.msi', '.scr', '.ps1', '.vbs', '.wsf'];

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
            fileSize: 50 * 1024 * 1024, // 50MB max per file
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
        @Body() body: { filePath?: string }
    ) {
        if (!file) throw new BadRequestException('No file uploaded');
        const path = body.filePath || file.originalname;
        return this.filesService.uploadFile(projectId, file, path);
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
    async downloadProject(
        @Param('projectId') projectId: string,
        @Res() res: Response
    ) {
        return this.filesService.downloadProjectZip(projectId, res);
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
}
