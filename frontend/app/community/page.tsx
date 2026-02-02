"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { MessageSquare, Heart, MessageCircle, MoreHorizontal, Image as ImageIcon, Trash2, Repeat, Share, Check } from 'lucide-react';
import NewDiscussionModal from '@/components/new-discussion-modal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import parse from 'html-react-parser';
import ProjectCard from '@/components/project-card';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import ConfirmModal from '@/components/confirm-modal';
import SocialLayout from '@/components/social-layout';

export default function CommunityPage() {
    const [discussions, setDiscussions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth();
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchDiscussions = () => {
        setLoading(true);
        api.get('/discussions')
            .then(res => setDiscussions(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDiscussions();
    }, []);

    const handleDeleteClick = (e: any, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/discussions/${deleteId}`);
            toast.success("Discussion Deleted");
            setDiscussions(prev => prev.filter(d => d.id !== deleteId));
        } catch (err) {
            toast.error("Failed to delete discussion");
        } finally {
            setDeleteId(null);
        }
    };

    const handleLike = async (e: any, discussionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast.error("Please login to like");
            return;
        }

        setDiscussions(prev => prev.map(d => {
            if (d.id === discussionId) {
                const isLiked = d.likes?.some((l: any) => l.userId === user.id);
                return {
                    ...d,
                    likes: isLiked
                        ? d.likes.filter((l: any) => l.userId !== user.id)
                        : [...(d.likes || []), { userId: user.id }]
                };
            }
            return d;
        }));

        try {
            await api.post(`/discussions/${discussionId}/like`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to like");
            fetchDiscussions(); // Revert
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    return (
        <SocialLayout>
            <main style={{ paddingBottom: '4rem' }}>

                {/* Sticky Header */}
                <div style={{
                    position: 'sticky', top: 0,
                    backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)',
                    zIndex: 10, padding: '0 16px', height: '53px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid var(--glass-border)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Home</h2>
                </div>

                {/* Compose Mock */}
                <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'var(--primary)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white'
                    }}>
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            user?.name?.substring(0, 1).toUpperCase() || '?'
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                color: 'var(--text-muted)', fontSize: '1.25rem', padding: '10px 0', cursor: 'text'
                            }}
                        >
                            What is happening?!
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', gap: '16px', color: 'var(--primary)' }}>
                                <ImageIcon size={20} style={{ cursor: 'pointer' }} onClick={() => setIsModalOpen(true)} />
                                {/* Other mock icons */}
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="btn-primary"
                                style={{ padding: '8px 20px', fontWeight: 700 }}
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </div>


                {/* Feed */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
                    ) : discussions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No posts yet.
                        </div>
                    ) : (
                        discussions.map(d => (
                            // Removed outer Link to prevent nested <a> tags
                            <article key={d.id} className="glass-card"
                                onClick={() => router.push(`/discussion/${d.id}`)}
                                style={{
                                    padding: '16px',
                                    marginBottom: '16px',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex', gap: '16px',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}>

                                {/* Avatar */}
                                <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                    <Link href={`/c/${d.author.username}`} style={{ textDecoration: 'none' }}>
                                        {d.author.avatarUrl ? (
                                            <img src={d.author.avatarUrl} alt={d.author.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `hsl(${Math.abs(d.author.name.charCodeAt(0) * 5) % 360}, 70%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>
                                                {d.author.name.substring(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </Link>
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span className="hover-underline" style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {d.author.name}
                                                {d.author.role === 'ADMIN' && (
                                                    <div style={{ background: '#3b82f6', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px' }}>
                                                        <Check size={10} color="white" strokeWidth={4} />
                                                    </div>
                                                )}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>@{d.author.username || d.author.name.replace(/\s+/g, '').toLowerCase()}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>· {formatTime(d.createdAt)}</span>
                                        </div>
                                        <div style={{ color: 'var(--text-muted)' }} onClick={(e) => {
                                            e.preventDefault(); e.stopPropagation();
                                            // Menu logic here
                                            if (user && user.id === d.author.id) handleDeleteClick(e, d.id);
                                        }}>
                                            {user && user.id === d.author.id ? <Trash2 size={16} className="hover-text-red" /> : <MoreHorizontal size={16} />}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '2px', fontSize: '0.95rem', lineHeight: '1.4', wordBreak: 'break-word', color: 'var(--text-main)' }} className="prose">
                                        {parse(d.content, {
                                            replace: (domNode: any) => {
                                                if (domNode.attribs && domNode.attribs['data-type'] === 'mention') {
                                                    const projectId = domNode.attribs['data-id'];
                                                    const mentionData = d.mentions?.find((m: any) => m.project.id === projectId);

                                                    if (mentionData) {
                                                        return (
                                                            <span style={{ margin: '0.5rem 0', display: 'block' }} onClick={(e) => e.stopPropagation()}>
                                                                <ProjectCard project={mentionData.project} />
                                                            </span>
                                                        );
                                                    }
                                                }
                                            }
                                        })}
                                    </div>

                                    {/* Discussion Card Actions */}
                                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', maxWidth: '400px', paddingRight: '2rem' }}>
                                        <FeedAction icon={<MessageCircle size={18} />} count={d.comments?.length || 0} />

                                        <FeedAction
                                            icon={<Heart size={18}
                                                fill={d.likes?.some((l: any) => l.userId === user?.id) ? '#f91880' : 'transparent'}
                                                color={d.likes?.some((l: any) => l.userId === user?.id) ? '#f91880' : 'currentColor'}
                                            />}
                                            count={d.likes?.length || 0}
                                            onClick={(e) => handleLike(e, d.id)}
                                        />
                                        <FeedAction icon={<Share size={18} />} count={null} />
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>

                <NewDiscussionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => fetchDiscussions()}
                />

                <ConfirmModal
                    isOpen={!!deleteId}
                    title="Delete Post?"
                    description="Are you sure you want to remove this post? This action cannot be undone."
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteId(null)}
                />
            </main>
        </SocialLayout>
    );
}

function FeedAction({ icon, count, onClick }: { icon: any, count: number | null, onClick?: (e: any) => void }) {
    return (
        <div
            className="hover-bg-icon"
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer',
                padding: '6px', margin: '-6px', borderRadius: '50%'
            }}
        >
            {icon}
            {count !== null && count > 0 && <span>{count}</span>}
        </div>
    )
}
