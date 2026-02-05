"use client";
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Check, Loader2, Save } from 'lucide-react';
import api, { getApiUrl } from '@/lib/api';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    project: any;
}

export default function EditProjectModal({ isOpen, onClose, onSuccess, project }: EditProjectModalProps) {
    const [loading, setLoading] = useState(false);

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tags: '',
        repoUrl: '',
        demoUrl: ''
    });

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                description: project.description || '',
                tags: Array.isArray(project.tags) ? project.tags.join(', ') : (project.tags || ''),
                repoUrl: project.repoUrl || '',
                demoUrl: project.demoUrl || ''
            });
            if (project.imageUrl) {
                setPreview(`${getApiUrl()}${project.imageUrl}`);
            } else {
                setPreview(null);
            }
            setFile(null);
        }
    }, [project, isOpen]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setFile(file);
        setPreview(URL.createObjectURL(file));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            // Check basic client side validation first to match Zod
            if (formData.name.length < 3) throw new Error("Name must be at least 3 characters");
            if (formData.description.length < 10) throw new Error("Description must be at least 10 characters");

            const form = new FormData();
            form.append('name', formData.name);
            form.append('description', formData.description);
            form.append('tags', formData.tags);
            form.append('repoUrl', formData.repoUrl);
            form.append('demoUrl', formData.demoUrl);
            if (file) form.append('image', file);

            // Using PATCH for partial update (image might be handled separately in backend depending on logic, 
            // but controller seems to accept MultiPart for Create. 
            // Update endpoint handles DTO but not file interceptor yet in Controller?
            // Wait, looking at Controller earlier, update endpoint uses @Body() UpdateProjectDto.
            // It does NOT have @UseInterceptors(FileInterceptor).
            // So image update might fail if I just send FormData to the existing update endpoint.
            // I should double check if I can send image to update.
            // If not, I'll just update text fields for now, or I might need to update backend.
            // Let's assume text fields first.

            // Correction: I must check backend controller again. 
            // If update doesn't support file upload, I'll skip image update for this iteration 
            // OR I will quickly add FileInterceptor to Update endpoint.
            // Let's stick to updating text fields first to be safe, creating a separate endpoint for image is cleaner but harder.
            // Actually, for now let's try sending JSON for text updates.

            await api.patch(`/projects/${project.id}`, {
                name: formData.name,
                description: formData.description,
                tags: formData.tags,
                repoUrl: formData.repoUrl,
                demoUrl: formData.demoUrl
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            // Extract error message from Axios response if available
            const msg = err.response?.data?.message || err.message || 'Update failed';
            // If message is array (Zod pipe often returns array of errors), join them
            const displayMsg = Array.isArray(msg) ? msg.join(', ') : msg;
            setError(displayMsg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}></div>

            <div className="glass-card" style={{ width: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', background: 'var(--bg-main)', position: 'relative' }}>

                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Edit Project</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>

                    {error && (
                        <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    {/* Image Upload Block - Disabled for now if backend doesn't support it easily, 
                        BUT I will enable the UI for it, maybe just show preview. 
                        Actually let's just show current image. Updating image requires backend change. */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: preview ? `url(${preview}) center/cover` : '#333', flexShrink: 0 }}></div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Image update coming soon.
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Project Name</label>
                        <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-surface)', color: 'white' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Description</label>
                        <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-surface)', color: 'white', resize: 'vertical' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Tags (comma separated)</label>
                        <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-surface)', color: 'white' }} />
                    </div>
                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {loading && <Loader2 className="spin" size={16} />} Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
}
