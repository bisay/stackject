"use client";
import { useState } from 'react';
import { X, Upload, FileText, Bug, Sparkles, Wrench, HelpCircle } from 'lucide-react';

interface UploadDescriptionModalProps {
    isOpen: boolean;
    filesCount: number;
    onClose: () => void;
    onSubmit: (description: string, changeType: string) => void;
}

const changeTypes = [
    { id: 'add', label: 'File Baru', icon: FileText, color: '#22c55e' },
    { id: 'update', label: 'Update', icon: Sparkles, color: '#6366f1' },
    { id: 'fix', label: 'Fix Bug', icon: Bug, color: '#f59e0b' },
    { id: 'refactor', label: 'Refactor', icon: Wrench, color: '#8b5cf6' },
    { id: 'other', label: 'Lainnya', icon: HelpCircle, color: '#64748b' },
];

export default function UploadDescriptionModal({ 
    isOpen, 
    filesCount,
    onClose, 
    onSubmit 
}: UploadDescriptionModalProps) {
    const [selectedType, setSelectedType] = useState('add');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        // Validate description (max 10 words)
        const words = description.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length > 10) {
            setError('Deskripsi maksimal 10 kata');
            return;
        }
        
        const typeLabel = changeTypes.find(t => t.id === selectedType)?.label || 'Update';
        const fullDescription = description.trim() 
            ? `[${typeLabel}] ${description.trim()}`
            : `[${typeLabel}]`;
        
        onSubmit(fullDescription, selectedType);
        
        // Reset state
        setSelectedType('add');
        setDescription('');
        setError('');
    };

    const handleSkip = () => {
        onSubmit('', 'add');
        setSelectedType('add');
        setDescription('');
        setError('');
    };

    const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length;

    return (
        <div 
            className="modal-overlay"
            style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div 
                className="glass-card"
                style={{ 
                    maxWidth: '500px',
                    width: '100%',
                    padding: '0',
                    overflow: 'hidden',
                    animation: 'slideUp 0.2s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ 
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    background: 'rgba(99, 102, 241, 0.1)'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Upload size={22} color="var(--primary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                            Upload {filesCount} File
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                            Tambahkan keterangan perubahan
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Change Type Selection */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: 'var(--text-main)',
                            marginBottom: '0.75rem',
                            display: 'block'
                        }}>
                            Jenis Perubahan
                        </label>
                        <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                        }}>
                            {changeTypes.map(type => {
                                const Icon = type.icon;
                                const isSelected = selectedType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '8px',
                                            border: `1px solid ${isSelected ? type.color : 'var(--glass-border)'}`,
                                            background: isSelected ? `${type.color}20` : 'transparent',
                                            color: isSelected ? type.color : 'var(--text-muted)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            fontSize: '0.85rem',
                                            fontWeight: isSelected ? 600 : 400
                                        }}
                                    >
                                        <Icon size={16} />
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description Input */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            <label style={{ 
                                fontSize: '0.85rem', 
                                fontWeight: 600, 
                                color: 'var(--text-main)'
                            }}>
                                Deskripsi (opsional)
                            </label>
                            <span style={{ 
                                fontSize: '0.75rem', 
                                color: wordCount > 10 ? '#ef4444' : 'var(--text-muted)'
                            }}>
                                {wordCount}/10 kata
                            </span>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                setError('');
                            }}
                            placeholder="Contoh: Perbaikan tampilan halaman login"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: `1px solid ${error ? '#ef4444' : 'var(--glass-border)'}`,
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-main)',
                                fontSize: '0.9rem',
                                resize: 'none',
                                minHeight: '80px',
                                outline: 'none',
                                transition: 'border-color 0.15s ease'
                            }}
                            onFocus={(e) => {
                                if (!error) e.currentTarget.style.borderColor = 'var(--primary)';
                            }}
                            onBlur={(e) => {
                                if (!error) e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }}
                        />
                        {error && (
                            <p style={{ 
                                fontSize: '0.8rem', 
                                color: '#ef4444', 
                                marginTop: '0.5rem',
                                margin: '0.5rem 0 0 0'
                            }}>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={handleSkip}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontSize: '0.9rem'
                            }}
                        >
                            Lewati
                        </button>
                        <button
                            onClick={handleSubmit}
                            style={{
                                flex: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                border: 'none',
                                borderRadius: '10px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontSize: '0.9rem',
                                fontWeight: 600
                            }}
                        >
                            <Upload size={18} />
                            Upload File
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
