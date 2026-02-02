"use client";
import { X, AlertTriangle, RefreshCw, Copy } from 'lucide-react';

interface DuplicateFileModalProps {
    isOpen: boolean;
    fileName: string;
    filePath: string;
    onClose: () => void;
    onReplace: () => void;
    onKeepBoth: () => void;
}

export default function DuplicateFileModal({ 
    isOpen, 
    fileName, 
    filePath,
    onClose, 
    onReplace, 
    onKeepBoth 
}: DuplicateFileModalProps) {
    if (!isOpen) return null;

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
                    maxWidth: '450px',
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
                    background: 'rgba(251, 146, 60, 0.1)'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(251, 146, 60, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertTriangle size={22} color="#fb923c" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                            File Sudah Ada
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                            Pilih tindakan untuk file ini
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
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-main)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 600, 
                            color: 'var(--text-main)',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all'
                        }}>
                            {fileName}
                        </div>
                        <div style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--text-muted)',
                            marginTop: '4px',
                            fontFamily: 'monospace'
                        }}>
                            {filePath}
                        </div>
                    </div>

                    <p style={{ 
                        fontSize: '0.9rem', 
                        color: 'var(--text-muted)', 
                        marginBottom: '1.5rem',
                        lineHeight: 1.6
                    }}>
                        File dengan nama yang sama sudah ada di lokasi ini. Apa yang ingin Anda lakukan?
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            onClick={onReplace}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem',
                                background: 'rgba(251, 146, 60, 0.15)',
                                border: '1px solid rgba(251, 146, 60, 0.3)',
                                borderRadius: '10px',
                                color: '#fb923c',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                textAlign: 'left'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(251, 146, 60, 0.25)';
                                e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.5)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(251, 146, 60, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(251, 146, 60, 0.3)';
                            }}
                        >
                            <RefreshCw size={22} />
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '2px' }}>Timpa File Lama</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                    Ganti file yang ada dengan file baru
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={onKeepBoth}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1rem',
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '10px',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                textAlign: 'left'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                            }}
                        >
                            <Copy size={22} />
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '2px' }}>Pertahankan Kedua File</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                    Simpan file baru dengan nama berbeda
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '10px',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontSize: '0.9rem'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            Batalkan
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
