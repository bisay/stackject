"use client";
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Home, Hash, User, MoreHorizontal, PenSquare, LogOut, LayoutGrid, FileCode, Globe } from 'lucide-react';

export default function Sidebar({ mobileMode = false, onClose }: { mobileMode?: boolean, onClose?: () => void }) {
    const { user, logout } = useAuth();

    const containerStyle: React.CSSProperties = mobileMode ? {
        width: '100%',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    } : {
        width: '275px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        padding: '0 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid var(--glass-border)',
        overflowY: 'auto'
    };

    return (
        <div style={containerStyle}>
            <div>
                {/* Logo - Hide on mobile drawer usually, or keep it depending on design. Let's hide it to save space */}
                {!mobileMode && (
                    <div style={{ padding: '1rem 0', marginBottom: '1rem' }}>
                        <Link href="/" style={{ display: 'inline-block' }}>
                            <div style={{
                                width: '50px', height: '50px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '50%',
                                transition: 'background 0.2s'
                            }}
                                className="hover-bg-glass"
                            >
                                <img src="/logo.png" alt="Stackject" style={{ height: '32px', objectFit: 'contain' }} />
                            </div>
                        </Link>
                    </div>
                )}

                {/* Navigation */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <SidebarLink href="/dashboard" icon={<LayoutGrid size={26} />} text="Dashboard" onClick={onClose} />
                    <SidebarLink href="/" icon={<Globe size={26} />} text="Explore" active onClick={onClose} />
                    <SidebarLink href="/project" icon={<FileCode size={26} />} text="Projects" onClick={onClose} />
                    <SidebarLink href="/dashboard" icon={<User size={26} />} text="Profile" onClick={onClose} />

                    {/* More - Static / Placeholder */}
                    <div onClick={onClose} className="hover-bg-glass" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '20px',
                        padding: '12px 24px 12px 12px',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                        color: 'var(--text-main)'
                    }}>
                        <MoreHorizontal size={26} />
                        <span style={{ fontSize: '1.25rem' }}>More</span>
                    </div>
                </nav>

                {/* Post Button */}
                <button className="btn-primary" style={{
                    width: '100%',
                    marginTop: '2rem',
                    padding: '1rem',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }} onClick={onClose}>
                    Post
                </button>
            </div>

            {/* User Profile Snippet */}
            {user && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '10px',
                    borderRadius: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.2s'
                }}
                    className="hover-bg-glass"
                >
                    <Link href={`/c/${user.username || 'user'}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: 'var(--primary)', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                            }}>
                                {user.name?.substring(0, 1).toUpperCase()}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user.name}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>@{user.username || 'user'}</span>
                        </div>
                    </Link>
                    <div onClick={(e) => { e.stopPropagation(); logout(); }} title="Logout" style={{ cursor: 'pointer', padding: '4px' }}>
                        <LogOut size={18} />
                    </div>
                </div>
            )}
        </div>
    );
}

function SidebarLink({ href, icon, text, active, onClick }: { href: string, icon: any, text: string, active?: boolean, onClick?: () => void }) {
    return (
        <Link href={href} style={{ textDecoration: 'none', color: 'var(--text-main)' }} onClick={onClick}>
            <div className="hover-bg-glass" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '20px',
                padding: '12px 24px 12px 12px',
                transition: 'background 0.2s'
            }}>
                {icon}
                <span style={{ fontSize: '1.25rem', fontWeight: active ? 700 : 400 }}>{text}</span>
            </div>
        </Link>
    )
}
