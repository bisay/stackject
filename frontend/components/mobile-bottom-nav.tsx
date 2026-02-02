"use client";
import Link from 'next/link';
import { Home, Hash, User, FileCode, PlusSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="mobile-only" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0 24px', // Extra bottom padding for iOS safe area
            zIndex: 9999
        }}>
            <NavLink href="/dashboard" icon={<Home size={26} />} active={isActive('/dashboard')} />
            <NavLink href="/community" icon={<Hash size={26} />} active={isActive('/community')} />

            {/* Central Post Button */}
            <div style={{ transform: 'translateY(-20px)' }}>
                <div style={{
                    background: 'var(--brand-gradient)',
                    borderRadius: '50%', width: '50px', height: '50px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 0, 128, 0.4)'
                }}>
                    <PlusSquare size={24} color="white" />
                </div>
            </div>

            <NavLink href="/project" icon={<FileCode size={26} />} active={isActive('/project')} />
            <NavLink href="/dashboard" icon={<User size={26} />} active={isActive('/profile')} />
        </div>
    );
}

function NavLink({ href, icon, active }: { href: string, icon: any, active: boolean }) {
    return (
        <Link href={href} style={{
            color: active ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textDecoration: 'none'
        }}>
            {icon}
        </Link>
    );
}
