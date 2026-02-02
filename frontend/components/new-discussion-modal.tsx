"use client";
import { useState } from 'react';
import { X, Loader2, MessageSquare, Tag } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import RichEditor from '@/components/editor/rich-editor';

interface NewDiscussionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    projectId?: string; // Optional context
}

export default function NewDiscussionModal({ isOpen, onClose, onSuccess, projectId }: NewDiscussionModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');

    const handleSubmit = async () => {
        if (!title || !content || content === '<p></p>') {
            toast.warning("Incomplete Post", { description: "Please provide a title and content to start a discussion." });
            return;
        }

        setLoading(true);
        try {
            await api.post('/discussions', {
                title,
                content,
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                projectId: projectId || undefined // Send projectId if exists
            });
            toast.success("Discussion Posted!", { description: "Your topic is now live." });
            onSuccess();
            onClose();
            setTitle('');
            setContent('');
            setTags('');
        } catch (err: any) {
            // ... keep error handling ...
            console.error(err);
            const msg = err.response?.data?.message || err.message || "Failed to post discussion";
            toast.error("Failed to Post", { description: Array.isArray(msg) ? msg.join(', ') : msg });
        } finally {
            setLoading(false);
        }
    };

    // ... keep rest of the component same ...
    if (!isOpen) return null;

    const handleImageUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/discussions/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data.url;
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload image");
            throw err;
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)' }}></div>

            <div className="glass-card" style={{ width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageSquare size={24} color="var(--secondary)" />
                        {projectId ? 'Ask about this Project' : 'Start a Discussion'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
                </div>

                <div style={{ padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Title</label>
                        <input
                            placeholder="What's on your mind?"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={{ fontSize: '1.2rem', fontWeight: 600 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                            Content
                            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '10px' }}>Type '@' to mention projects</span>
                        </label>
                        <RichEditor content={content} onChange={setContent} onImageUpload={handleImageUpload} />
                    </div>

                    <div>
                        <label style={{ marginBottom: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Tag size={16} /> Tags</label>
                        <input
                            placeholder="react, bug, feature-request (comma separated)"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                        />
                    </div>

                </div>

                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} className="btn-ghost" disabled={loading}>Cancel</button>
                    <button onClick={handleSubmit} className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {loading ? <Loader2 className="spin" size={18} /> : 'Post Discussion'}
                    </button>
                </div>
            </div>
        </div>
    );
}
