import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FilesService {
    constructor(private prisma: PrismaService) { }

    async getProjectFiles(projectId: string, parentId?: string, userId?: string) {
        console.log(`🔍 [SERVICE] getProjectFiles. Project: ${projectId}, Parent: ${parentId || 'null'}, User: ${userId}`);

        // 1. Check Project Visibility
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, visibility: true, ownerId: true }
        });

        if (!project) throw new NotFoundException('Project not found');

        // Allow if Public OR if User is Owner
        const isOwner = userId && project.ownerId === userId;
        if (project.visibility !== 'public' && !isOwner) {
            console.warn(`⛔ Access Denied: Project ${projectId} is PRIVATE. User ${userId} is not owner.`);
            throw new ForbiddenException('Access Denied: This project is private.');
        }

        try {
            const files = await this.prisma.fileNode.findMany({
                where: {
                    projectId,
                    parentId: parentId || null
                },
                orderBy: [
                    { type: 'desc' }, // Directories first
                    { name: 'asc' }
                ]
            });
            console.log(`   ✅ [SERVICE] Found ${files.length} files.`);
            return files;
        } catch (error) {
            console.error(`🔥 [SERVICE] Prisma Error in getProjectFiles:`, error);
            throw error;
        }
    }

    async checkDuplicateFile(projectId: string, filePath: string) {
        const normalizedPath = filePath.replace(/\\/g, '/');
        const existingFile = await this.prisma.fileNode.findFirst({
            where: { 
                projectId, 
                path: normalizedPath,
                type: 'file'
            }
        });
        
        return {
            exists: !!existingFile,
            file: existingFile ? { id: existingFile.id, name: existingFile.name, path: existingFile.path } : null
        };
    }

    async uploadFile(
        projectId: string, 
        file: Express.Multer.File, 
        filePath: string,
        options?: { userId?: string, description?: string, replaceMode?: string }
    ) {
        console.log(`🔧 Service: Processing File ${file.originalname} for Project ${projectId}`);
        // filePath example: "src/components/Header.tsx" or just "Header.tsx"
        // Normalize path separators
        const normalizedPath = filePath.replace(/\\/g, '/');
        const parts = normalizedPath.split('/').filter(p => p !== '.' && p !== '');
        let fileName = parts.pop()!; // Last part is filename
        const directories = parts; // Remaining are directories

        // Check for duplicate
        const existingFile = await this.prisma.fileNode.findFirst({
            where: { projectId, path: normalizedPath, type: 'file' }
        });

        let changeType = 'ADD';
        let finalPath = normalizedPath;

        if (existingFile) {
            if (options?.replaceMode === 'replace') {
                // Delete old file
                changeType = 'REPLACE';
                await this.prisma.fileNode.delete({ where: { id: existingFile.id } });
            } else if (options?.replaceMode === 'keep-both') {
                // Add (2) to filename
                changeType = 'ADD';
                const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
                const baseName = fileName.replace(ext, '');
                
                // Find next available number
                let counter = 2;
                let newFileName = `${baseName} (${counter})${ext}`;
                let newPath = [...directories, newFileName].join('/');
                
                while (await this.prisma.fileNode.findFirst({ where: { projectId, path: newPath, type: 'file' } })) {
                    counter++;
                    newFileName = `${baseName} (${counter})${ext}`;
                    newPath = [...directories, newFileName].join('/');
                }
                
                fileName = newFileName;
                finalPath = newPath;
            } else {
                // Return duplicate error - frontend should ask user
                return { 
                    duplicate: true, 
                    existingFile: { id: existingFile.id, name: existingFile.name, path: existingFile.path }
                };
            }
        }

        let parentId: string | null = null;

        // 1. Recursive Directory Creation
        for (const dirName of directories) {
            let dir = await this.prisma.fileNode.findFirst({
                where: { projectId, parentId, name: dirName, type: 'directory' }
            });

            if (!dir) {
                console.log(`   Creating directory: ${dirName}`);
                dir = await this.prisma.fileNode.create({
                    data: {
                        name: dirName,
                        type: 'directory',
                        size: 0,
                        path: dirName, // Visual only
                        projectId,
                        parentId
                    }
                });
            }
            parentId = dir.id;
        }

        // 2. Create File Node
        try {
            console.log(`   Creating DB Node: ${fileName}, Parent: ${parentId}, Path: ${file.path}`);
            const result = await this.prisma.fileNode.create({
                data: {
                    name: fileName,
                    type: 'file',
                    size: file.size,
                    mimeType: file.mimetype,
                    diskPath: file.path,
                    path: finalPath,
                    projectId,
                    parentId
                }
            });
            console.log(`✅ DB Node Created: ${result.id}`);

            // 3. Log the change
            if (options?.userId) {
                await this.logFileChange(projectId, {
                    fileName,
                    filePath: finalPath,
                    changeType,
                    description: options.description,
                    changedById: options.userId
                });
            }

            return result;
        } catch (error) {
            console.error(`❌ DB Create Error:`, error);
            throw error;
        }
    }

    async logFileChange(projectId: string, data: {
        fileName: string,
        filePath: string,
        changeType: string,
        description?: string,
        changedById: string
    }) {
        // Limit description to ~10 words
        let description = data.description;
        if (description) {
            const words = description.split(/\s+/).slice(0, 10);
            description = words.join(' ');
        }

        const log = await this.prisma.fileChangeLog.create({
            data: {
                projectId,
                fileName: data.fileName,
                filePath: data.filePath,
                changeType: data.changeType,
                description,
                changedById: data.changedById
            }
        });

        // Send notification to project owner if changed by someone else (admin)
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true, name: true, slug: true, owner: { select: { username: true } } }
        });

        if (project && project.ownerId !== data.changedById) {
            await this.prisma.notification.create({
                data: {
                    userId: project.ownerId,
                    type: 'FILE_CHANGE',
                    message: `File "${data.fileName}" telah ${data.changeType === 'ADD' ? 'ditambahkan' : data.changeType === 'REPLACE' ? 'diperbarui' : 'diubah'} di project "${project.name}"${description ? `: ${description}` : ''}`,
                    link: `/c/${project.owner.username}/project/${project.slug}`
                }
            });
        }

        return log;
    }

    async getChangeLogs(projectId: string, limit: number = 50) {
        const logs = await this.prisma.fileChangeLog.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return logs;
    }

    // Helper for explicit folder creation
    async createDirectory(projectId: string, name: string, parentId?: string) {
        console.log('🔥🔥🔥 createDirectory CALLED with name:', name);
        if (!name || (typeof name === 'string' && name.trim() === '')) {
            throw new BadRequestException('Directory name is required and cannot be empty.');
        }

        return this.prisma.fileNode.create({
            data: {
                name,
                type: 'directory',
                size: 0,
                path: name,
                projectId,
                parentId
            }
        });
    }

    async getFileContent(fileId: string) {
        const node = await this.prisma.fileNode.findUnique({ where: { id: fileId } });
        if (!node || node.type !== 'file') throw new NotFoundException('File not found');

        // Read from disk
        const fs = require('fs');
        if (node.diskPath && fs.existsSync(node.diskPath)) {
            return fs.readFileSync(node.diskPath, 'utf8');
        }
        return '';
    }
    async downloadProjectZip(projectId: string, res: any) {
        console.log(`📦 [ZIP v3] Starting zip for project: ${projectId}`);

        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { name: true, slug: true }
        });

        const rawName = project?.name || project?.slug || projectId;
        const safeName = rawName.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();

        const files = await this.prisma.fileNode.findMany({
            where: { projectId, type: 'file' }
        });

        console.log(`📦 [ZIP] Found ${files.length} files in DB`);

        const archiver = require('archiver');
        const archive = archiver('zip', { zlib: { level: 9 } });

        res.attachment(`${safeName}.zip`);
        archive.pipe(res);

        const fs = require('fs');
        const addedPaths = new Set<string>();

        for (const file of files) {
            if (file.diskPath) {
                if (!fs.existsSync(file.diskPath)) {
                    console.error(`   ❌ File missing on disk: ${file.diskPath}`);
                    continue;
                }

                // Clean path: Normalize slashes
                let internalPath = (file.path || file.name).replace(/\\/g, '/');

                // Remove leading "./" sequences ONLY (keep .env)
                internalPath = internalPath.replace(/^\.\//, '');

                // Remove leading slashes
                internalPath = internalPath.replace(/^\/+/, '');

                if (addedPaths.has(internalPath)) {
                    continue;
                }

                addedPaths.add(internalPath);
                console.log(`   ✅ [v3] Adding: ${internalPath}`);
                archive.file(file.diskPath, { name: internalPath });
            } else {
                console.log(`   ⚠️ Skipping ${file.name} - No diskPath`);
            }
        }

        await archive.finalize();
    }

    async downloadFileStream(fileId: string, res: any) {
        const node = await this.prisma.fileNode.findUnique({ where: { id: fileId } });
        if (!node || node.type !== 'file' || !node.diskPath) throw new NotFoundException('File not found');

        // SECURITY: Validate diskPath is within uploads directory (prevent path traversal)
        const path = require('path');
        const fs = require('fs');
        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        const resolvedPath = path.resolve(node.diskPath);
        
        if (!resolvedPath.startsWith(uploadsDir)) {
            throw new ForbiddenException('Access denied: Invalid file path');
        }

        if (!fs.existsSync(resolvedPath)) {
            throw new NotFoundException('File not found on disk');
        }

        // Safety: Sanitize filename to prevent issues
        const cleanName = node.name.replace(/[\/\\]/g, '_').replace(/^\.+/, '');

        console.log(`⬇️ [Single Download] ID: ${fileId}`);
        console.log(`   Original: "${node.name}"`);
        console.log(`   Cleaned:  "${cleanName}"`);

        res.download(resolvedPath, cleanName);
    }

    async serveFileRaw(fileId: string, res: any) {
        const node = await this.prisma.fileNode.findUnique({ where: { id: fileId } });
        if (!node || node.type !== 'file' || !node.diskPath) throw new NotFoundException('File not found');

        const path = require('path');
        const fs = require('fs');
        
        // SECURITY: Validate diskPath is within uploads directory (prevent path traversal)
        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        const resolvedPath = path.resolve(node.diskPath);
        
        if (!resolvedPath.startsWith(uploadsDir)) {
            throw new ForbiddenException('Access denied: Invalid file path');
        }

        if (!fs.existsSync(resolvedPath)) {
            throw new NotFoundException('File not found on disk');
        }

        // Set proper content type
        const mimeType = node.mimeType || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(node.name)}"`);

        // Stream the file
        const stream = fs.createReadStream(resolvedPath);
        stream.pipe(res);
    }

    async trackDownload(projectId: string, userId: string) {
        try {
            // Check if user already downloaded this project recently (within 1 hour)
            const recentDownload = await this.prisma.projectDownload.findFirst({
                where: {
                    projectId,
                    userId,
                    createdAt: {
                        gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
                    }
                }
            });

            // Only create new record if no recent download
            if (!recentDownload) {
                await this.prisma.projectDownload.create({
                    data: {
                        projectId,
                        userId
                    }
                });
                console.log(`📥 Download tracked: User ${userId} downloaded project ${projectId}`);
            } else {
                console.log(`📥 Download already tracked recently for user ${userId}`);
            }
        } catch (error) {
            // Don't fail the download if tracking fails
            console.error('Failed to track download:', error);
        }
    }

    async getProjectDownloads(projectId: string, limit: number = 50) {
        const downloads = await this.prisma.projectDownload.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            }
        });

        // Get total count
        const totalCount = await this.prisma.projectDownload.count({
            where: { projectId }
        });

        // Get unique downloaders count
        const uniqueDownloaders = await this.prisma.projectDownload.groupBy({
            by: ['userId'],
            where: { projectId }
        });

        return {
            downloads,
            totalCount,
            uniqueDownloaders: uniqueDownloaders.length
        };
    }

    async deleteFileOrDirectory(projectId: string, path: string, userId: string) {
        // Check project ownership
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { ownerId: true }
        });

        if (!project) throw new NotFoundException('Project not found');
        if (project.ownerId !== userId) throw new ForbiddenException('You are not the owner of this project');

        // Find the file/directory by path
        const fileNode = await this.prisma.fileNode.findFirst({
            where: { projectId, path }
        });

        if (!fileNode) {
            throw new NotFoundException('File or directory not found');
        }

        // If it's a directory, delete all children recursively
        if (fileNode.type === 'directory') {
            await this.deleteDirectoryRecursive(projectId, fileNode.id);
        } else {
            // Delete the physical file
            const fs = require('fs');
            if (fileNode.storagePath && fs.existsSync(fileNode.storagePath)) {
                fs.unlinkSync(fileNode.storagePath);
            }
        }

        // Delete the node from database
        await this.prisma.fileNode.delete({ where: { id: fileNode.id } });

        return { success: true, message: `${fileNode.type === 'directory' ? 'Directory' : 'File'} deleted successfully` };
    }

    private async deleteDirectoryRecursive(projectId: string, parentId: string) {
        const fs = require('fs');
        
        // Find all children
        const children = await this.prisma.fileNode.findMany({
            where: { projectId, parentId }
        });

        for (const child of children) {
            if (child.type === 'directory') {
                // Recursively delete subdirectories
                await this.deleteDirectoryRecursive(projectId, child.id);
            } else {
                // Delete physical file
                if (child.storagePath && fs.existsSync(child.storagePath)) {
                    fs.unlinkSync(child.storagePath);
                }
            }
            // Delete the child node
            await this.prisma.fileNode.delete({ where: { id: child.id } });
        }
    }
}
