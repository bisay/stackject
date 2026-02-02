"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { Share2, MoreHorizontal, Github, ExternalLink, Heart, MessageSquare, ArrowLeft, Plus, X, Code, Layers, BadgeCheck, Sparkles, Link2, Check } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'files' | 'discussions'>('files');
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isNewDiscussionOpen, setIsNewDiscussionOpen] = useState(false);
    const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null); // New state for inline view
    
    // Like/Love state
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [likeLoading, setLikeLoading] = useState(false);
    const [copied, setCopied] = useState(false);

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
            } else {
                setDiscussions([]);
            }
        } catch (err) {
            console.error("Failed to load project", err);
        } finally {
            setLoading(false);
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
                    <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
                        <button
                            onClick={() => setActiveTab('files')}
                            style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'files' ? 600 : 400, color: activeTab === 'files' ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0.5rem', borderBottom: activeTab === 'files' ? '2px solid var(--primary)' : '2px solid transparent' }}
                        >
                            <Code size={18} /> Codebase
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
                        <FileExplorer projectId={project.id} isOwner={isOwner} />
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
