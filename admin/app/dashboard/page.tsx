"use client";
import { useEffect, useState } from 'react';
import api, { getBackendUrl } from '@/lib/api';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Rocket, MessageSquare, MessageCircle, Star, Plus, Activity, Settings } from 'lucide-react';
import UploadModal from '@/components/upload-modal';
import ConfirmationModal from '@/components/confirmation-modal';
import EditProjectModal from '@/components/edit-project-modal';
import SettingsModal from '@/components/settings-modal';

export default function Dashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const refreshData = () => {
        if (user) {
            api.get('/users/dashboard')
                .then(res => setData(res.data))
                .catch(err => console.error(err));
        }
    };

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (user) refreshData();
    }, [user, loading, router]);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<any>(null);

    const handleEdit = (project: any) => {
        setEditingProject(project);
        setIsEditOpen(true);
    };

    const [showAllActivity, setShowAllActivity] = useState(false);

    const handleDelete = (id: string) => {
        triggerConfirm(
            'Delete Project?',
            'This action cannot be undone. All files and data associated with this project will be permanently removed.',
            'danger',
            'Delete Forever',
            async () => {
                try {
                    await api.delete(`/projects/${id}`);
                    refreshData();
                } catch (err) {
                    console.error(err);
                    triggerConfirm('Error', 'Failed to delete project. Please try again.', 'info', 'OK', () => { });
                }
            }
        );
    };

    const handleArchive = (id: string) => {
        triggerConfirm(
            'Archive Project',
            'This project will be hidden from the public eye. You can view or restore it anytime from your dashboard.',
            'warning',
            'Archive',
            async () => {
                try {
                    await api.patch(`/projects/${id}/archive`);
                    refreshData();
                } catch (err) {
                    console.error(err);
                    triggerConfirm('Error', 'Failed to archive project.', 'info', 'OK', () => { });
                }
            }
        );
    };

    const handleUnarchive = (id: string) => {
        triggerConfirm(
            'Restore Project',
            'This project will be made public again. Are you ready to redeploy?',
            'info',
            'Restore',
            async () => {
                try {
                    await api.patch(`/projects/${id}/unarchive`);
                    refreshData();
                } catch (err) {
                    console.error(err);
                    triggerConfirm('Error', 'Failed to restore project.', 'info', 'OK', () => { });
                }
            }
        );
    };

    if (!data) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Activity className="spin" /> Loading Command Center...</div>;

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                actionLabel={confirmModal.actionLabel}
            />
            {editingProject && (
                <EditProjectModal
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    project={editingProject}
                    onSuccess={() => { refreshData(); }}
                />
            )}
            <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 2rem' }}>

                {/* Header */}
                <div className="responsive-flex" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', wordBreak: 'break-word' }}>Welcome back, {user?.name || 'Commander'}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Here is your operational overview.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button onClick={() => router.push('/messages')} className="glass-card" style={{
                            padding: '10px 20px', borderRadius: '100px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            border: '1px solid var(--glass-border)', cursor: 'pointer',
                            color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600
                        }}>
                            <MessageCircle size={18} /> Messages
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} className="glass-card" style={{
                            padding: '10px 20px', borderRadius: '100px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            border: '1px solid var(--glass-border)', cursor: 'pointer',
                            color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600
                        }}>
                            <Settings size={18} /> Settings
                        </button>
                    </div>
                </div>

                <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <StatCard title="Total Projects" value={data.stats.totalProjects} icon={<Rocket size={24} color="#FF0080" />} />
                    <StatCard title="Followers" value={data.counts?.followers || 0} icon={<Star size={24} color="#FFD200" />} />
                    <StatCard title="Following" value={data.counts?.following || 0} icon={<Activity size={24} color="#00DFD8" />} />
                    <StatCard title="Discussions" value={data.stats.totalDiscussions} icon={<MessageSquare size={24} color="#7928CA" />} />
                </div>

                {/* Content Split */}
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                    {/* Main Column: Projects */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', margin: 0 }}>My Projects</h2>
                                <button onClick={() => setIsUploadOpen(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Plus size={16} /> New Project
                                </button>
                            </div>

                            {data.projects.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No projects deployed yet.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {data.projects.map((p: any) => (
                                        <div key={p.id} className="project-card" style={{ background: 'var(--btn-ghost-bg)', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--glass-border)', opacity: p.status === 'archived' ? 0.6 : 1, gap: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', overflow: 'hidden' }}>
                                                {p.imageUrl && <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: `url(${getBackendUrl()}${p.imageUrl}) center/cover`, flexShrink: 0 }}></div>}
                                                {!p.imageUrl && <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--glass-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Rocket size={20} color="var(--primary)" /></div>}
                                                <div style={{ cursor: 'pointer', overflow: 'hidden', minWidth: 0 }} onClick={() => router.push(`/c/${user?.username}/project/${p.slug}`)}>
                                                    <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="hover:text-primary">{p.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.slug} • <span style={{ textTransform: 'uppercase', fontSize: '0.7em', padding: '2px 6px', borderRadius: '4px', background: p.status === 'archived' ? 'rgba(255,165,0,0.1)' : 'rgba(0,255,0,0.1)', color: p.status === 'archived' ? 'orange' : 'green' }}>{p.status || 'Active'}</span></div>
                                                </div>
                                            </div>
                                            <div className="project-actions" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                                <button className="btn-ghost" onClick={() => router.push(`/c/${user?.username}/project/${p.slug}`)} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>View</button>
                                                <button className="btn-ghost" onClick={() => handleEdit(p)} style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text-main)' }}>Edit</button>
                                                {p.status !== 'archived' ? (
                                                    <button className="btn-ghost" onClick={() => handleArchive(p.id)} style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Archive</button>
                                                ) : (
                                                    <button className="btn-ghost" onClick={() => handleUnarchive(p.id)} style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>Restore</button>
                                                )}
                                                <button className="btn-ghost" onClick={() => handleDelete(p.id)} style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Side Column: Activity & Followers */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Followers */}
                        <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                <Star size={20} color="#FFD200" />
                                <h3 style={{ margin: 0 }}>New Followers</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {data.followers && data.followers.length > 0 ? data.followers.map((f: any) => (
                                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => router.push(`/c/${f.username}`)}>
                                        {f.avatarUrl ? (
                                            <img src={f.avatarUrl} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>
                                                {f.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{f.name}</div>
                                    </div>
                                )) : (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No new followers yet.</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                                <Activity size={20} color="#666" />
                                <h3 style={{ margin: 0 }}>Recent Activity</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {(showAllActivity ? data.recentActivity.comments : data.recentActivity.comments.slice(0, 3)).map((c: any) => (
                                    <div key={c.id} style={{ fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                                        <div style={{ color: 'var(--secondary)', marginBottom: '4px', fontWeight: 600 }}>On: {c.discussion?.title}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>"{c.content.substring(0, 50)}..."</div>
                                    </div>
                                ))}
                                {data.recentActivity.comments.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No recent transmissions.</span>}
                                {data.recentActivity.comments.length > 3 && (
                                    <button
                                        onClick={() => setShowAllActivity(!showAllActivity)}
                                        className="btn-ghost"
                                        style={{ width: '100%', textAlign: 'center', fontSize: '0.85rem' }}
                                    >
                                        {showAllActivity ? "Show Less" : "Show More"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSuccess={() => {
                    refreshData();
                }}
            />
            <style jsx>{`
                @media (max-width: 768px) {
                    .project-card {
                        flex-direction: column;
                        align-items: flex-start !important;
                    }
                    .project-actions {
                        width: 100%;
                        justify-content: space-between;
                        flex-wrap: wrap;
                    }
                    .project-actions button {
                        flex: 1;
                        text-align: center;
                    }
                }
            `}</style>
        </main>
    );
}

function StatCard({ title, value, icon }: any) {
    return (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '12px', background: 'var(--btn-ghost-bg)', borderRadius: '12px' }}>
                {icon}
            </div>
            <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{value}</div>
            </div>
        </div>
    );
}
