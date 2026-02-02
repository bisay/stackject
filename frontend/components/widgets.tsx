"use client";
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function Widgets() {
    const [allPosts, setAllPosts] = useState<any[]>([]);
    const [visibleCount, setVisibleCount] = useState(5);

    useEffect(() => {
        api.get('/discussions')
            .then(res => {
                setAllPosts(res.data);
            })
            .catch(console.error);
    }, []);

    const visiblePosts = allPosts.slice(0, visibleCount);

    return (
        <div style={{
            width: '350px',
            height: '100vh',
            position: 'sticky',
            top: 0,
            padding: '1rem 0 1rem 2rem',
            borderLeft: '1px solid var(--glass-border)',
            overflowY: 'auto'
        }}>
            {/* Search Bar */}
            <div style={{
                position: 'sticky', top: 0, background: 'var(--bg-main)', zIndex: 10, paddingBottom: '1rem'
            }}>
                <div style={{
                    background: 'var(--glass-surface)',
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid transparent',
                }}
                    className="focus-within-primary"
                >
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="Search Stackject"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-main)',
                            fontSize: '0.95rem',
                            width: '100%'
                        }}
                    />
                </div>
            </div>

            {/* Latest Posts */}
            <div className="glass-card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, padding: '12px 16px' }}>Latest Posts</h3>

                {visiblePosts.map((post: any) => (
                    <PostItem key={post.id} post={post} />
                ))}

                {allPosts.length === 0 && (
                    <div style={{ padding: '16px', color: 'var(--text-muted)' }}>No posts yet.</div>
                )}

                {visibleCount < allPosts.length && (
                    <div
                        onClick={() => setVisibleCount(prev => prev + 5)}
                        style={{ padding: '16px', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem' }}
                        className="hover-bg-glass"
                    >
                        Show more
                    </div>
                )}
            </div>

            <div style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Terms of Service • Privacy Policy • Cookie Policy • Accessibility • Ads info • © 2026 Stackject, Inc.
            </div>
        </div>
    );
}

function PostItem({ post }: { post: any }) {
    const timeAgo = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    return (
        <Link href={`/discussion/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: '12px 16px', cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid var(--glass-border)' }} className="hover-bg-glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {post.author.avatarUrl ? (
                        <img src={post.author.avatarUrl} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                    ) : (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', fontWeight: 700 }}>
                            {post.author.name[0]}
                        </div>
                    )}
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{post.author.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>· {timeAgo(post.createdAt)}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: '1.3', marginBottom: '4px' }}>
                    {post.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {post.project ? `@${post.project.name}` : 'General'}
                </div>
            </div>
        </Link>
    )
}
