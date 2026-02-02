"use client";
import Link from 'next/link';
import { MessageSquare, Heart, Check, Pin, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DiscussionListItemProps {
    discussion: {
        id: string;
        title: string;
        content?: string; // Preview
        createdAt: string;
        isSolved?: boolean;
        isPinned?: boolean;
        tags?: string[];
        author: {
            name: string;
            username?: string;
            avatarUrl?: string; // If available
            role?: 'USER' | 'ADMIN';
        };
        _count: {
            comments: number;
            likes?: number;
        };
    };
    onClick?: (id: string) => void;
}

export default function DiscussionListItem({ discussion, onClick }: DiscussionListItemProps) {
    // DEBUG: Check what data is actually received
    console.log("Discussion Author Data:", discussion.author);
    const timeAgo = formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true }).replace('about ', '');

    const Container = onClick ? 'div' : Link;
    const props = onClick ? { onClick: () => onClick(discussion.id), style: { cursor: 'pointer' } } : { href: `/discussion/${discussion.id}` };

    return (
        // @ts-ignore
        <Container {...props} className="hover-bg-glass" style={{
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
            padding: '24px',
            borderBottom: '1px solid var(--glass-border)',
            transition: 'background 0.2s',
            position: 'relative'
        }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                {/* Avatar / Status Icon */}
                <div style={{ flexShrink: 0, position: 'relative' }}>
                    {discussion.author.avatarUrl ? (
                        <img
                            src={discussion.author.avatarUrl}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            alt={discussion.author.name}
                        />
                    ) : (
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 600, fontSize: '1rem'
                        }}>
                            {discussion.author.name.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {discussion.isSolved && (
                        <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#10b981', borderRadius: '50%', padding: '2px', border: '2px solid #0f172a' }}>
                            <CheckCircle2 size={12} color="white" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {discussion.author.name}
                                {discussion.author.role === 'ADMIN' && (
                                    <div style={{ background: '#3b82f6', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px' }}>
                                        <Check size={10} color="white" strokeWidth={4} />
                                    </div>
                                )}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>@{discussion.author.username || discussion.author.name.replace(/\s+/g, '').toLowerCase()}</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>· {timeAgo}</span>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.3, color: 'var(--foreground)' }}>
                        {discussion.isPinned && <Pin size={16} color="var(--primary)" style={{ transform: 'rotate(45deg)', marginRight: '8px', verticalAlign: 'text-bottom' }} />}
                        {discussion.title}
                    </h3>

                    {discussion.content && (
                        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {discussion.content.replace(/<[^>]*>?/gm, '').replace(/[#*`]/g, '')}
                        </p>
                    )}

                    {/* Stats */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <div className="hover-text-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MessageSquare size={18} />
                            <span>{discussion._count?.comments || 0} Replies</span>
                        </div>
                        {/* Add other metrics if needed */}
                    </div>
                </div>

            </div>
        </Container>
    );
}
