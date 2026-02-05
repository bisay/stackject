"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { Folder, FileCode, UploadCloud, ChevronRight, ChevronDown, Loader2, Download, Image as ImageIcon, MoreVertical, Edit2, Trash2, Pencil, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiUrl } from '@/lib/api';
import CodeViewer from './code-viewer';
import { useAuth } from '@/context/auth-context';
import DuplicateFileModal from './duplicate-file-modal';
import UploadDescriptionModal from './upload-description-modal';

interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'directory';
    size: number;
    mimeType?: string;
    children?: FileNode[];
    path: string;
}

interface DuplicateFileInfo {
    file: File;
    filePath: string;
}

export default function FileExplorer({ projectId, isOwner, onFilesChanged }: { projectId: string, isOwner: boolean, onFilesChanged?: () => void }) {
    const { user } = useAuth();
    const router = useRouter();
    const [files, setFiles] = useState<FileNode[]>([]);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    // Duplicate file modal state
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [duplicateFile, setDuplicateFile] = useState<DuplicateFileInfo | null>(null);
    const [pendingFiles, setPendingFiles] = useState<DuplicateFileInfo[]>([]);
    
    // Upload description modal state
    const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
    const [pendingUploadFiles, setPendingUploadFiles] = useState<DuplicateFileInfo[]>([]);
    const [uploadDescription, setUploadDescription] = useState('');

    // Viewer State
    const [viewingFile, setViewingFile] = useState<{ name: string, content: string, type?: string, path?: string } | null>(null);
    const [fileLoading, setFileLoading] = useState(false);

    // Fetch file tree
    const fetchFiles = useCallback((parentId?: string) => {
        setLoading(true);
        api.post(`/files/projects/${projectId}/files/directory`, { path: parentId || '/' })
            .then(res => setFiles(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [projectId]);

    useEffect(() => {
        const currentParentId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : undefined;
        fetchFiles(currentParentId);
    }, [fetchFiles, breadcrumbs]);

    const handleNodeClick = async (node: FileNode) => {
        if (node.type === 'directory') {
            setBreadcrumbs(prev => [...prev, { id: node.id, name: node.name }]);
        } else {
            // Check if Image
            if (node.mimeType && node.mimeType.startsWith('image/')) {
                const imageUrl = `${getApiUrl()}/files/projects/${projectId}/${node.id}/raw`;
                setViewingFile({ name: node.name, content: imageUrl, type: 'image', path: node.path });
                return;
            }

            // Fetch Text Content
            setFileLoading(true);
            try {
                const res = await api.get(`/files/projects/${projectId}/${node.id}/content`);
                const content = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
                setViewingFile({ name: node.name, content, type: 'text', path: node.path });
            } catch (error) {
                console.error("Failed to read file", error);
                toast.error("Failed to read file content");
            } finally {
                setFileLoading(false);
            }
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setBreadcrumbs([]);
        } else {
            setBreadcrumbs(prev => prev.slice(0, index + 1));
        }
    };

    const scanFiles = async (item: any, path = ''): Promise<File[]> => {
        if (item.isFile) {
            return new Promise((resolve) => {
                item.file((file: any) => {
                    file.path = path + file.name;
                    resolve([file]);
                });
            });
        } else if (item.isDirectory) {
            const dirReader = item.createReader();
            const getEntries = async (): Promise<any[]> => {
                let entries: any[] = [];
                let batch: any[] = [];
                do {
                    batch = await new Promise((resolve) => dirReader.readEntries(resolve));
                    entries = entries.concat(batch);
                } while (batch.length > 0);
                return entries;
            };
            const entries = await getEntries();
            const results = await Promise.all(entries.map((entry: any) => scanFiles(entry, path + item.name + '/')));
            return results.flat();
        }
        return [];
    };

    const onDrop = async (acceptedFiles: File[], fileRejections: any[], event: any) => {
        if (!isOwner) return;
        let filesToUpload: File[] = [];

        const items = event.dataTransfer ? event.dataTransfer.items : null;
        if (items && items.length > 0 && items[0].webkitGetAsEntry) {
            const promises = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i].webkitGetAsEntry();
                if (item) promises.push(scanFiles(item));
            }
            filesToUpload = (await Promise.all(promises)).flat();
        } else {
            filesToUpload = acceptedFiles;
        }

        // Prepare files for upload
        const filesToProcess: DuplicateFileInfo[] = filesToUpload.map(file => ({
            file,
            filePath: (file as any).path || (file as any).webkitRelativePath || file.name
        }));
        
        // Store files and show description modal
        setPendingUploadFiles(filesToProcess);
        setDescriptionModalOpen(true);
    };
    
    // Handle description modal submit
    const handleDescriptionSubmit = async (description: string, changeType: string) => {
        setDescriptionModalOpen(false);
        setUploadDescription(description);
        setUploading(true);
        
        await processFileUpload(pendingUploadFiles, description);
        
        setPendingUploadFiles([]);
        setUploading(false);
        const currentParentId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : undefined;
        fetchFiles(currentParentId);
        
        // Notify parent that files changed
        if (onFilesChanged) onFilesChanged();
    };
    
    // Handle description modal close
    const handleDescriptionCancel = () => {
        setDescriptionModalOpen(false);
        setPendingUploadFiles([]);
    };
    
    // Helper function to process file uploads with duplicate detection
    const processFileUpload = async (filesToProcess: DuplicateFileInfo[], description: string = '') => {
        for (let i = 0; i < filesToProcess.length; i++) {
            const { file, filePath } = filesToProcess[i];
            
            try {
                // Check for duplicate first
                const checkRes = await api.get(`/files/projects/${projectId}/check-duplicate`, {
                    params: { filePath }
                });
                
                if (checkRes.data.exists) {
                    // Store remaining files and show modal
                    setPendingFiles(filesToProcess.slice(i + 1));
                    setDuplicateFile({ file, filePath });
                    setDuplicateModalOpen(true);
                    return; // Stop processing, will continue after user decision
                }
                
                // No duplicate, upload normally
                await uploadFileWithMode(file, filePath, 'replace', description);
            } catch (e) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }
    };
    
    // Upload file with specific mode
    const uploadFileWithMode = async (file: File, filePath: string, replaceMode: 'replace' | 'keep-both', description: string = '') => {
        const form = new FormData();
        form.append('file', file);
        form.append('filePath', filePath);
        form.append('replaceMode', replaceMode);
        form.append('description', description);
        
        try {
            await api.post(`/files/projects/${projectId}/upload`, form);
        } catch (e) {
            throw e;
        }
    };
    
    // Handle duplicate file replace
    const handleDuplicateReplace = async () => {
        if (!duplicateFile) return;
        
        try {
            await uploadFileWithMode(duplicateFile.file, duplicateFile.filePath, 'replace', uploadDescription);
            toast.success(`File ${duplicateFile.file.name} berhasil ditimpa`);
        } catch (e) {
            toast.error(`Failed to replace ${duplicateFile.file.name}`);
        }
        
        setDuplicateModalOpen(false);
        setDuplicateFile(null);
        
        // Continue processing remaining files
        if (pendingFiles.length > 0) {
            await processFileUpload(pendingFiles, uploadDescription);
            setPendingFiles([]);
        }
        
        // Refresh files
        const currentParentId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : undefined;
        fetchFiles(currentParentId);
        setUploading(false);
        
        // Notify parent that files changed
        if (onFilesChanged) onFilesChanged();
    };
    
    // Handle keep both files
    const handleDuplicateKeepBoth = async () => {
        if (!duplicateFile) return;
        
        try {
            await uploadFileWithMode(duplicateFile.file, duplicateFile.filePath, 'keep-both', uploadDescription);
            toast.success(`File ${duplicateFile.file.name} disimpan dengan nama baru`);
        } catch (e) {
            toast.error(`Failed to upload ${duplicateFile.file.name}`);
        }
        
        setDuplicateModalOpen(false);
        setDuplicateFile(null);
        
        // Continue processing remaining files
        if (pendingFiles.length > 0) {
            await processFileUpload(pendingFiles, uploadDescription);
            setPendingFiles([]);
        }
        
        // Refresh files
        const currentParentId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : undefined;
        fetchFiles(currentParentId);
        setUploading(false);
        
        // Notify parent that files changed
        if (onFilesChanged) onFilesChanged();
    };
    
    // Handle cancel duplicate modal
    const handleDuplicateCancel = () => {
        setDuplicateModalOpen(false);
        setDuplicateFile(null);
        setPendingFiles([]);
        setUploadDescription('');
        setUploading(false);
        
        // Refresh files
        const currentParentId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : undefined;
        fetchFiles(currentParentId);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        disabled: !isOwner,
        noClick: !isOwner,
        noKeyboard: !isOwner
    });

    // File Management Actions
    const handleDownloadZip = () => {
        // Check if user is logged in
        if (!user) {
            setShowLoginModal(true);
            return;
        }
        
        // Direct download link
        window.open(`${getApiUrl()}/files/projects/${projectId}/download`, '_blank');
    };

    const handleSaveFile = async (newContent: string) => {
        if (!viewingFile || !viewingFile.path) return;
        try {
            await api.post(`/files/projects/${projectId}/files/content`, {
                path: viewingFile.path,
                content: newContent
            });
            setViewingFile(prev => prev ? { ...prev, content: newContent } : null);
            toast.success("File saved successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save file");
            throw err; // CodeViewer handles error logging
        }
    };

    const handleRename = async (node: FileNode) => {
        const newName = prompt("Enter new name:", node.name);
        if (!newName || newName === node.name) return;

        try {
            await api.post(`/files/projects/${projectId}/files/move`, {
                oldPath: node.path,
                newPath: node.path.replace(node.name, newName)
            });
            toast.success("Renamed successfully");
            fetchFiles();
        } catch (err) {
            toast.error("Failed to rename");
        }
    };

    const handleDelete = async (node: FileNode) => {
        if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;

        try {
            // Using POST delete or DELETE method depending on backend. Using generic approach likely.
            await api.post(`/files/projects/${projectId}/files/delete`, { path: node.path });
            toast.success("Deleted successfully");
            fetchFiles();
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const handleDownloadFile = (node: FileNode) => {
        // Direct download or open content
        window.open(`${getApiUrl()}/files/projects/${projectId}/${node.id}/download`, '_blank');
    };


    return (
        <>
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                {/* Toolbar */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', gap: '5px', fontSize: '0.9rem', color: 'var(--text-muted)', overflowX: 'auto' }}>
                        <span style={{ cursor: 'pointer', fontWeight: breadcrumbs.length === 0 ? 700 : 400, color: breadcrumbs.length === 0 ? 'var(--primary)' : 'inherit' }} onClick={() => handleBreadcrumbClick(-1)}>root</span>
                        {breadcrumbs.map((crumb, idx) => (
                            <div key={crumb.id} style={{ display: 'flex', alignItems: 'center' }}>
                                <ChevronRight size={14} style={{ margin: '0 4px', opacity: 0.5 }} />
                                <span style={{ cursor: 'pointer', fontWeight: idx === breadcrumbs.length - 1 ? 700 : 400, color: idx === breadcrumbs.length - 1 ? 'var(--primary)' : 'inherit', whiteSpace: 'nowrap' }} onClick={() => handleBreadcrumbClick(idx)}>{crumb.name}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Download ZIP - Premium Button */}
                        <button
                            onClick={handleDownloadZip}
                            style={{
                                padding: '8px 16px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
                                color: 'white',
                                fontWeight: 500,
                                borderRadius: '8px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.5)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #5b5ef0 0%, #9333ea 100%)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.35)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
                            }}
                        >
                            <Download size={16} strokeWidth={2.5} />
                            <span>Download ZIP</span>
                        </button>

                        {isOwner && (
                            <>
                                <input type="file"
                                    // @ts-ignore
                                    webkitdirectory="" directory=""
                                    style={{ display: 'none' }} id="folder-upload-input"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) onDrop(Array.from(e.target.files), [], { dataTransfer: null });
                                        e.target.value = '';
                                    }}
                                />
                                <div {...getRootProps()} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    <input {...getInputProps()} />
                                    <UploadCloud size={16} /> Upload Files
                                </div>
                                <label htmlFor="folder-upload-input" style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                    <UploadCloud size={16} /> Upload Folder
                                </label>
                            </>
                        )}
                    </div>
                </div>

                {/* File List */}
                <div style={{ flex: 1, padding: '0.5rem', position: 'relative' }}>
                    {uploading && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--primary)' }}>Uploading...</div>}
                    {fileLoading && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Loader2 className="spin" /> Opening...
                        </div>
                    )}

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}><Loader2 className="spin" /> Syncing...</div>
                    ) : files.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Folder size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>Repository is empty.</p>
                            <p style={{ fontSize: '0.8rem' }}>Drag a FOLDER or files here to initialize codebase.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {files.map(node => (
                                <FileRow
                                    key={node.id}
                                    node={node}
                                    isOwner={isOwner}
                                    onClick={() => handleNodeClick(node)}
                                    onRename={() => handleRename(node)}
                                    onDelete={() => handleDelete(node)}
                                    onDownload={() => handleDownloadFile(node)}
                                    onEdit={() => handleNodeClick(node)} // Re-uses click to open, edit handled in viewer
                                />
                            ))}
                        </div>
                    )}
                </div>
                {isDragActive && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(99, 102, 241, 0.1)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, border: '2px dashed var(--primary)' }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Drop files/folders to upload</div>
                    </div>
                )}
            </div>

            {/* Code Viewer Modal */}
            <CodeViewer
                isOpen={!!viewingFile}
                onClose={() => setViewingFile(null)}
                fileName={viewingFile?.name || ''}
                content={viewingFile?.content || ''}
                type={viewingFile?.type as 'text' | 'image' | undefined}
                isEditable={isOwner}
                onSave={handleSaveFile}
            />

            {/* Login Modal */}
            {showLoginModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }} onClick={() => setShowLoginModal(false)}>
                    <div
                        className="glass-card"
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '400px',
                            padding: '2rem',
                            borderRadius: '16px',
                            border: '1px solid var(--glass-border)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '0.5rem'
                            }}>
                                <LogIn size={32} style={{ color: '#6366f1' }} />
                            </div>

                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Login Required</h2>
                            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                You need to be logged in to download project files. Please login to continue.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', width: '100%' }}>
                                <button
                                    className="btn-ghost"
                                    onClick={() => setShowLoginModal(false)}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        router.push('/login');
                                        setShowLoginModal(false);
                                    }}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                        border: '1px solid #6366f1',
                                        color: 'white',
                                        borderRadius: '8px',
                                        padding: '10px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <LogIn size={16} />
                                    Login
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Duplicate File Modal */}
            <DuplicateFileModal
                isOpen={duplicateModalOpen}
                fileName={duplicateFile?.file.name || ''}
                filePath={duplicateFile?.filePath || ''}
                onClose={handleDuplicateCancel}
                onReplace={handleDuplicateReplace}
                onKeepBoth={handleDuplicateKeepBoth}
            />
            
            {/* Upload Description Modal */}
            <UploadDescriptionModal
                isOpen={descriptionModalOpen}
                filesCount={pendingUploadFiles.length}
                onClose={handleDescriptionCancel}
                onSubmit={handleDescriptionSubmit}
            />
        </>
    );
}

function FileRow({ node, onClick, isOwner, onRename, onDelete, onDownload, onEdit }: {
    node: FileNode, onClick: () => void, isOwner: boolean,
    onRename: () => void, onDelete: () => void, onDownload: () => void, onEdit: () => void
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Icon Selection
    let Icon = FileCode;
    let color = "#64748b";
    if (node.type === 'directory') {
        Icon = Folder;
        color = "#6366f1";
    } else if (node.mimeType?.startsWith('image/')) {
        Icon = ImageIcon;
        color = "#10b981"; // Green for images
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s', gap: '10px', position: 'relative' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={(e) => {
                // Ignore clicks on menu
                if ((e.target as HTMLElement).closest('.file-menu-btn') || (e.target as HTMLElement).closest('.file-menu')) return;
                onClick();
            }}
        >
            <Icon size={18} color={color} />
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: node.type === 'directory' ? 600 : 400 }}>{node.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '10px' }}>{formatBytes(node.size)}</div>

            {/* Menu Button */}
            <div className="file-menu-btn" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}>
                <MoreVertical size={16} color="var(--text-muted)" />
            </div>

            {/* Dropdown Menu */}
            {isMenuOpen && (
                <div ref={menuRef} className="file-menu glass-card" style={{
                    position: 'absolute', right: '30px', top: '20px', zIndex: 100,
                    padding: '6px', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '2px',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', background: 'var(--glass-surface)'
                }}>
                    {isOwner ? (
                        <>
                            <div onClick={() => { setIsMenuOpen(false); onEdit(); }} style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }} className="hover:bg-white/10">
                                <Edit2 size={14} /> Edit
                            </div>
                            <div onClick={() => { setIsMenuOpen(false); onRename(); }} style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }} className="hover:bg-white/10">
                                <Pencil size={14} /> Rename
                            </div>
                            <div onClick={() => { setIsMenuOpen(false); onDelete(); }} style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#ff4444' }} className="hover:bg-white/10">
                                <Trash2 size={14} /> Delete
                            </div>
                        </>
                    ) : (
                        <div onClick={() => { setIsMenuOpen(false); onDownload(); }} style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }} className="hover:bg-white/10">
                            <Download size={14} /> Download
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
