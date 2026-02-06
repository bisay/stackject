import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { existsSync, mkdirSync, unlinkSync, createWriteStream, createReadStream, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

interface ChunkedUploadSession {
    uploadId: string;
    userId: string;
    projectId: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    totalChunks: number;
    mimeType: string;
    replaceMode?: string;
    description?: string;
    receivedChunks: Set<number>;
    createdAt: Date;
    chunkDir: string;
}

@Injectable()
export class ChunkedUploadService {
    // In-memory session storage (could be Redis for production)
    private uploadSessions: Map<string, ChunkedUploadSession> = new Map();
    
    // Cleanup old sessions every 30 minutes
    private cleanupInterval: NodeJS.Timeout;

    constructor(private prisma: PrismaService) {
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldSessions();
        }, 30 * 60 * 1000); // 30 minutes
    }

    /**
     * Initialize a new chunked upload session
     */
    async initUpload(
        projectId: string,
        userId: string,
        data: {
            fileName: string;
            filePath: string;
            fileSize: number;
            totalChunks: number;
            mimeType: string;
            replaceMode?: string;
            description?: string;
        }
    ) {
        console.log(`🚀 [CHUNKED] Init upload: ${data.fileName} (${data.totalChunks} chunks)`);

        // Normalize path
        const normalizedPath = data.filePath.replace(/\\/g, '/');

        // Check for duplicate if replaceMode not specified
        if (!data.replaceMode) {
            const existingFile = await this.prisma.fileNode.findFirst({
                where: { 
                    projectId, 
                    path: normalizedPath,
                    type: 'file'
                }
            });

            if (existingFile) {
                return {
                    duplicate: true,
                    existingFile: {
                        id: existingFile.id,
                        name: existingFile.name,
                        path: existingFile.path
                    }
                };
            }
        }

        // Generate unique upload ID
        const uploadId = randomUUID();
        
        // Create chunk directory
        const chunkDir = join(process.cwd(), 'uploads', 'chunks', userId, projectId, uploadId);
        if (!existsSync(chunkDir)) {
            mkdirSync(chunkDir, { recursive: true });
        }

        // Create session
        const session: ChunkedUploadSession = {
            uploadId,
            userId,
            projectId,
            fileName: data.fileName,
            filePath: normalizedPath,
            fileSize: data.fileSize,
            totalChunks: data.totalChunks,
            mimeType: data.mimeType,
            replaceMode: data.replaceMode,
            description: data.description,
            receivedChunks: new Set(),
            createdAt: new Date(),
            chunkDir
        };

        this.uploadSessions.set(uploadId, session);

        console.log(`   ✅ Upload session created: ${uploadId}`);

        return {
            uploadId,
            message: 'Upload session initialized'
        };
    }

    /**
     * Receive a single chunk
     */
    async uploadChunk(
        uploadId: string,
        chunkIndex: number,
        totalChunks: number,
        chunk: Express.Multer.File,
        userId: string
    ) {
        const session = this.uploadSessions.get(uploadId);
        
        if (!session) {
            throw new NotFoundException('Upload session not found or expired');
        }

        if (session.userId !== userId) {
            throw new BadRequestException('Unauthorized access to upload session');
        }

        // Mark chunk as received
        session.receivedChunks.add(chunkIndex);

        console.log(`   📦 [CHUNKED] Received chunk ${chunkIndex + 1}/${totalChunks} for ${session.fileName}`);

        return {
            uploadId,
            chunkIndex,
            received: session.receivedChunks.size,
            total: totalChunks,
            complete: session.receivedChunks.size === totalChunks
        };
    }

    /**
     * Finalize upload - merge all chunks into final file
     */
    async finalizeUpload(uploadId: string, projectId: string, userId: string) {
        const session = this.uploadSessions.get(uploadId);
        
        if (!session) {
            throw new NotFoundException('Upload session not found or expired');
        }

        if (session.userId !== userId) {
            throw new BadRequestException('Unauthorized access to upload session');
        }

        if (session.receivedChunks.size !== session.totalChunks) {
            throw new BadRequestException(
                `Missing chunks. Received ${session.receivedChunks.size}/${session.totalChunks}`
            );
        }

        console.log(`🔧 [CHUNKED] Finalizing upload: ${session.fileName}`);

        try {
            // Create final file path
            const finalDir = join(process.cwd(), 'uploads', 'users', userId, projectId);
            if (!existsSync(finalDir)) {
                mkdirSync(finalDir, { recursive: true });
            }

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const safeName = session.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            const finalFileName = `${uniqueSuffix}-${safeName}`;
            const finalPath = join(finalDir, finalFileName);

            // Merge chunks
            await this.mergeChunks(session.chunkDir, finalPath, session.totalChunks, uploadId);

            // Get final file size
            const stats = statSync(finalPath);

            // Handle duplicate replacement
            const normalizedPath = session.filePath;
            const parts = normalizedPath.split('/').filter(p => p !== '.' && p !== '');
            let fileName = parts.pop()!;
            const directories = parts;

            let changeType = 'ADD';
            let finalFilePath = normalizedPath;

            if (session.replaceMode === 'replace') {
                const existingFile = await this.prisma.fileNode.findFirst({
                    where: { projectId, path: normalizedPath, type: 'file' }
                });
                if (existingFile) {
                    changeType = 'REPLACE';
                    await this.prisma.fileNode.delete({ where: { id: existingFile.id } });
                }
            } else if (session.replaceMode === 'keep-both') {
                const existingFile = await this.prisma.fileNode.findFirst({
                    where: { projectId, path: normalizedPath, type: 'file' }
                });
                if (existingFile) {
                    changeType = 'ADD';
                    const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
                    const baseName = fileName.replace(ext, '');
                    
                    let counter = 2;
                    let newFileName = `${baseName} (${counter})${ext}`;
                    let newPath = [...directories, newFileName].join('/');
                    
                    while (await this.prisma.fileNode.findFirst({ where: { projectId, path: newPath, type: 'file' } })) {
                        counter++;
                        newFileName = `${baseName} (${counter})${ext}`;
                        newPath = [...directories, newFileName].join('/');
                    }
                    
                    fileName = newFileName;
                    finalFilePath = newPath;
                }
            }

            // Create directory structure
            let parentId: string | null = null;
            for (const dirName of directories) {
                let dir = await this.prisma.fileNode.findFirst({
                    where: { projectId, parentId, name: dirName, type: 'directory' }
                });

                if (!dir) {
                    dir = await this.prisma.fileNode.create({
                        data: {
                            name: dirName,
                            type: 'directory',
                            size: 0,
                            path: dirName,
                            projectId,
                            parentId
                        }
                    });
                }
                parentId = dir.id;
            }

            // Create file node in database
            const fileNode = await this.prisma.fileNode.create({
                data: {
                    name: fileName,
                    type: 'file',
                    size: stats.size,
                    mimeType: session.mimeType,
                    diskPath: finalPath,
                    path: finalFilePath,
                    projectId,
                    parentId
                }
            });

            // Log the change
            await this.prisma.fileChangeLog.create({
                data: {
                    projectId,
                    changedById: userId,
                    fileName,
                    filePath: finalFilePath,
                    changeType,
                    description: session.description || `${changeType === 'REPLACE' ? 'Updated' : 'Added'} ${fileName} via chunked upload`
                }
            });

            // Cleanup chunks
            this.cleanupChunks(session.chunkDir, uploadId, session.totalChunks);
            this.uploadSessions.delete(uploadId);

            console.log(`   ✅ [CHUNKED] File created: ${fileNode.id}`);

            return fileNode;

        } catch (error) {
            console.error('🔥 [CHUNKED] Finalize error:', error);
            // Cleanup on error
            this.cleanupChunks(session.chunkDir, uploadId, session.totalChunks);
            this.uploadSessions.delete(uploadId);
            throw error;
        }
    }

    /**
     * Cancel an upload session
     */
    async cancelUpload(uploadId: string, userId: string) {
        const session = this.uploadSessions.get(uploadId);
        
        if (!session) {
            return { message: 'Session already cleaned up or not found' };
        }

        if (session.userId !== userId) {
            throw new BadRequestException('Unauthorized access to upload session');
        }

        console.log(`❌ [CHUNKED] Cancelling upload: ${uploadId}`);

        // Cleanup chunks
        this.cleanupChunks(session.chunkDir, uploadId, session.totalChunks);
        this.uploadSessions.delete(uploadId);

        return { message: 'Upload cancelled and cleaned up' };
    }

    /**
     * Merge chunk files into final file
     */
    private async mergeChunks(
        chunkDir: string,
        finalPath: string,
        totalChunks: number,
        uploadId: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeStream = createWriteStream(finalPath);

            const appendChunk = (index: number) => {
                if (index >= totalChunks) {
                    writeStream.end();
                    resolve();
                    return;
                }

                const chunkPath = join(chunkDir, `${uploadId}_chunk_${index}`);
                
                if (!existsSync(chunkPath)) {
                    writeStream.end();
                    reject(new Error(`Chunk ${index} not found at ${chunkPath}`));
                    return;
                }

                const readStream = createReadStream(chunkPath);
                
                readStream.on('error', (err) => {
                    writeStream.end();
                    reject(err);
                });

                readStream.on('end', () => {
                    appendChunk(index + 1);
                });

                readStream.pipe(writeStream, { end: false });
            };

            writeStream.on('error', reject);
            appendChunk(0);
        });
    }

    /**
     * Cleanup chunk files
     */
    private cleanupChunks(chunkDir: string, uploadId: string, totalChunks: number) {
        try {
            for (let i = 0; i < totalChunks; i++) {
                const chunkPath = join(chunkDir, `${uploadId}_chunk_${i}`);
                if (existsSync(chunkPath)) {
                    unlinkSync(chunkPath);
                }
            }
            
            // Try to remove the directory if empty
            if (existsSync(chunkDir)) {
                const remaining = readdirSync(chunkDir);
                if (remaining.length === 0) {
                    const fs = require('fs');
                    fs.rmdirSync(chunkDir);
                }
            }
        } catch (err) {
            console.warn('Chunk cleanup warning:', err);
        }
    }

    /**
     * Cleanup sessions older than 2 hours
     */
    private cleanupOldSessions() {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        
        for (const [uploadId, session] of this.uploadSessions.entries()) {
            if (session.createdAt < twoHoursAgo) {
                console.log(`🧹 [CHUNKED] Cleaning up stale session: ${uploadId}`);
                this.cleanupChunks(session.chunkDir, uploadId, session.totalChunks);
                this.uploadSessions.delete(uploadId);
            }
        }
    }
}
