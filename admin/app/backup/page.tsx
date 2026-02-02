"use client";
import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Database, Download, Trash2, RotateCcw, Plus, HardDrive, Clock, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/confirmation-modal';

interface Backup {
    filename: string;
    size: number;
    createdAt: string;
    isUploaded?: boolean;
}

export default function BackupPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [backups, setBackups] = useState<Backup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        actionLabel: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        actionLabel: 'Confirm',
        onConfirm: () => { }
    });

    const triggerConfirm = (title: string, message: string, type: 'danger' | 'warning' | 'info', actionLabel: string, onConfirm: () => void) => {
        setConfirmModal({ isOpen: true, title, message, type, actionLabel, onConfirm });
    };

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (!loading && user && user.role !== 'ADMIN') router.push('/dashboard');
        if (user && user.role === 'ADMIN') {
            fetchBackups();
            fetchSettings();
        }
    }, [user, loading, router]);

    const fetchBackups = async () => {
        try {
            const res = await api.get('/admin/backups');
            setBackups(res.data);
        } catch (err) {
            console.error('Failed to fetch backups', err);
            toast.error('Failed to load backups');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/backups/settings');
            setSettings(res.data);
        } catch (err) {
            console.error('Failed to fetch settings', err);
        }
    };

    const handleCreateBackup = async () => {
        setIsCreating(true);
        try {
            const res = await api.post('/admin/backup');
            toast.success(`Backup created: ${res.data.filename}`);
            fetchBackups();
        } catch (err: any) {
            console.error('Failed to create backup', err);
            toast.error(err.response?.data?.message || 'Failed to create backup');
        } finally {
            setIsCreating(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file extension
        const allowedExtensions = ['.sql', '.dump', '.backup'];
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        if (!allowedExtensions.includes(ext)) {
            toast.error('Only .sql, .dump, or .backup files are allowed');
            return;
        }

        // Validate file size (500MB max)
        if (file.size > 500 * 1024 * 1024) {
            toast.error('File size must be less than 500MB');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/admin/backup/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success(res.data.message || 'Backup uploaded successfully');
            fetchBackups();
        } catch (err: any) {
            console.error('Failed to upload backup', err);
            toast.error(err.response?.data?.message || 'Failed to upload backup');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const response = await api.get(`/admin/backups/${filename}/download`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Download started');
        } catch (err) {
            console.error('Failed to download backup', err);
            toast.error('Failed to download backup');
        }
    };

    const handleDelete = (filename: string) => {
        triggerConfirm(
            'Delete Backup?',
            `Are you sure you want to delete "${filename}"? This action cannot be undone.`,
            'danger',
            'Delete',
            async () => {
                try {
                    await api.delete(`/admin/backups/${filename}`);
                    toast.success('Backup deleted');
                    fetchBackups();
                } catch (err) {
                    console.error('Failed to delete backup', err);
                    toast.error('Failed to delete backup');
                }
            }
        );
    };

    const handleRestore = (filename: string) => {
        triggerConfirm(
            '⚠️ Restore Database?',
            `WARNING: This will overwrite the current database with the backup "${filename}". All data created after this backup will be LOST. Are you absolutely sure?`,
            'danger',
            'Yes, Restore',
            async () => {
                try {
                    toast.loading('Restoring database...');
                    await api.post(`/admin/backups/${filename}/restore`);
                    toast.dismiss();
                    toast.success('Database restored successfully');
                } catch (err: any) {
                    toast.dismiss();
                    console.error('Failed to restore backup', err);
                    toast.error(err.response?.data?.message || 'Failed to restore backup');
                }
            }
        );
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading || !user) {
        return (
            <main>
                <Navbar />
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>Loading...</div>
            </main>
        );
    }

    return (
        <main style={{ minHeight: '100vh' }}>
            <Navbar />
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".sql,.dump,.backup"
                style={{ display: 'none' }}
            />
            
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Database size={28} />
                            Database Backups
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Manage database backups and restore points
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-surface)', border: '1px solid var(--glass-border)', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-main)' }}
                        >
                            {isUploading ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16 }} />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Upload Backup
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleCreateBackup}
                            disabled={isCreating}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isCreating ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16 }} />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Create Backup
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <HardDrive size={20} style={{ color: 'var(--accent)' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Backups</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{backups.length}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <Clock size={20} style={{ color: 'var(--secondary)' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Latest Backup</span>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                            {backups.length > 0 ? formatDate(backups[0].createdAt) : 'No backups yet'}
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <Database size={20} style={{ color: '#10b981' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Size</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                            {formatSize(backups.reduce((acc, b) => acc + b.size, 0))}
                        </div>
                    </div>
                </div>

                {/* Warning Notice */}
                <div className="glass-card" style={{ 
                    padding: '1rem 1.5rem', 
                    marginBottom: '2rem', 
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <AlertTriangle size={24} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    <div>
                        <strong style={{ color: '#f59e0b' }}>Important:</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            Backups require PostgreSQL tools (pg_dump/psql) to be installed on the server. 
                            For production, consider using managed database services with automatic backups.
                        </span>
                    </div>
                </div>

                {/* Backups List */}
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ 
                        padding: '1rem 1.5rem', 
                        borderBottom: '1px solid var(--glass-border)',
                        background: 'rgba(255,255,255,0.02)'
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Backup History</h2>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Loading backups...
                        </div>
                    ) : backups.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Database size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>No backups found</p>
                            <p style={{ fontSize: '0.9rem' }}>Create your first backup to get started</p>
                        </div>
                    ) : (
                        <div>
                            {backups.map((backup, index) => (
                                <div 
                                    key={backup.filename}
                                    style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '1rem 1.5rem',
                                        borderBottom: index < backups.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ 
                                            width: 40, 
                                            height: 40, 
                                            borderRadius: '10px',
                                            background: 'rgba(var(--accent-rgb), 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Database size={20} style={{ color: 'var(--accent)' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {backup.filename}
                                                {index === 0 && (
                                                    <span style={{ 
                                                        marginLeft: '0.5rem',
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        background: 'rgba(16, 185, 129, 0.2)',
                                                        color: '#10b981',
                                                        borderRadius: '4px'
                                                    }}>
                                                        Latest
                                                    </span>
                                                )}
                                                {backup.isUploaded && (
                                                    <span style={{ 
                                                        marginLeft: '0.5rem',
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        background: 'rgba(139, 92, 246, 0.2)',
                                                        color: '#8b5cf6',
                                                        borderRadius: '4px'
                                                    }}>
                                                        Uploaded
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {formatDate(backup.createdAt)} • {formatSize(backup.size)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleDownload(backup.filename)}
                                            className="btn-ghost"
                                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                                            title="Download"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRestore(backup.filename)}
                                            className="btn-ghost"
                                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', color: '#f59e0b' }}
                                            title="Restore"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(backup.filename)}
                                            className="btn-ghost"
                                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', color: '#ef4444' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                actionLabel={confirmModal.actionLabel}
                onConfirm={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />

            <style jsx>{`
                .spinner {
                    border: 2px solid transparent;
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
