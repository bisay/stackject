import { Controller, Get, Post, Delete, UseGuards, Body, ForbiddenException, Headers, Param, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller('admin')
export class AdminController {
    private backupDir = join(process.cwd(), 'backups');

    constructor(private readonly adminService: AdminService) {
        // Ensure backup directory exists
        if (!existsSync(this.backupDir)) {
            mkdirSync(this.backupDir, { recursive: true });
        }
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    getStats() {
        return this.adminService.getStats();
    }

    @Post('setup')
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // Very strict: 3 attempts per minute
    setupFirstAdmin(
        @Body() body: any,
        @Headers('x-setup-secret') setupSecret: string
    ) {
        // SECURITY: Require a setup secret from environment variable
        const requiredSecret = process.env.ADMIN_SETUP_SECRET;
        
        // In production, ADMIN_SETUP_SECRET is required
        if (process.env.NODE_ENV === 'production' && !requiredSecret) {
            throw new ForbiddenException('ADMIN_SETUP_SECRET must be set in production environment');
        }
        
        // If ADMIN_SETUP_SECRET is set, require it to match
        if (requiredSecret && setupSecret !== requiredSecret) {
            throw new ForbiddenException('Invalid setup secret');
        }
        
        return this.adminService.setupFirstAdmin(body);
    }

    @Post('create')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    createAdmin(@Body() body: any) {
        return this.adminService.createAdmin(body);
    }

    @Get('users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    getUsers() {
        return this.adminService.getUsers();
    }

    // ==================== BACKUP ENDPOINTS ====================

    @Post('backup')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    createBackup() {
        return this.adminService.createBackup();
    }

    @Post('backup/upload')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const backupDir = join(process.cwd(), 'backups');
                if (!existsSync(backupDir)) {
                    mkdirSync(backupDir, { recursive: true });
                }
                cb(null, backupDir);
            },
            filename: (req, file, cb) => {
                // Sanitize filename and add timestamp
                const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                cb(null, `uploaded-${timestamp}-${sanitized}`);
            }
        }),
        fileFilter: (req, file, cb) => {
            // Only allow .sql and .dump files
            const allowedExtensions = ['.sql', '.dump', '.backup'];
            const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
            if (allowedExtensions.includes(ext)) {
                cb(null, true);
            } else {
                cb(new ForbiddenException('Only .sql, .dump, or .backup files are allowed'), false);
            }
        },
        limits: {
            fileSize: 500 * 1024 * 1024 // 500MB max
        }
    }))
    uploadBackup(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new ForbiddenException('No file uploaded');
        }
        return this.adminService.handleUploadedBackup(file);
    }

    @Get('backups')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    listBackups() {
        return this.adminService.listBackups();
    }

    @Get('backups/settings')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    getBackupSettings() {
        return this.adminService.getBackupSettings();
    }

    @Get('backups/:filename/download')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    async downloadBackup(@Param('filename') filename: string, @Res() res: Response) {
        const filepath = await this.adminService.getBackupPath(filename);
        res.download(filepath, filename);
    }

    @Delete('backups/:filename')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    deleteBackup(@Param('filename') filename: string) {
        return this.adminService.deleteBackup(filename);
    }

    @Post('backups/:filename/restore')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    restoreBackup(@Param('filename') filename: string) {
        return this.adminService.restoreBackup(filename);
    }
}
