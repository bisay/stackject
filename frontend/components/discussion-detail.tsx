"use client";
import { useEffect, useState, useRef, useMemo } from 'react';
import api from '@/lib/api';
import { MessageSquare, Calendar, User, ArrowLeft, Send, Trash2, Image as ImageIcon, Heart, Share, MoreHorizontal, CheckCircle2, Check } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProjectCard from '@/components/project-card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import parse from 'html-react-parser';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import ConfirmationModal from '@/components/confirmation-modal';

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;

    return date.toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

const fullDateFormat = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' · ' +
        new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

// Helper for Inline Reply Input
function ReplyInput({ user, onSubmit, placeholder = "Post your reply", onCancel, autoFocus = false }: any) {
    const [reply, setReply] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        }
    }, [autoFocus]);

    const handlePost = async () => {
        if (!reply.trim()) return;
        setSubmitting(true);
        try {
            await onSubmit(reply, () => {
                setReply('');
                setPreviewUrl(null);
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/discussions/upload-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const imageUrl = res.data.url;
            setReply(prev => prev + `\n![Image](${imageUrl})\n`);
            toast.success("Image uploaded!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload image");
            setPreviewUrl(null);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ padding: '16px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
            {user && (
                <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'var(--primary)', color: 'white', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    overflow: 'hidden'
                }}>
                    {(user.avatarUrl || (user as any).image) ? (
                        <img src={user.avatarUrl || (user as any).image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        user.name?.substring(0, 1).toUpperCase()
                    )}
                </div>
            )}
            <div style={{ flex: 1 }}>
                <textarea
                    ref={textareaRef}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePost();
                        }
                    }}
                    placeholder={placeholder}
                    style={{
                        background: 'transparent', border: 'none', outline: 'none',
                        color: 'white', fontSize: '1rem', minHeight: '40px',
                        resize: 'none', fontFamily: 'inherit', width: '100%',
                        marginBottom: '8px'
                    }}
                />
                {previewUrl && (
                    <div style={{ position: 'relative', marginTop: '10px', width: '100%' }}>
                        <img src={previewUrl} style={{ borderRadius: '12px', maxHeight: '200px', objectFit: 'contain', border: '1px solid var(--glass-border)' }} />
                        <button onClick={() => setPreviewUrl(null)} style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px' }}>×</button>
                    </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '12px', color: 'var(--primary)' }}>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} accept="image/*" />
                        <div onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}><ImageIcon size={20} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {onCancel && (
                            <button onClick={onCancel} className="btn-ghost" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>Cancel</button>
                        )}
                        <button
                            onClick={handlePost}
                            disabled={(!reply.trim() && !previewUrl) || submitting}
                            className="btn-primary"
                            style={{ padding: '6px 16px', fontSize: '0.9rem', fontWeight: 600, opacity: (!reply.trim() && !previewUrl) ? 0.5 : 1, borderRadius: '20px' }}
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface Author {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    role?: 'USER' | 'ADMIN';
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: Author;
    likes: any[];
    children?: Comment[];
    parent?: Comment;
}

// Recursive Component for Thread
const CommentThread = ({ comment, user, handleReplyClick, handleLike, expandedThreads, toggleThread, discussionId, depth = 0, replyingToId, submitReply, cancelReply }: {
    comment: Comment;
    user: any;
    handleReplyClick: any;
    handleLike: any;
    expandedThreads: any;
    toggleThread: any;
    discussionId: string;
    depth?: number;
    replyingToId: string | null;
    submitReply: any;
    cancelReply: any;
}) => {
    const hasChildren = comment.children && comment.children.length > 0;
    const isReplying = replyingToId === comment.id;

    return (
        <>
            <article style={{
                display: 'flex',
                gap: '12px',
                padding: '16px 24px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                position: 'relative',
                borderBottom: '1px solid var(--glass-border)',
                backgroundColor: isReplying ? 'rgba(255,255,255,0.02)' : 'transparent'
            }} className="hover-bg-glass">

                {/* Avatar Column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px' }} onClick={(e) => e.stopPropagation()}>
                    <Link href={`/c/${comment.author.username}`} style={{ textDecoration: 'none' }}>
                        {comment.author.avatarUrl ? (
                            <img
                                src={comment.author.avatarUrl}
                                alt={comment.author.name}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    objectFit: 'cover', flexShrink: 0, zIndex: 1
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: `hsl(${Math.abs(comment.author.name.charCodeAt(0) * 5) % 360}, 70%, 50%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, color: 'white', fontSize: '1rem', flexShrink: 0,
                                zIndex: 1
                            }}>
                                {comment.author.name.substring(0, 1).toUpperCase()}
                            </div>
                        )}
                    </Link>
                    {/* Thread Line */}
                    {hasChildren && (
                        <div style={{ flex: 1, width: '2px', background: 'var(--glass-border)', marginTop: '4px', marginBottom: '-16px' }}></div>
                    )}
                </div>

                {/* Content Column */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '4px' }} className="hover-underline">
                                {comment.author.name}
                                {comment.author.role === 'ADMIN' && <div aria-label="Verified Admin" style={{ display: 'inline-flex' }}><CheckCircle2 size={12} className="text-white bg-blue-500 rounded-full p-[1px]" /></div>}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>@{comment.author.name.replace(/\s+/g, '').toLowerCase()}</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>· {formatTime(comment.createdAt)}</span>
                        </div>
                    </div>

                    {/* Replying to... */}
                    {comment.parent && (
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Replying to <span style={{ color: 'var(--primary)' }}>@{comment.parent.author.name.replace(/\s+/g, '').toLowerCase()}</span>
                        </div>
                    )}

                    <div className="prose comment-markdown" style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)', marginTop: '4px' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {comment.content}
                        </ReactMarkdown>
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', maxWidth: '350px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <ActionItem icon={<MessageSquare size={18} />} count={null} onClick={() => handleReplyClick(comment.id, comment.author.name)} />
                            {hasChildren && (
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleThread(comment.id); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', color: expandedThreads[comment.id] ? 'var(--primary)' : 'inherit' }}
                                    className="hover-text-primary"
                                >
                                    <div style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: expandedThreads[comment.id] ? 'var(--primary)' : 'inherit', fontSize: '0.75rem' }}>
                                        {expandedThreads[comment.id] ? 'Hide' : `${comment.children?.length || 0} replies`}
                                    </div>
                                </div>
                            )}
                        </div>
                        <ActionItem
                            icon={<Heart size={18}
                                fill={comment.likes?.some((l: any) => l.userId === user?.id) ? '#f91880' : 'transparent'}
                                color={comment.likes?.some((l: any) => l.userId === user?.id) ? '#f91880' : 'currentColor'}
                                strokeWidth={2}
                            />}
                            count={comment.likes?.length || null}
                            onClick={(e) => { e.stopPropagation(); handleLike(comment.id, comment.likes || []); }}
                            activeColor="#f91880"
                        />
                        <ActionItem
                            icon={<Share size={18} />}
                            count={null}
                            onClick={async (e) => {
                                e?.stopPropagation();
                                const url = window.location.origin + `/discussion/${discussionId}`;
                                if (navigator.share) {
                                    try {
                                        await navigator.share({
                                            title: `Reply by ${comment.author.name}`,
                                            text: comment.content.substring(0, 100),
                                            url: url
                                        });
                                    } catch (err) {
                                        console.error("Share failed:", err);
                                    }
                                } else {
                                    navigator.clipboard.writeText(url);
                                    toast.success("Link copied to clipboard!");
                                }
                            }}
                        />
                    </div>

                </div>
            </article>

            {/* Inline Reply Input for Comment - Renders OUTSIDE padding of article but connected */}
            {isReplying && (
                <div style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <ReplyInput
                        user={user}
                        autoFocus={true}
                        placeholder={`Replying to @${comment.author.name}...`}
                        onCancel={cancelReply}
                        onSubmit={(content: string, onSuccess: () => void) => submitReply(content, comment.id, onSuccess)}
                    />
                </div>
            )}

            {hasChildren && expandedThreads[comment.id] && (
                <div style={{ marginLeft: '0px' }}> {/* Adjusted indent logic if needed, or keeping it flat but indented content */}
                    {comment.children?.map((child: any) => (
                        <CommentThread
                            key={child.id}
                            comment={child}
                            user={user}
                            handleReplyClick={handleReplyClick}
                            handleLike={handleLike}
                            expandedThreads={expandedThreads}
                            toggleThread={toggleThread}
                            discussionId={discussionId}
                            depth={depth + 1}
                            replyingToId={replyingToId}
                            submitReply={submitReply}
                            cancelReply={cancelReply}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

function ActionItem({ icon, count, onClick, activeColor }: { icon: any, count: number | null, onClick?: (e: any) => void, activeColor?: string }) {
    return (
        <div
            onClick={onClick}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'color 0.2s', fontSize: '0.85rem' }}
            onMouseOver={(e) => e.currentTarget.style.color = activeColor || 'var(--primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}
        >
            <div style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', color: 'inherit' }} className="hover-bg-icon">
                {icon}
            </div>
            {count !== null && count > 0 && <span>{count}</span>}
        </div>
    )
}

interface DiscussionDetailProps {
    discussionId: string;
    onBack?: () => void;
    embedded?: boolean;
    onReplyAdded?: () => void;
    onCountUpdate?: (count: number) => void;
}

export default function DiscussionDetail({ discussionId, onBack, embedded = false, onReplyAdded, onCountUpdate }: DiscussionDetailProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [discussion, setDiscussion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});

    // Ref for MAIN reply input (top level)
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchDiscussion = (skipLoading = false) => {
        if (!skipLoading) setLoading(true);
        api.get(`/discussions/${discussionId}`)
            .then(res => setDiscussion(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (discussionId) fetchDiscussion();
    }, [discussionId]);

    const handleDeleteClick = () => {
        setConfirmDelete(true);
    };

    const confirmDeleteDiscussion = async () => {
        try {
            await api.delete(`/discussions/${discussionId}`);
            toast.success("Discussion Deleted");
            if (onBack) onBack();
            else router.push('/community');
        } catch (err) {
            toast.error("Failed to delete discussion");
        }
    };

    const toggleThread = (commentId: string) => {
        setExpandedThreads(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const submitReply = async (content: string, parentId: string | null = null, onSuccess?: () => void) => {
        try {
            await api.post(`/discussions/${discussionId}/comments`, {
                content: content,
                parentId: parentId
            });

            if (parentId) {
                setExpandedThreads(prev => ({ ...prev, [parentId]: true }));
            }

            setReplyingToId(null);
            fetchDiscussion(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            toast.error('Failed to reply');
        }
    };

    const handleReplyClick = (commentId: string, authorName: string) => {
        if (replyingToId === commentId) {
            setReplyingToId(null); // Toggle off if already replying to this one
        } else {
            setReplyingToId(commentId);
        }
    };

    const handleDiscussionLike = async () => {
        if (!user) {
            toast.error("Please login to like");
            return;
        }

        const isLiked = discussion.likes?.some((l: any) => l.userId === user.id);

        setDiscussion((prev: any) => ({
            ...prev,
            likes: isLiked
                ? prev.likes.filter((l: any) => l.userId !== user.id)
                : [...(prev.likes || []), { userId: user.id }]
        }));

        try {
            await api.post(`/discussions/${discussion.id}/like`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to like post");
            fetchDiscussion(true);
        }
    };

    const handleLike = async (commentId: string, currentLikes: any[]) => {
        if (!user) {
            toast.error("Please login to like");
            return;
        }

        const isLiked = currentLikes.some((l: any) => l.userId === user.id);

        setDiscussion((prev: any) => {
            const updatedComments = prev.comments.map((c: any) => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        likes: isLiked
                            ? c.likes.filter((l: any) => l.userId !== user.id)
                            : [...c.likes, { userId: user.id }]
                    };
                }
                return c;
            });
            return { ...prev, comments: updatedComments };
        });

        try {
            await api.post(`/discussions/comments/${commentId}/like`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to like");
            fetchDiscussion(true);
        }
    };

    const parserOptions = {
        replace: (domNode: any) => {
            if (domNode.attribs && domNode.attribs['data-type'] === 'mention') {
                const projectId = domNode.attribs['data-id'];
                const mentionData = discussion.mentions?.find((m: any) => m.project.id === projectId);

                if (mentionData) {
                    return (
                        <span style={{ margin: '1rem 0', display: 'block' }}>
                            <ProjectCard project={mentionData.project} />
                        </span>
                    );
                }
            }
        }
    };

    const rootComments = useMemo(() => {
        if (!discussion?.comments) return [];
        const map = new Map();
        const roots: any[] = [];
        const comments = discussion.comments.map((c: any) => ({ ...c, children: [] }));
        comments.forEach((c: any) => map.set(c.id, c));
        comments.forEach((c: any) => {
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId).children.push(c);
            } else {
                roots.push(c);
            }
        });
        return roots;
    }, [discussion]);

    useEffect(() => {
        if (discussion && discussion.comments && onCountUpdate) {
            onCountUpdate(discussion.comments.length);
        }
    }, [discussion?.comments?.length]);


    if (loading) return <div style={{ height: embedded ? '200px' : '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    if (!discussion) return <div style={{ height: embedded ? '200px' : '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Discussion not found.</div>;

    return (
        <div>
            {/* Header - Only show if not embedded */}
            {!embedded && (
                <div style={{
                    position: 'sticky', top: 0,
                    backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)',
                    zIndex: 10, padding: '16px 0',
                    display: 'flex', alignItems: 'center', gap: '20px',
                    borderBottom: '1px solid var(--glass-border)',
                    marginBottom: '20px'
                }}>
                    <button onClick={() => onBack ? onBack() : router.back()} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Post</h2>
                </div>
            )}

            {/* If embedded, show a simplified Close/Collapse button inside the card or above it? 
                 Actually, usually clicking the expanded item again or a close button collapses it.
                 Let's add a Close button in the top right of the card if embedded. */}

            {/* Main Tweet/Post */}
            <div className="glass-card" style={{ padding: '0', marginBottom: '20px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>

                <div style={{ padding: '24px' }}>
                    {/* Author Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Link href={`/c/${discussion.author.username}`} style={{ textDecoration: 'none' }}>
                            {discussion.author.avatarUrl ? (
                                <img src={discussion.author.avatarUrl} alt={discussion.author.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '1.2rem' }}>
                                    {discussion.author.name.substring(0, 1).toUpperCase()}
                                </div>
                            )}
                        </Link>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {discussion.author.name}
                                {discussion.author.role === 'ADMIN' && (
                                    <div style={{ background: '#3b82f6', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px' }}>
                                        <Check size={10} color="white" strokeWidth={4} />
                                    </div>
                                )}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>@{discussion.author.name.replace(/\s+/g, '').toLowerCase()}</span>
                        </div>

                        {/* Delete Option */}
                        {user && user.id === discussion.author.id && (
                            <div style={{ marginLeft: 'auto', cursor: 'pointer', color: 'red' }} onClick={handleDeleteClick}>
                                <Trash2 size={18} />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '20px 0 12px', color: 'var(--foreground)', lineHeight: 1.3 }}>
                        {discussion.title}
                    </h1>

                    {/* Content */}
                    <div className="prose" style={{
                        fontSize: '1.1rem', lineHeight: '1.6', margin: '0 0 24px',
                        color: 'var(--text-main)', overflowWrap: 'break-word',
                        maxWidth: '100%'
                    }}>
                        {parse(discussion.content, parserOptions)}
                    </div>

                    {/* Tags */}
                    {discussion.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                            {discussion.tags.map((t: string) => (
                                <span key={t} style={{ color: 'var(--primary)', fontSize: '1rem' }}>#{t}</span>
                            ))}
                        </div>
                    )}

                    {/* Date */}
                    <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        {fullDateFormat(discussion.createdAt)}
                    </div>

                    {/* Metrics */}
                    <div style={{ display: 'flex', gap: '20px', padding: '16px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.95rem' }}>
                        <span><strong style={{ color: 'var(--text-main)' }}>{discussion.comments?.length || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>Replies</span></span>
                        <span><strong style={{ color: 'var(--text-main)' }}>{discussion.likes?.length || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>Likes</span></span>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 0 0' }}>
                        <ActionItem icon={<MessageSquare size={22} />} count={null} onClick={() => textareaRef.current?.focus()} />
                        <ActionItem
                            icon={<Heart size={22}
                                fill={discussion.likes?.some((l: any) => l.userId === user?.id) ? '#f91880' : 'transparent'}
                                color={discussion.likes?.some((l: any) => l.userId === user?.id) ? '#f91880' : 'currentColor'}
                            />}
                            count={discussion.likes?.length || null}
                            onClick={handleDiscussionLike}
                        />
                        <ActionItem
                            icon={<Share size={22} />}
                            count={null}
                            onClick={async () => {
                                const url = window.location.href;
                                if (navigator.share) {
                                    try {
                                        await navigator.share({
                                            title: discussion.title || `Post by ${discussion.author.name}`,
                                            text: discussion.content.substring(0, 100),
                                            url: url
                                        });
                                    } catch (err) {
                                        console.error("Share failed:", err);
                                    }
                                } else {
                                    navigator.clipboard.writeText(url);
                                    toast.success("Link copied to clipboard!");
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Main Reply Input area attached to the card */}
                <ReplyInput
                    user={user}
                    placeholder="Post your reply"
                    onSubmit={(content: string, onSuccess: () => void) => submitReply(content, null, onSuccess)}
                />

                {/* Replies Feed - Rendered INSIDE the main card styling effectively? No, maybe simpler to have them outside but with no gap. */}
            </div>

            {/* Replies Feed - Now as a list */}
            <div style={{ border: '1px solid var(--glass-border)', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                {
                    rootComments.map(comment => (
                        <CommentThread
                            key={comment.id}
                            comment={comment}
                            user={user}
                            handleReplyClick={handleReplyClick}
                            handleLike={handleLike}
                            expandedThreads={expandedThreads}
                            toggleThread={toggleThread}
                            discussionId={discussionId}
                            replyingToId={replyingToId}
                            submitReply={submitReply}
                            cancelReply={() => setReplyingToId(null)}
                        />
                    ))
                }
            </div >

            <ConfirmationModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={confirmDeleteDiscussion}
                title="Delete Post?"
                message="Are you sure you want to delete this post? This action cannot be undone."
                type="danger"
                actionLabel="Delete"
            />
        </div>
    );
}
