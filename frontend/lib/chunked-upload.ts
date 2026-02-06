/**
 * Chunked File Upload Utility
 * Splits large files into smaller chunks for upload, bypassing Cloudflare Tunnel limits
 */

import api from './api';

// Default chunk size: 4MB (safe for most CDN/proxy limits)
const DEFAULT_CHUNK_SIZE = 4 * 1024 * 1024; // 4MB

export interface ChunkedUploadOptions {
    chunkSize?: number;
    onProgress?: (progress: ChunkedUploadProgress) => void;
    replaceMode?: 'replace' | 'keep-both';
    description?: string;
}

export interface ChunkedUploadProgress {
    fileName: string;
    currentChunk: number;
    totalChunks: number;
    uploadedBytes: number;
    totalBytes: number;
    percentage: number;
    status: 'uploading' | 'finalizing' | 'complete' | 'error';
}

export interface ChunkedUploadResult {
    success: boolean;
    fileNode?: any;
    error?: string;
    duplicate?: boolean;
    existingFile?: any;
}

/**
 * Upload a file using chunked upload
 */
export async function uploadFileChunked(
    projectId: string,
    file: File,
    filePath: string,
    options: ChunkedUploadOptions = {}
): Promise<ChunkedUploadResult> {
    const {
        chunkSize = DEFAULT_CHUNK_SIZE,
        onProgress,
        replaceMode,
        description = ''
    } = options;

    const totalChunks = Math.ceil(file.size / chunkSize);
    const fileName = file.name;
    const fileSize = file.size;

    // For small files (less than chunk size), use regular upload
    if (file.size <= chunkSize) {
        return uploadRegular(projectId, file, filePath, options);
    }

    try {
        // Step 1: Initialize chunked upload session
        const initRes = await api.post(`/files/projects/${projectId}/chunked/init`, {
            fileName,
            filePath,
            fileSize,
            totalChunks,
            mimeType: file.type || 'application/octet-stream',
            replaceMode,
            description
        });

        // Check if duplicate detected
        if (initRes.data.duplicate) {
            return {
                success: false,
                duplicate: true,
                existingFile: initRes.data.existingFile
            };
        }

        const uploadId = initRes.data.uploadId;
        let uploadedBytes = 0;

        // Step 2: Upload each chunk
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            const start = chunkIndex * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const formData = new FormData();
            formData.append('chunk', chunk);
            formData.append('uploadId', uploadId);
            formData.append('chunkIndex', chunkIndex.toString());
            formData.append('totalChunks', totalChunks.toString());

            await api.post(`/files/projects/${projectId}/chunked/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            uploadedBytes += (end - start);

            if (onProgress) {
                onProgress({
                    fileName,
                    currentChunk: chunkIndex + 1,
                    totalChunks,
                    uploadedBytes,
                    totalBytes: fileSize,
                    percentage: Math.round((uploadedBytes / fileSize) * 100),
                    status: 'uploading'
                });
            }
        }

        // Step 3: Finalize upload (merge chunks)
        if (onProgress) {
            onProgress({
                fileName,
                currentChunk: totalChunks,
                totalChunks,
                uploadedBytes: fileSize,
                totalBytes: fileSize,
                percentage: 99,
                status: 'finalizing'
            });
        }

        const finalizeRes = await api.post(`/files/projects/${projectId}/chunked/finalize`, {
            uploadId
        });

        if (onProgress) {
            onProgress({
                fileName,
                currentChunk: totalChunks,
                totalChunks,
                uploadedBytes: fileSize,
                totalBytes: fileSize,
                percentage: 100,
                status: 'complete'
            });
        }

        return {
            success: true,
            fileNode: finalizeRes.data
        };

    } catch (error: any) {
        console.error('Chunked upload error:', error);
        
        if (onProgress) {
            onProgress({
                fileName,
                currentChunk: 0,
                totalChunks,
                uploadedBytes: 0,
                totalBytes: fileSize,
                percentage: 0,
                status: 'error'
            });
        }

        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Upload failed'
        };
    }
}

/**
 * Regular upload for small files
 */
async function uploadRegular(
    projectId: string,
    file: File,
    filePath: string,
    options: ChunkedUploadOptions = {}
): Promise<ChunkedUploadResult> {
    const { onProgress, replaceMode, description = '' } = options;

    try {
        if (onProgress) {
            onProgress({
                fileName: file.name,
                currentChunk: 0,
                totalChunks: 1,
                uploadedBytes: 0,
                totalBytes: file.size,
                percentage: 0,
                status: 'uploading'
            });
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', filePath);
        if (replaceMode) formData.append('replaceMode', replaceMode);
        if (description) formData.append('description', description);

        const res = await api.post(`/files/projects/${projectId}/upload`, formData, {
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    onProgress({
                        fileName: file.name,
                        currentChunk: 1,
                        totalChunks: 1,
                        uploadedBytes: progressEvent.loaded,
                        totalBytes: progressEvent.total,
                        percentage,
                        status: percentage >= 100 ? 'complete' : 'uploading'
                    });
                }
            }
        });

        // Check if duplicate
        if (res.data.duplicate) {
            return {
                success: false,
                duplicate: true,
                existingFile: res.data.existingFile
            };
        }

        if (onProgress) {
            onProgress({
                fileName: file.name,
                currentChunk: 1,
                totalChunks: 1,
                uploadedBytes: file.size,
                totalBytes: file.size,
                percentage: 100,
                status: 'complete'
            });
        }

        return {
            success: true,
            fileNode: res.data
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Upload failed'
        };
    }
}

/**
 * Cancel an ongoing chunked upload
 */
export async function cancelChunkedUpload(projectId: string, uploadId: string): Promise<void> {
    try {
        await api.post(`/files/projects/${projectId}/chunked/cancel`, { uploadId });
    } catch (error) {
        console.error('Failed to cancel chunked upload:', error);
    }
}

/**
 * Get recommended chunk size based on file size
 */
export function getRecommendedChunkSize(fileSize: number): number {
    // For files < 10MB: 2MB chunks
    if (fileSize < 10 * 1024 * 1024) {
        return 2 * 1024 * 1024;
    }
    // For files < 100MB: 4MB chunks
    if (fileSize < 100 * 1024 * 1024) {
        return 4 * 1024 * 1024;
    }
    // For larger files: 5MB chunks
    return 5 * 1024 * 1024;
}
