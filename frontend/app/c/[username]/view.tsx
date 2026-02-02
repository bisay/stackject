"use client";
// Force rebuild: Fix FileCode import reference error
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { Grid, List, MapPin, Link as LinkIcon, Calendar, FileCode, CheckCircle2, Check } from 'lucide-react';
import Link from 'next/link';
import SettingsModal from '@/components/settings-modal';

interface UserProfile {
    id: string;
    username: string;
    name: string;
    role?: 'USER' | 'ADMIN';
    avatarUrl?: string;
    bio?: string;
    location?: string;
    website?: string;
    createdAt: string;
    _count: {
        projects: number;
        followers: number;
        following: number;
    };
    projects: any[]; // Simplified for grid
    isFollowing?: boolean;
}

export default function ProfileView() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const username = Array.isArray(params.username) ? params.username[0] : params.username;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'projects'>('posts'); // Instagram calls them posts
    const [followLoading, setFollowLoading] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        if (!username) return;
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/users/${username}`);
                setProfile(res.data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    const handleFollow = async () => {
        if (!currentUser || !profile) return;
        setFollowLoading(true);
        const isFollowing = profile.isFollowing;

        // Optimistic update
        setProfile(prev => prev ? {
            ...prev,
            isFollowing: !isFollowing,
            _count: {
                ...prev._count,
                followers: isFollowing ? prev._count.followers - 1 : prev._count.followers + 1
            }
        } : null);

        try {
            if (isFollowing) {
                await api.delete(`/users/${profile.id}/follow`);
            } else {
                await api.post(`/users/${profile.id}/follow`);
            }
        } catch (err) {
            console.error("Follow action failed", err);
            // Revert
            setProfile(prev => prev ? {
                ...prev,
                isFollowing: isFollowing,
                _count: {
                    ...prev._count,
                    followers: isFollowing ? prev._count.followers : prev._count.followers // Revert to original
                }
            } : null);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) return (
        <main>
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>Loading...</div>
        </main>
    );

    if (!profile) return (
        <main>
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>User not found</div>
        </main>
    );

    const isOwnProfile = currentUser?.username === profile.username;

    return (
        <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <Navbar />

            <div style={{ maxWidth: '935px', margin: '0 auto', padding: '2rem 1rem' }}>
                {/* Header Section (Instagram Style) */}
                <header style={{ display: 'flex', gap: '4rem', marginBottom: '3rem', alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    <div style={{ flexShrink: 0, paddingLeft: '2rem' }}>
                        <div style={{
                            width: '150px', height: '150px', borderRadius: '50%',
                            background: 'var(--primary)',
                            backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : 'none',
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', fontWeight: 700, color: 'white',
                            border: '1px solid var(--glass-border)'
                        }}>
                            {!profile.avatarUrl && profile.name.substring(0, 1).toUpperCase()}
                        </div>
                    </div>

                    {/* Info */}
                    <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 400, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {profile.username}
                                {profile.role === 'ADMIN' && (
                                    <div style={{ background: '#3b82f6', borderRadius: '50%', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}>
                                        <Check size={14} color="white" strokeWidth={4} />
                                    </div>
                                )}
                            </h2>
                            {isOwnProfile ? (
                                <button onClick={() => setIsSettingsOpen(true)} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, color: 'inherit' }}>
                                    Edit Profile
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className={profile.isFollowing ? "btn-secondary" : "btn-primary"}
                                        style={{ padding: '6px 20px', fontSize: '0.9rem', minWidth: '100px' }}
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                    >
                                        {profile.isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            localStorage.setItem('pendingChatUser', JSON.stringify(profile));
                                            router.push('/messages');
                                        }}
                                        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, color: 'inherit' }}
                                    >
                                        Message
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '2.5rem', fontSize: '1rem' }}>
                            <span><strong>{profile.projects?.length || 0}</strong> projects</span>
                            <span><strong>{profile._count?.followers || 0}</strong> followers</span>
                            <span><strong>{profile._count?.following || 0}</strong> following</span>
                        </div>

                        <div style={{ fontSize: '0.95rem' }}>
                            {profile.bio && <div style={{ whiteSpace: 'pre-line' }}>{profile.bio}</div>}
                            {profile.website && (
                                <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                    <LinkIcon size={14} /> {profile.website.replace(/^https?:\/\//, '')}
                                </a>
                            )}
                        </div>
                    </section>
                </header>

                {/* Divider / Tabs */}
                <div style={{ borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', gap: '4rem', marginBottom: '1rem' }}>
                    <TabItem active={activeTab === 'posts'} onClick={() => setActiveTab('posts')} icon={<Grid size={14} />} label="PROJECTS" />
                    <TabItem active={activeTab === 'projects'} onClick={() => setActiveTab('projects')} icon={<List size={14} />} label="DISCUSSIONS" />
                </div>

                {/* Grid Content */}
                {activeTab === 'posts' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {profile.projects && profile.projects.length > 0 ? (
                            profile.projects.map((p: any) => (
                                <div key={p.id} style={{
                                    aspectRatio: '1/1', background: 'var(--glass-bg)',
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative', cursor: 'pointer'
                                }} onClick={() => router.push(`/c/${profile.username}/project/${p.slug}`)}>
                                    {p.imageUrl ? (
                                        <div style={{ width: '100%', height: '100%', background: `url(${p.imageUrl}) center/cover` }}></div>
                                    ) : (
                                        <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{p.name}</span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                <div style={{ border: '2px solid var(--text-muted)', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                    <FileCode size={30} />
                                </div>
                                <h2>No Projects Yet</h2>
                                <p>When you create projects, they will appear on your profile.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {isOwnProfile && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
        </main>
    );
}

function TabItem({ active, onClick, icon, label }: any) {
    return (
        <div
            onClick={onClick}
            style={{
                borderTop: active ? '1px solid var(--text-main)' : '1px solid transparent',
                marginTop: '-1px',
                padding: '1rem 0',
                display: 'flex', alignItems: 'center', gap: '6px',
                cursor: 'pointer',
                color: active ? 'var(--text-main)' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px'
            }}
        >
            {icon}
            <span>{label}</span>
        </div>
    )
}
