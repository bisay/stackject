import { X, Copy, Check, Terminal, ExternalLink, Edit2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface CodeViewerProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    content: string; // URL for images, Text for code
    type?: 'text' | 'image';
    isEditable?: boolean;
    onSave?: (newContent: string) => Promise<void>;
}

export default function CodeViewer({ isOpen, onClose, fileName, content, type = 'text', isEditable = false, onSave }: CodeViewerProps) {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState<string>(content ?? '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setEditedContent(content ?? '');
        setIsEditing(false);
    }, [content, isOpen]);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (type === 'text') {
            navigator.clipboard.writeText(isEditing ? editedContent : content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = async () => {
        if (onSave) {
            setSaving(true);
            try {
                await onSave(editedContent);
                setIsEditing(false);
            } catch (error) {
                console.error("Failed to save", error);
            } finally {
                setSaving(false);
            }
        }
    };

    const detectLanguage = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'js':
            case 'jsx': return 'javascript';
            case 'ts':
            case 'tsx': return 'typescript';
            case 'py': return 'python';
            case 'html': return 'html';
            case 'css': return 'css';
            case 'json': return 'json';
            case 'md': return 'markdown';
            case 'sql': return 'sql';
            case 'java': return 'java';
            case 'cpp':
            case 'c': return 'cpp';
            case 'rs': return 'rust';
            case 'go': return 'go';
            case 'rb': return 'ruby';
            case 'php': return 'php';
            case 'sh':
            case 'bash': return 'shell'; // Monaco uses 'shell' not 'bash' typically, but let's check. 'shell' is safer.
            case 'yaml':
            case 'yml': return 'yaml';
            default: return undefined;
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Backdrop */}
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}></div>

            {/* Modal */}
            <div className="glass-card" style={{
                width: '90vw', maxWidth: '1000px', height: '85vh',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                background: '#1e1e1e', border: '1px solid #30363d',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)', borderRadius: '12px'
            }}>

                {/* Header */}
                <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#161b22' }}>
                    <div style={{ fontWeight: 600, color: '#e6edf3', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Terminal size={18} color="#7d8590" />
                        <span>{fileName}</span>
                        {isEditing && <span style={{ fontSize: '0.8rem', color: '#e3b341' }}>(Editing)</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        {isEditable && type === 'text' && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="btn-ghost" title="Edit File" style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#c9d1d9', borderColor: '#30363d', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Edit2 size={16} /> Edit
                            </button>
                        )}
                        {isEditing && (
                            <>
                                <button onClick={() => { setIsEditing(false); setEditedContent(content ?? ''); }} className="btn-ghost" style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#f85149', borderColor: '#30363d', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                                </button>
                            </>
                        )}

                        {type === 'text' && !isEditing && (
                            <button onClick={handleCopy} className="btn-ghost" title="Copy Content" style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#c9d1d9', borderColor: '#30363d', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                {copied ? <Check size={16} color="#2ea043" /> : <Copy size={16} />}
                            </button>
                        )}
                        {type === 'image' && (
                            <a href={content} target="_blank" rel="noopener noreferrer" className="btn-ghost" title="Open Original" style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#c9d1d9', borderColor: '#30363d', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                                <ExternalLink size={16} />
                            </a>
                        )}
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b949e', marginLeft: '10px' }}>
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflow: 'hidden', background: '#1e1e1e', display: 'flex', position: 'relative' }}>
                    {type === 'image' ? (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-conic-gradient(#161b22 0% 25%, #0d1117 0% 50%) 50% / 20px 20px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={content} alt={fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} />
                        </div>
                    ) : (
                        <Editor
                            height="100%"
                            language={detectLanguage(fileName)}
                            value={isEditing ? editedContent : content}
                            theme="vs-dark"
                            options={{
                                readOnly: !isEditing,
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: 'on',
                                scrollBeyondLastLine: false,
                                padding: { top: 16, bottom: 16 }
                            }}
                            onChange={(value) => setEditedContent(value ?? '')}
                        />
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid #30363d', background: '#161b22', color: '#8b949e', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <span>UTF-8</span>
                        <span>{type === 'text' ? (detectLanguage(fileName) || 'TEXT').toUpperCase() : 'Image'}</span>
                    </div>
                    <span>{isEditable && !isEditing ? 'Read-Only (Click Edit to change)' : isEditing ? 'Editing Mode' : 'ReadOnly'}</span>
                </div>

            </div>
        </div>
    );
}
