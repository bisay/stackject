"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Users, FolderGit2, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchStats();
        }
    }, [user, authLoading, router]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Overview</h1>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <StatCard
                        title="Total Users"
                        value={stats?.usersCount || 0}
                        icon={<Users size={24} color="#2563eb" />} // Blue
                    />
                    <StatCard
                        title="Total Projects"
                        value={stats?.projectsCount || 0}
                        icon={<FolderGit2 size={24} color="#9333ea" />} // Purple
                    />
                    <StatCard
                        title="Total Discussions"
                        value={stats?.discussionsCount || 0}
                        icon={<MessageSquare size={24} color="#16a34a" />} // Green
                    />
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
    return (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>{title}</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>{value}</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                {icon}
            </div>
        </div>
    );
}
