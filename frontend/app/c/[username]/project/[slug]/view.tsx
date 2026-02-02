"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { Share2, MoreHorizontal, Github, ExternalLink, Heart, MessageSquare, ArrowLeft, Plus, X, Code, Layers, BadgeCheck, Sparkles, Link2, Check, Download, Users, History, FileText, FilePlus, FileEdit, RefreshCw } from 'lucide-react';
import FileExplorer from '@/components/file-explorer';
import EditProjectModal from '@/components/edit-project-modal';
import DiscussionListItem from '@/components/discussion-list-item';
import { toast } from 'sonner';

interface Project {
    id: string;
    name: string;
    description: string;
    slug: string;
    owner: {
        id: string;
        name: string;
        username: string;
        role?: 'USER' | 'ADMIN';
    };
    imageUrl?: string;
    repoUrl?: string;
    demoUrl?: string;
    tags?: string[];
    _count?: {
        discussions: number;
        followers: number;
    };
}

interface Discussion {
    id: string;
    title: string;
    createdAt: string;
    author: {
        name: string;
    };
    _count: {
        comments: number;
    };
}

interface ChangeLog {
    id: string;
    fileName: string;
    filePath: string;
    changeType: 'ADD' | 'UPDATE' | 'REPLACE';
    description?: string;
    createdAt: string;
    changedBy?: {
        name: string;
        username: string;
    };
}

import NewDiscussionModal from '@/components/new-discussion-modal';
import DiscussionDetail from '@/components/discussion-detail';

export default function ProjectDetailView() {
    // ... [keep existing hooks]
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();

    // Handle array or string params
    const username = Array.isArray(params.username) ? params.username[0] : params.username;
    const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

    const [project, setProject] = useState<Project | null>(null);
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'files' | 'downloads' | 'history' | 'discussions'>('files');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isNewDiscussionOpen, setIsNewDiscussionOpen] = useState(false);
    const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null); // New state for inline view
    
    // Like/Love state
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Downloads state
    const [downloads, setDownloads] = useState<any[]>([]);
    const [downloadsCount, setDownloadsCount] = useState(0);
    const [uniqueDownloaders, setUniqueDownloaders] = useState(0);
    const [downloadsLoading, setDownloadsLoading] = useState(false);
    
    // Change logs state
    const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
    const [changeLogsLoading, setChangeLogsLoading] = useState(false);

    const fetchData = async () => {
        if (!username || !slug) return;
        try {
            const projectRes = await api.get(`/projects/${username}/${slug}`);
            setProject(projectRes.data);

            // Fetch likes count using correct endpoint
            try {
                const likesRes = await api.get(`/projects/by-id/${projectRes.data.id}/likes-count`);
                setLikesCount(likesRes.data.count);
            } catch (e) {
                console.error('Failed to fetch likes count', e);
            }

            // Fetch like status if user is logged in
            if (user) {
                try {
                    const likeStatusRes = await api.get(`/projects/by-id/${projectRes.data.id}/like-status`);
                    setLiked(likeStatusRes.data.liked);
                } catch (e) {
                    // Not logged in or error
                    console.error('Failed to fetch like status', e);
                }
            }

            if (projectRes.data.id) {
                const discussionsRes = await api.get(`/discussions?projectId=${projectRes.data.id}`);
                // Backend returns 'comments' array, but UI expects '_count.comments'. Map it:
                const mappedDiscussions = discussionsRes.data.map((d: any) => ({
                    ...d,
                    _count: d._count || { comments: d.comments ? d.comments.length : 0 }
                }));
                setDiscussions(mappedDiscussions);
                
                // Fetch downloads
                fetchDownloads(projectRes.data.id);
                
                // Fetch change logs
                fetchChangeLogs(projectRes.data.id);
            } else {
                setDiscussions([]);
            }
        } catch (err) {
            console.error("Failed to load project", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDownloads = async (projectId: string) => {
        try {
            setDownloadsLoading(true);
            const res = await api.get(`/files/projects/${projectId}/downloads`);
            setDownloads(res.data.downloads || []);
            setDownloadsCount(res.data.totalCount || 0);
            setUniqueDownloaders(res.data.uniqueDownloaders || 0);
        } catch (err) {
            console.error("Failed to load downloads", err);
        } finally {
            setDownloadsLoading(false);
        }
    };

    const fetchChangeLogs = async (projectId: string) => {
        try {
            setChangeLogsLoading(true);
            const res = await api.get(`/files/projects/${projectId}/change-logs`);
            setChangeLogs(res.data || []);
        } catch (err) {
            console.error("Failed to load change logs", err);
        } finally {
            setChangeLogsLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) {
            toast.error('Please login to like this project');
            return;
        }
        if (!project || likeLoading) return;
        
        setLikeLoading(true);
        try {
            const res = await api.post(`/projects/by-id/${project.id}/like`);
            setLiked(res.data.liked);
            // Use the count returned from backend instead of calculating locally
            setLikesCount(res.data.count);
            toast.success(res.data.liked ? 'Added to favorites ❤️' : 'Removed from favorites');
        } catch (err) {
            console.error('Failed to like project', err);
            toast.error('Failed to update like');
        } finally {
            setLikeLoading(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('Link copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    useEffect(() => {
        fetchData();
    }, [username, slug, user]);

    if (loading) return (
        <main>
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>Loading...</div>
        </main>
    );

    if (!project) return (
        <main>
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>Project not found</div>
        </main>
    );

    const isOwner = user?.id === project.owner.id;
    const isAdminProject = project.owner.role === 'ADMIN';

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <button onClick={() => router.back()} className="btn-ghost" style={{ marginBottom: '2rem', paddingLeft: 0, display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Back
                </button>

                {/* Header Card */}
                <div className={isAdminProject ? 'admin-project-card' : 'glass-card'} style={{ 
                    padding: '3rem', 
                    marginBottom: '3rem'
                }}>
                    {isAdminProject && (
                        <>
                            {/* Official badge with elegant gold glow */}
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'linear-gradient(135deg, #c9a962, #e8d5a3)',
                                backgroundSize: '200% 200%',
                                animation: 'elegantBorderMove 6s ease infinite',
                                padding: '10px 20px',
                                borderRadius: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                color: '#1a1a1a',
                                boxShadow: '0 0 20px rgba(201,169,98,0.4), 0 0 40px rgba(201,169,98,0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                zIndex: 10,
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                <Sparkles size={16} /> Official Project
                            </div>
                            
                            {/* Elegant floating dots */}
                            <div style={{
                                position: 'absolute',
                                top: '70px',
                                right: '200px',
                                width: '6px',
                                height: '6px',
                                background: '#e8d5a3',
                                borderRadius: '50%',
                                boxShadow: '0 0 8px #c9a962, 0 0 16px rgba(201,169,98,0.5)',
                                animation: 'floatParticles 3s ease-in-out infinite',
                                zIndex: 5
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: '50px',
                                left: '30%',
                                width: '5px',
                                height: '5px',
                                background: '#c9a962',
                                borderRadius: '50%',
                                boxShadow: '0 0 8px #c9a962, 0 0 16px rgba(201,169,98,0.5)',
                                animation: 'floatParticles 4s ease-in-out infinite 0.5s',
                                zIndex: 5
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '60px',
                                right: '25%',
                                width: '4px',
                                height: '4px',
                                background: '#e8d5a3',
                                borderRadius: '50%',
                                boxShadow: '0 0 6px #c9a962, 0 0 12px rgba(201,169,98,0.5)',
                                animation: 'floatParticles 3.5s ease-in-out infinite 1s',
                                zIndex: 5
                            }} />
                            <div style={{
                                position: 'absolute',
                                bottom: '40px',
                                left: '15%',
                                width: '5px',
                                height: '5px',
                                background: '#c9a962',
                                borderRadius: '50%',
                                boxShadow: '0 0 8px #c9a962, 0 0 16px rgba(201,169,98,0.5)',
                                animation: 'floatParticles 4.5s ease-in-out infinite 1.5s',
                                zIndex: 5
                            }} />
                        </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                        <div style={{ flex: 1, position: 'relative', zIndex: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ 
                                    fontSize: '2.5rem', 
                                    margin: 0,
                                    color: isAdminProject ? '#ffffff' : 'inherit',
                                    fontWeight: isAdminProject ? 800 : 700,
                                    textShadow: isAdminProject ? '0 0 30px rgba(201,169,98,0.4)' : 'none'
                                }}>{project.name}</h1>
                                {project.repoUrl && (
                                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '8px', display: 'flex', alignItems: 'center' }} title="View Source">
                                        <Github size={20} />
                                    </a>
                                )}
                                {project.demoUrl && (
                                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ padding: '8px', display: 'flex', alignItems: 'center' }} title="Live Demo">
                                        <ExternalLink size={20} />
                                    </a>
                                )}
                            </div>

                            <p style={{ color: isAdminProject ? '#c9a962' : 'var(--secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: isAdminProject ? 600 : 400 }}>
                                by <Link href={`/c/${project.owner.username}`} style={{ 
                                    color: isAdminProject ? '#ffffff' : 'var(--accent)',
                                    fontWeight: isAdminProject ? 700 : 500, 
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    @{project.owner.username}
                                    {isAdminProject && (
                                        <BadgeCheck size={18} style={{ 
                                            color: '#c9a962',
                                            filter: 'drop-shadow(0 0 6px rgba(201,169,98,0.6))'
                                        }} />
                                    )}
                                </Link>
                            </p>

                            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '700px', whiteSpace: 'pre-wrap', marginBottom: '1.5rem', color: isAdminProject ? 'rgba(255,255,255,0.9)' : 'var(--text-main)' }}>{project.description}</p>

                            {project.tags && project.tags.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {project.tags.map((tag: string, index: number) => (
                                        <span key={tag} style={{ 
                                            background: isAdminProject 
                                                ? 'rgba(201,169,98,0.15)'
                                                : 'rgba(255,255,255,0.1)', 
                                            padding: '6px 12px', 
                                            borderRadius: '8px', 
                                            fontSize: '0.85rem', 
                                            color: isAdminProject ? '#e8d5a3' : 'var(--text-muted)',
                                            border: isAdminProject ? '1px solid rgba(201,169,98,0.3)' : 'none',
                                            backdropFilter: isAdminProject ? 'blur(10px)' : 'none'
                                        }}>#{tag}</span>
                                    ))}
                                </div>
                            )}

                            {/* Love and Share buttons */}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
                                <button 
                                    onClick={handleLike}
                                    disabled={likeLoading}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px',
                                        padding: '14px 28px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: liked 
                                            ? 'linear-gradient(135deg, #ff3366, #ff6b8a)' 
                                            : '#2a2a3e',
                                        color: liked ? 'white' : '#ff6b8a',
                                        cursor: likeLoading ? 'wait' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        fontSize: '1.05rem',
                                        fontWeight: 700,
                                        boxShadow: liked 
                                            ? '0 6px 25px rgba(255,51,102,0.5)' 
                                            : '0 4px 15px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    <Heart 
                                        size={24} 
                                        fill={liked ? 'white' : 'none'} 
                                        strokeWidth={2.5}
                                        style={{ transition: 'all 0.3s ease' }}
                                    />
                                    <span style={{ minWidth: '20px' }}>{likesCount}</span>
                                </button>

                                <button 
                                    onClick={handleShare}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px',
                                        padding: '14px 28px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: copied ? '#1a4a3a' : '#1a2a3e',
                                        color: copied ? '#00ff9d' : '#00b8ff',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        fontSize: '1.05rem',
                                        fontWeight: 700,
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {copied ? <Check size={24} strokeWidth={2.5} /> : <Link2 size={24} strokeWidth={2.5} />}
                                    <span>{copied ? 'Copied!' : 'Share'}</span>
                                </button>
                            </div>

                            {isOwner && (
                                <button onClick={() => setIsEditOpen(true)} className="btn-ghost" style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    Edit Project Settings
                                </button>
                            )}
                        </div>

                        {project.imageUrl && (
                            <div style={{
                                width: '160px', 
                                height: '160px', 
                                borderRadius: isAdminProject ? '20px' : '12px',
                                background: `url(${project.imageUrl.startsWith('http') ? project.imageUrl : `http://localhost:3001${project.imageUrl}`}) center/cover`,
                                border: isAdminProject ? '3px solid transparent' : '1px solid var(--glass-border)',
                                flexShrink: 0,
                                boxShadow: isAdminProject 
                                    ? '0 10px 40px rgba(255,0,128,0.3), 0 15px 50px rgba(121,40,202,0.2), 0 0 0 3px rgba(255,255,255,0.1)'
                                    : '0 8px 20px rgba(0,0,0,0.2)',
                                position: 'relative',
                                ...(isAdminProject ? {
                                    backgroundClip: 'padding-box'
                                } : {})
                            }}>
                                {isAdminProject && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: '-3px',
                                        borderRadius: '22px',
                                        background: 'linear-gradient(135deg, #ff0080, #ff8c00, #00ff87, #00dfff, #8c00ff)',
                                        backgroundSize: '300% 300%',
                                        animation: 'adminRainbowFlow 4s ease infinite',
                                        zIndex: -1
                                    }} />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                {/* Hide tabs if viewing a specific discussion to reduce clutter, or keep them? Keeping them might be confusing. */}
                {!selectedDiscussionId && (
                    <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setActiveTab('files')}
                            style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'files' ? 600 : 400, color: activeTab === 'files' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.5rem', borderBottom: activeTab === 'files' ? '2px solid var(--primary)' : '2px solid transparent' }}
                        >
                            <Code size={18} /> Codebase
                        </button>
                        <button
                            onClick={() => setActiveTab('downloads')}
                            style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'downloads' ? 600 : 400, color: activeTab === 'downloads' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.5rem', borderBottom: activeTab === 'downloads' ? '2px solid var(--primary)' : '2px solid transparent' }}
                        >
                            <Download size={18} /> Downloads ({uniqueDownloaders})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'history' ? 600 : 400, color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.5rem', borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent' }}
                        >
                            <History size={18} /> Riwayat ({changeLogs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('discussions')}
                            style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'discussions' ? 600 : 400, color: activeTab === 'discussions' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.5rem', borderBottom: activeTab === 'discussions' ? '2px solid var(--primary)' : '2px solid transparent' }}
                        >
                            <MessageSquare size={18} /> Discussions ({discussions.length})
                        </button>
                    </div>
                )}

                {/* Content */}
                {activeTab === 'files' && !selectedDiscussionId && (
                    <div>
                        <FileExplorer 
                            projectId={project.id} 
                            isOwner={isOwner} 
                            onFilesChanged={() => fetchChangeLogs(project.id)}
                        />
                    </div>
                )}

                {activeTab === 'downloads' && !selectedDiscussionId && (
                    <div>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Users size={24} /> Download History
                            </h2>
                            <div style={{ 
                                display: 'flex', 
                                gap: '1.5rem',
                                color: 'var(--text-muted)',
                                fontSize: '0.9rem'
                            }}>
                                <span><strong style={{ color: 'var(--primary)' }}>{downloadsCount}</strong> total downloads</span>
                                <span><strong style={{ color: 'var(--primary)' }}>{uniqueDownloaders}</strong> unique users</span>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            {downloadsLoading ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    Loading downloads...
                                </div>
                            ) : downloads.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <Download size={32} color="var(--primary)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>No downloads yet</h3>
                                    <p>Be the first to download this project!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {downloads.map((download, index) => (
                                        <Link
                                            key={download.id}
                                            href={`/c/${download.user.username}`}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '1rem',
                                                padding: '1rem 1.5rem',
                                                borderBottom: index < downloads.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                                textDecoration: 'none',
                                                color: 'inherit',
                                                transition: 'background 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                background: download.user.avatarUrl 
                                                    ? `url(${download.user.avatarUrl.startsWith('http') ? download.user.avatarUrl : `http://localhost:3001${download.user.avatarUrl}`}) center/cover`
                                                    : 'linear-gradient(135deg, var(--primary), var(--accent))',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: 700,
                                                fontSize: '1.1rem',
                                                flexShrink: 0
                                            }}>
                                                {!download.user.avatarUrl && (download.user.name?.[0] || download.user.username[0]).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                                                    {download.user.name || download.user.username}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    @{download.user.username}
                                                </div>
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.8rem', 
                                                color: 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                flexShrink: 0
                                            }}>
                                                <Download size={14} />
                                                {new Date(download.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && !selectedDiscussionId && (
                    <div>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <History size={24} /> Riwayat Perubahan
                            </h2>
                        </div>

                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            {changeLogsLoading ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    Loading riwayat...
                                </div>
                            ) : changeLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <History size={32} color="var(--primary)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Belum ada riwayat perubahan</h3>
                                    <p>Perubahan file akan tercatat di sini</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {changeLogs.map((log, index) => (
                                        <div
                                            key={log.id}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'flex-start', 
                                                gap: '1rem',
                                                padding: '1rem 1.5rem',
                                                borderBottom: index < changeLogs.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                            }}
                                        >
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: log.changeType === 'ADD' 
                                                    ? 'rgba(34, 197, 94, 0.15)' 
                                                    : log.changeType === 'REPLACE' 
                                                        ? 'rgba(251, 146, 60, 0.15)' 
                                                        : 'rgba(99, 102, 241, 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {log.changeType === 'ADD' && <FilePlus size={20} color="#22c55e" />}
                                                {log.changeType === 'REPLACE' && <RefreshCw size={20} color="#fb923c" />}
                                                {log.changeType === 'UPDATE' && <FileEdit size={20} color="var(--primary)" />}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                    <span style={{ 
                                                        fontWeight: 600, 
                                                        color: 'var(--text-main)',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.9rem',
                                                        background: 'rgba(99, 102, 241, 0.1)',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {log.fileName}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        background: log.changeType === 'ADD' 
                                                            ? 'rgba(34, 197, 94, 0.2)' 
                                                            : log.changeType === 'REPLACE' 
                                                                ? 'rgba(251, 146, 60, 0.2)' 
                                                                : 'rgba(99, 102, 241, 0.2)',
                                                        color: log.changeType === 'ADD' 
                                                            ? '#22c55e' 
                                                            : log.changeType === 'REPLACE' 
                                                                ? '#fb923c' 
                                                                : 'var(--primary)',
                                                        fontWeight: 600
                                                    }}>
                                                        {log.changeType === 'ADD' ? 'File Baru' : log.changeType === 'REPLACE' ? 'Ditimpa' : 'Diperbarui'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                    {log.filePath}
                                                </div>
                                                {log.description && (
                                                    <div style={{ 
                                                        fontSize: '0.85rem', 
                                                        color: 'var(--text-main)',
                                                        fontStyle: 'italic',
                                                        marginTop: '6px'
                                                    }}>
                                                        "{log.description}"
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.75rem', 
                                                color: 'var(--text-muted)',
                                                flexShrink: 0,
                                                textAlign: 'right'
                                            }}>
                                                {new Date(log.createdAt).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                                <br />
                                                {new Date(log.createdAt).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'discussions' && (
                    <div>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Community Discussions</h2>
                            {user && (
                                <button className="btn-primary" onClick={() => setIsNewDiscussionOpen(true)}>
                                    <Plus size={16} /> New Discussion
                                </button>
                            )}
                        </div>

                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            {discussions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <MessageSquare size={32} color="var(--primary)" />
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.5rem' }}>No discussions yet</h3>
                                    <p style={{ maxWidth: '400px', margin: '0 auto 1.5rem' }}>Be the first to start a conversation about this project. Ask questions, share ideas, or give feedback.</p>
                                    {user && (
                                        <button className="btn-secondary" onClick={() => setIsNewDiscussionOpen(true)}>
                                            Start a Discussion
                                        </button>
                                    )}
                                </div>
                            ) : (
                                discussions.map(d => (
                                    <div key={d.id}>
                                        {selectedDiscussionId === d.id ? (
                                            <div style={{ position: 'relative', padding: '24px', backgroundColor: 'var(--background)' }}> {/* Expanded View: Add padding/bg to stand out from list */}
                                                {/* Header / Nav for Expanded View */}
                                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                                                    <button
                                                        onClick={() => setSelectedDiscussionId(null)}
                                                        style={{
                                                            background: 'transparent', border: 'none',
                                                            color: 'var(--text-muted)', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '8px',
                                                            fontSize: '0.95rem', fontWeight: 500,
                                                            transition: 'color 0.2s', padding: 0
                                                        }}
                                                        className="hover-text-primary"
                                                    >
                                                        <ArrowLeft size={18} /> Back to Discussions
                                                    </button>
                                                </div>

                                                <DiscussionDetail
                                                    discussionId={d.id}
                                                    embedded={true}
                                                    onBack={() => setSelectedDiscussionId(null)}
                                                    onReplyAdded={() => {
                                                        // Update local list count
                                                        setDiscussions(prev => prev.map(disc =>
                                                            disc.id === d.id
                                                                ? { ...disc, _count: { ...disc._count, comments: disc._count.comments + 1 } }
                                                                : disc
                                                        ));
                                                    }}
                                                    onCountUpdate={(count) => {
                                                        // Sync actual count from server detail
                                                        setDiscussions(prev => prev.map(disc =>
                                                            disc.id === d.id && disc._count.comments !== count
                                                                ? { ...disc, _count: { ...disc._count, comments: count } }
                                                                : disc
                                                        ));
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <DiscussionListItem discussion={d} onClick={(id) => setSelectedDiscussionId(id)} />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isEditOpen && project && (
                <EditProjectModal
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    project={project}
                    onSuccess={() => {
                        fetchData();
                        setIsEditOpen(false);
                    }}
                />
            )}

            {isNewDiscussionOpen && project && (
                <NewDiscussionModal
                    isOpen={isNewDiscussionOpen}
                    onClose={() => setIsNewDiscussionOpen(false)}
                    onSuccess={() => {
                        fetchData(); // Refresh list after post
                    }}
                    projectId={project.id} // <--- Pass Project ID here
                />
            )}
        </main>
    );
}
