import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { Moon, Sun, LogOut, LayoutDashboard, Menu, X, Database } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="nav-glass" style={{ padding: '1rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>

            {/* Brand */}
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 1002 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Public folder logo */}
                    <img src="/logo.png" alt="Stackject" style={{ height: '48px', objectFit: 'contain' }} />
                    <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>stackject</span>
                </div>
            </Link>

            {/* Mobile Toggle */}
            <button
                className="hide-on-desktop"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{
                    display: 'none', // Hidden by default, shown via media query
                    background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', zIndex: 1002
                }}
            >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Nav Links */}
            <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`} style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div className="menu-links" style={{ display: 'flex', gap: '2rem', background: 'var(--glass-surface)', padding: '8px 24px', borderRadius: '100px', border: '1px solid var(--glass-border)', alignItems: 'center' }}>
                    <NavLink href="/">Dashboard</NavLink>
                    <NavLink href="/users">Users</NavLink>
                    <NavLink href="/backup">Backup</NavLink>
                </div>

                {/* Auth & Theme */}
                <div className="menu-auth" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>

                    {/* Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: 'var(--glass-surface)',
                            border: '1px solid var(--glass-border)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            zIndex: 1001,
                            position: 'relative',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                        title="Toggle Theme"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    {user && (
                        <button onClick={logout} className="mobile-logout-btn" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }} title="Log Out">
                            <LogOut size={20} /> Logout
                        </button>
                    )}
                </div>
            </div>
            <style jsx>{`
                @media (max-width: 768px) {
                    .hide-on-desktop {
                        display: block !important;
                    }
                    .menu-links {
                        flex-direction: column !important;
                        width: 100% !important;
                        background: transparent !important;
                        border: none !important;
                        padding: 0 !important;
                        align-items: flex-start !important;
                        gap: 1.5rem !important;
                    }
                    .menu-auth {
                        flex-direction: row !important; /* Keep auth items in row or adjust */
                        width: 100% !important;
                        justify-content: space-between !important;
                        border-top: 1px solid var(--glass-border);
                        padding-top: 1.5rem;
                        margin-top: auto;
                    }
                    .user-actions {
                        flex: 1;
                        justify-content: flex-end;
                    }
                    /* Override inline styles for mobile to ensure clean layout */
                    .nav-menu.open {
                        padding-bottom: 3rem !important;
                    }
                }
            `}</style>
        </nav>
    );
}

function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link href={href} style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: 600, transition: 'color 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
            {children}
        </Link>
    )
}
