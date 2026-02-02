import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, createReadStream } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class AdminService {
    private backupDir = join(process.cwd(), 'backups');
    private pgBinPath: string | null = null;

    constructor(private prisma: PrismaService) {
        // Ensure backup directory exists
        if (!existsSync(this.backupDir)) {
            mkdirSync(this.backupDir, { recursive: true });
        }
        // Find PostgreSQL bin path on Windows
        this.pgBinPath = this.findPostgresBinPath();
    }

    /**
     * Find PostgreSQL bin directory on Windows
     */
    private findPostgresBinPath(): string | null {
        // Common PostgreSQL installation paths on Windows
        const possiblePaths = [
            'C:\\Program Files\\PostgreSQL\\18\\bin',
            'C:\\Program Files\\PostgreSQL\\17\\bin',
            'C:\\Program Files\\PostgreSQL\\16\\bin',
            'C:\\Program Files\\PostgreSQL\\15\\bin',
            'C:\\Program Files\\PostgreSQL\\14\\bin',
            'C:\\Program Files\\PostgreSQL\\13\\bin',
            'C:\\Program Files\\PostgreSQL\\12\\bin',
            'C:\\Program Files (x86)\\PostgreSQL\\18\\bin',
            'C:\\Program Files (x86)\\PostgreSQL\\17\\bin',
            'C:\\Program Files (x86)\\PostgreSQL\\16\\bin',
            'C:\\Program Files (x86)\\PostgreSQL\\15\\bin',
            'C:\\Program Files (x86)\\PostgreSQL\\14\\bin',
        ];

        for (const pgPath of possiblePaths) {
            const pgDumpPath = join(pgPath, 'pg_dump.exe');
            if (existsSync(pgDumpPath)) {
                console.log(`✅ Found PostgreSQL at: ${pgPath}`);
                return pgPath;
            }
        }

        console.warn('⚠️ PostgreSQL bin path not found. pg_dump/psql may not work.');
        return null;
    }

    /**
     * Get the full path for a PostgreSQL command
     */
    private getPgCommand(command: string): string {
        if (this.pgBinPath) {
            const fullPath = join(this.pgBinPath, `${command}.exe`);
            return `"${fullPath}"`;
        }
        return command;
    }

    async getStats() {
        const usersCount = await this.prisma.user.count();
        const projectsCount = await this.prisma.project.count();
        const discussionsCount = await this.prisma.discussion.count();
        return { usersCount, projectsCount, discussionsCount };
    }

    async setupFirstAdmin(data: any) {
        const adminCount = await this.prisma.user.count({ where: { role: Role.ADMIN } });

        if (data.check) {
            if (adminCount > 0) throw new ForbiddenException('Admin already exists');
            return { message: 'Setup allowed' };
        }

        if (adminCount > 0) {
            throw new ForbiddenException('Admin already exists');
        }

        // Check availability
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { username: data.username }
                ]
            }
        });

        if (existingUser) {
            throw new ForbiddenException('User with this email or username already exists. Please login or use different credentials.');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                password: hashedPassword,
                name: data.name,
                role: Role.ADMIN
            }
        });
    }

    async createAdmin(data: any) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                email: data.email,
                username: data.username,
                password: hashedPassword,
                name: data.name,
                role: Role.ADMIN
            }
        });
    }

    async getUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                createdAt: true
            }
        });
    }

    // ==================== BACKUP METHODS ====================

    /**
     * Create a database backup
     */
    async createBackup(): Promise<{ filename: string; size: number; createdAt: Date }> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filepath = join(this.backupDir, filename);

        // Parse DATABASE_URL to get connection details
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new ForbiddenException('DATABASE_URL not configured');
        }

        try {
            // Parse PostgreSQL connection string
            const url = new URL(dbUrl);
            const host = url.hostname;
            const port = url.port || '5432';
            const database = url.pathname.slice(1).split('?')[0];
            const username = url.username;
            const password = url.password;

            // Set PGPASSWORD environment variable for pg_dump
            const env = { ...process.env, PGPASSWORD: password };

            // Run pg_dump with full path on Windows
            const pgDump = this.getPgCommand('pg_dump');
            const command = `${pgDump} -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${filepath}"`;
            
            console.log('Running backup command:', command);
            await execAsync(command, { env });

            const stats = statSync(filepath);
            
            return {
                filename,
                size: stats.size,
                createdAt: new Date()
            };
        } catch (error: any) {
            console.error('Backup failed:', error);
            throw new ForbiddenException(`Backup failed: ${error.message}. Make sure PostgreSQL is installed and pg_dump is available.`);
        }
    }

    /**
     * List all available backups
     */
    async listBackups(): Promise<{ filename: string; size: number; createdAt: Date; isUploaded: boolean }[]> {
        if (!existsSync(this.backupDir)) {
            return [];
        }

        const files = readdirSync(this.backupDir)
            .filter(f => f.endsWith('.sql') || f.endsWith('.dump') || f.endsWith('.backup'))
            .map(filename => {
                const filepath = join(this.backupDir, filename);
                const stats = statSync(filepath);
                return {
                    filename,
                    size: stats.size,
                    createdAt: stats.mtime,
                    isUploaded: filename.startsWith('uploaded-')
                };
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return files;
    }

    /**
     * Get backup file path for download
     */
    async getBackupPath(filename: string): Promise<string> {
        // Sanitize filename to prevent path traversal
        const sanitizedFilename = filename.replace(/[\/\\]/g, '');
        const filepath = join(this.backupDir, sanitizedFilename);

        if (!existsSync(filepath)) {
            throw new NotFoundException('Backup file not found');
        }

        // Ensure file is within backup directory
        const resolvedPath = join(this.backupDir, sanitizedFilename);
        if (!resolvedPath.startsWith(this.backupDir)) {
            throw new ForbiddenException('Invalid backup path');
        }

        return filepath;
    }

    /**
     * Delete a backup file
     */
    async deleteBackup(filename: string): Promise<{ message: string }> {
        const filepath = await this.getBackupPath(filename);
        
        try {
            unlinkSync(filepath);
            return { message: `Backup ${filename} deleted successfully` };
        } catch (error: any) {
            throw new ForbiddenException(`Failed to delete backup: ${error.message}`);
        }
    }

    /**
     * Restore database from backup
     */
    async restoreBackup(filename: string): Promise<{ message: string }> {
        const filepath = await this.getBackupPath(filename);

        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new ForbiddenException('DATABASE_URL not configured');
        }

        try {
            const url = new URL(dbUrl);
            const host = url.hostname;
            const port = url.port || '5432';
            const database = url.pathname.slice(1).split('?')[0];
            const username = url.username;
            const password = url.password;

            const env = { ...process.env, PGPASSWORD: password };

            // Run psql to restore with full path on Windows
            const psql = this.getPgCommand('psql');
            const command = `${psql} -h ${host} -p ${port} -U ${username} -d ${database} -f "${filepath}"`;
            
            console.log('Running restore command:', command);
            await execAsync(command, { env });

            return { message: `Database restored from ${filename} successfully` };
        } catch (error: any) {
            console.error('Restore failed:', error);
            throw new ForbiddenException(`Restore failed: ${error.message}. Make sure PostgreSQL is installed and psql is available.`);
        }
    }

    /**
     * Handle uploaded backup file
     */
    async handleUploadedBackup(file: Express.Multer.File): Promise<{ filename: string; size: number; createdAt: Date; message: string }> {
        return {
            filename: file.filename,
            size: file.size,
            createdAt: new Date(),
            message: `Backup file "${file.originalname}" uploaded successfully as "${file.filename}"`
        };
    }

    /**
     * Get backup settings
     */
    async getBackupSettings() {
        // For now, return static settings. In production, store in DB or config
        return {
            autoBackup: false,
            backupInterval: 'daily', // daily, weekly, monthly
            maxBackups: 10,
            backupDir: this.backupDir
        };
    }
}
