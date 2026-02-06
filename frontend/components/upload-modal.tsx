"use client";
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Check, Loader2, FileCode, UploadCloud } from 'lucide-react';
import api from '@/lib/api';
import { uploadFileChunked, getRecommendedChunkSize } from '@/lib/chunked-upload';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    // Banner State
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // Source Files State
    const [sourceFiles, setSourceFiles] = useState<File[]>([]);
    const [isFolderMode, setIsFolderMode] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        tags: '',
    });

    // Banner Drop Handler
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setFile(file);
        setPreview(URL.createObjectURL(file));
    }, []);

    // Source Drop Handler
    const onSourceDrop = useCallback((acceptedFiles: File[]) => {
        setSourceFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps: getBannerProps, getInputProps: getBannerInputProps, isDragActive: isBannerDrag } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    const { getRootProps: getSourceProps, getInputProps: getSourceInputProps, isDragActive: isSourceDrag } = useDropzone({
        onDrop: onSourceDrop,
        // Helper specifically for folder upload if using the browser dialog
        useFsAccessApi: false // Disabling FS Access API sometimes helps with webkitdirectory consistency
    });

    // Custom input props for folder mode
    const sourceInputProps = getSourceInputProps();
    if (isFolderMode) {
        (sourceInputProps as any).webkitdirectory = "true";
        (sourceInputProps as any).directory = "";
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setUploadProgress('Initializing Project...');

        try {
            // 1. Create Project
            const form = new FormData();
            form.append('name', formData.name);
            form.append('slug', formData.slug);
            form.append('description', formData.description);
            form.append('tags', (formData as any).tags);
            if (file) form.append('image', file);

            const res = await api.post('/projects', form);
            const projectId = res.data.id;

            // 2. Upload Source Files (if any) - with chunked upload support
            if (sourceFiles.length > 0) {
                setUploadProgress(`Uploading ${sourceFiles.length} files...`);
                const CHUNK_THRESHOLD = 4 * 1024 * 1024; // 4MB

                for (let i = 0; i < sourceFiles.length; i++) {
                    const f = sourceFiles[i];
                    const relativePath = (f as any).path || (f as any).webkitRelativePath || f.name;

                    try {
                        if (f.size > CHUNK_THRESHOLD) {
                            // Use chunked upload for large files
                            const result = await uploadFileChunked(projectId, f, relativePath, {
                                chunkSize: getRecommendedChunkSize(f.size),
                                onProgress: (progress) => {
                                    if (progress.status === 'finalizing') {
                                        setUploadProgress(`Finalizing ${f.name}...`);
                                    } else {
                                        setUploadProgress(`Uploading ${f.name} (${progress.currentChunk}/${progress.totalChunks} chunks)`);
                                    }
                                }
                            });
                            
                            if (!result.success) {
                                console.error('Chunked upload failed:', f.name, result.error);
                            }
                        } else {
                            // Regular upload for small files
                            const fileForm = new FormData();
                            fileForm.append('file', f);
                            fileForm.append('filePath', relativePath);
                            await api.post(`/files/projects/${projectId}/upload`, fileForm);
                        }
                        setUploadProgress(`Uploaded ${i + 1}/${sourceFiles.length}`);
                    } catch (err) {
                        console.error('File upload failed', f.name, err);
                    }
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Deploy failed. Check console.');
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Backdrop */}
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}></div>

            {/* Glass Modal */}
            <div className="glass-card" style={{ width: '950px', height: '700px', display: 'flex', overflow: 'hidden', position: 'relative', background: 'var(--bg-main)' }}>

                {/* Left: Input */}
                <div style={{ flex: 1.2, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: 'var(--primary)' }}>🚀</span> Initialize Project
                    </h2>

                    {/* Banner Upload */}
                    <div {...getBannerProps()} style={{
                        border: '2px dashed var(--glass-border)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: isBannerDrag ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        transition: 'all 0.2s'
                    }}>
                        <input {...getBannerInputProps()} />
                        {file ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--secondary)' }}>
                                <Check size={20} /> {file.name}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)' }}>
                                <Upload size={24} style={{ marginBottom: '5px', opacity: 0.5 }} />
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Drop project banner here</p>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input placeholder="Project Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <input placeholder="Slug (ID)" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} />
                        <textarea rows={2} placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>

                        <input
                            placeholder="Tags (e.g. React, NextJS)"
                            value={(formData as any).tags || ''}
                            onChange={e => setFormData({ ...formData, tags: e.target.value } as any)}
                        />

                        {/* Source Code Upload */}
                        <div style={{ marginTop: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', display: 'block' }}>Source Code / Assets</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div {...getSourceProps()} style={{
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    background: isSourceDrag ? 'rgba(0, 223, 216, 0.1)' : 'var(--glass-surface)',
                                    cursor: 'pointer',
                                    minHeight: '100px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s'
                                }}>
                                    <input {...getSourceInputProps()} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                        <FileCode size={20} />
                                        <span style={{ fontSize: '0.9rem' }}>Drag & drop files here OR click to select files</span>
                                    </div>
                                    {sourceFiles.length > 0 && (
                                        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                                            {sourceFiles.slice(0, 5).map((f, i) => (
                                                <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{f.name}</span>
                                            ))}
                                            {sourceFiles.length > 5 && <span style={{ fontSize: '0.75rem' }}>+{sourceFiles.length - 5} more</span>}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <input
                                        type="file"
                                        // @ts-ignore
                                        webkitdirectory=""
                                        directory=""
                                        style={{ display: 'none' }}
                                        id="modal-folder-upload"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                // Manually triggering drop handler logic
                                                // We need to ensure paths are preserved. 
                                                // React Dropzone doesn't automatically populate `path` for manual inputs usually,
                                                // but webkitdirectory input does populate webkitRelativePath.
                                                // Our onSourceDrop just appends files. 
                                                // The upload logic later uses (f as any).webkitRelativePath which IS valid for this input.
                                                onSourceDrop(Array.from(e.target.files));
                                            }
                                        }}
                                    />
                                    <label htmlFor="modal-folder-upload" className="btn-ghost" style={{ fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', border: '1px dashed var(--primary)', padding: '8px 16px', color: 'var(--primary)' }}>
                                        <UploadCloud size={16} /> or Select an entire Folder
                                    </label>
                                </div>
                            </div>
                        </div>

                    </div>

                    <button onClick={handleSubmit} className="btn-primary" disabled={loading} style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                        {loading ? <><Loader2 className="spin" size={18} /> {uploadProgress || 'Processing...'}</> : 'Deploy & Upload'}
                    </button>
                </div>

                {/* Right: Live Preview */}
                <div style={{ flex: 1, background: 'var(--bg-subtle)', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--glass-border)' }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '350px', padding: '0', overflow: 'hidden' }}>
                        <div style={{ height: '180px', background: preview ? `url(${preview}) center/cover` : 'linear-gradient(135deg, #e0e7ff, #f3e8ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                            {!preview && "Image Preview"}
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {(formData as any).slug || 'project-slug'}
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{(formData as any).name || 'Untitled Project'}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                {(formData as any).description || 'Project description will appear here...'}
                            </p>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {(formData as any).tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag).map((tag: string) => (
                                    <span key={tag} style={{ background: 'rgba(0,0,0,0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Close */}
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>

            </div>
        </div>
    );
}
