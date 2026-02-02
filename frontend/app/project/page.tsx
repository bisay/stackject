"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { ArrowRight, BadgeCheck, Sparkles, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
    id: string;
    name: string;
    description: string;
    slug: string;
    owner?: { name: string, username: string, role?: string };
    likesCount?: number;
    isLiked?: boolean;
}

export default function ProjectPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const { user } = useAuth();

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            const projectsWithLikes = await Promise.all(
                res.data.map(async (project: Project) => {
                    try {
                        const likesRes = await api.get(`/projects/by-id/${project.id}/likes-count`);
                        let isLiked = false;
                        if (user) {
                            try {
                                const likeStatusRes = await api.get(`/projects/by-id/${project.id}/like-status`);
                                isLiked = likeStatusRes.data.liked;
                            } catch (e) {}
                        }
                        return { ...project, likesCount: likesRes.data.count, isLiked };
                    } catch (e) {
                        return { ...project, likesCount: 0, isLiked: false };
                    }
                })
            );
            setProjects(projectsWithLikes);
        } catch (err) {
            console.error("Failed to load projects", err);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [user]);

    const handleLike = async (e: React.MouseEvent, projectId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            toast.error('Please login to like this project');
            return;
        }

        try {
            const res = await api.post(`/projects/by-id/${projectId}/like`);
            setProjects(prev => prev.map(p => 
                p.id === projectId 
                    ? { ...p, isLiked: res.data.liked, likesCount: res.data.count }
                    : p
            ));
        } catch (err) {
            console.error('Failed to like project', err);
        }
    };

    const handleShare = async (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        e.stopPropagation();
        
        const url = `${window.location.origin}/c/${project.owner?.username}/project/${project.slug}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied!');
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    return (
        <main style={{ minHeight: '100vh' }}>
            <Navbar />
            <div className="container-padding" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

                <div style={{ textAlign: 'center', margin: '4rem 0' }}>
                    <h1 className="page-title" style={{ marginBottom: '1rem', fontWeight: 800 }}>Explore the Ecosystem</h1>
                    <p className="page-desc" style={{ color: 'var(--text-muted)' }}>Discover tools built by the best engineers.</p>
                </div>

                {projects.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No projects deployed yet.</p>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {projects.map((project) => {
                        const isAdmin = project.owner?.role === 'ADMIN';
                        return (
                            <div 
                                key={project.id} 
                                className={isAdmin ? 'admin-project-card' : 'glass-card'} 
                                style={{ padding: '0', overflow: 'hidden', transition: 'transform 0.3s' }}
                            >
                                {/* Admin Badge */}
                                {isAdmin && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        background: 'linear-gradient(135deg, #c9a962, #e8d5a3)',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: '#1a1a1a',
                                        boxShadow: '0 0 15px rgba(201,169,98,0.4)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        zIndex: 10
                                    }}>
                                        <Sparkles size={12} /> Official
                                    </div>
                                )}
                                
                                {(project as any).imageUrl && (
                                    <div style={{ 
                                        height: '200px', 
                                        background: `url(http://localhost:3001${(project as any).imageUrl}) center/cover`,
                                        borderBottom: isAdmin ? '2px solid rgba(201,169,98,0.3)' : 'none'
                                    }}></div>
                                )}
                                <div style={{ padding: '2rem' }}>
                                    <div style={{ 
                                        fontSize: '0.8rem', 
                                        color: isAdmin ? '#c9a962' : 'var(--secondary)', 
                                        marginBottom: '0.75rem', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '1px',
                                        fontWeight: isAdmin ? 600 : 400
                                    }}>
                                        Maintained by {project.owner?.name || 'Unknown'}
                                    </div>
                                    <h2 style={{ 
                                        fontSize: '1.8rem', 
                                        marginTop: 0, 
                                        marginBottom: '1rem',
                                        color: isAdmin ? '#ffffff' : 'inherit',
                                        fontWeight: isAdmin ? 800 : 600,
                                        textShadow: isAdmin ? '0 0 20px rgba(201,169,98,0.3)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <a href={`/c/${project.owner?.username || 'unknown'}/project/${project.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>{project.name}</a>
                                        {isAdmin && (
                                            <BadgeCheck size={22} style={{ 
                                                color: '#c9a962', 
                                                filter: 'drop-shadow(0 0 8px rgba(201,169,98,0.6)) drop-shadow(0 0 12px rgba(201,169,98,0.4))',
                                                flexShrink: 0
                                            }} />
                                        )}
                                    </h2>
                                    <p style={{ color: isAdmin ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>{project.description}</p>

                                    {/* Like and Share buttons */}
                                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                        <button 
                                            onClick={(e) => handleLike(e, project.id)}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '6px',
                                                padding: '8px 14px',
                                                borderRadius: '10px',
                                                border: project.isLiked ? 'none' : '1px solid var(--glass-border)',
                                                background: project.isLiked 
                                                    ? 'linear-gradient(135deg, #ff4d6d, #ff758f)' 
                                                    : 'rgba(255,255,255,0.05)',
                                                color: project.isLiked ? 'white' : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                boxShadow: project.isLiked ? '0 3px 12px rgba(255,77,109,0.4)' : 'none'
                                            }}
                                        >
                                            <Heart size={16} fill={project.isLiked ? 'white' : 'none'} />
                                            <span>{project.likesCount || 0}</span>
                                        </button>

                                        <button 
                                            onClick={(e) => handleShare(e, project)}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '6px',
                                                padding: '8px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            <Share2 size={16} />
                                        </button>
                                    </div>

                                    <ProtectedAction slug={project.slug} username={project.owner?.username} isAdmin={isAdmin} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <style jsx>{`
                .page-title { font-size: 3rem; }
                .page-desc { font-size: 1.2rem; }
                
                @media (max-width: 768px) {
                    .page-title { font-size: 2rem; }
                    .page-desc { font-size: 1rem; }
                }
            `}</style>
        </main>
    );
}

function ProtectedAction({ slug, username, isAdmin }: { slug: string, username?: string, isAdmin?: boolean }) {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <button
            onClick={() => router.push(`/c/${username || 'unknown'}/project/${slug}`)}
            className={isAdmin ? 'btn-primary' : 'btn-ghost'}
            style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '0.5rem',
                ...(isAdmin ? {
                    background: 'linear-gradient(135deg, #c9a962, #a08339)',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(201,169,98,0.3)',
                    color: '#1a1a1a',
                    fontWeight: 600
                } : {})
            }}
        >
            <span>View Repository</span>
            <ArrowRight size={18} />
        </button>
    );
}
