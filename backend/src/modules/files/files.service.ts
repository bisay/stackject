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

    async uploadFile(projectId: string, file: Express.Multer.File, filePath: string) {
        console.log(`🔧 Service: Processing File ${file.originalname} for Project ${projectId}`);
        // filePath example: "src/components/Header.tsx" or just "Header.tsx"
        // Normalize path separators
        const normalizedPath = filePath.replace(/\\/g, '/');
        const parts = normalizedPath.split('/').filter(p => p !== '.' && p !== '');
        const fileName = parts.pop()!; // Last part is filename
        const directories = parts; // Remaining are directories

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
                    path: normalizedPath,
                    projectId,
                    parentId
                }
            });
            console.log(`✅ DB Node Created: ${result.id}`);
            return result;
        } catch (error) {
            console.error(`❌ DB Create Error:`, error);
            throw error;
        }
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
}
