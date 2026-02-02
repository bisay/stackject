"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Plus, Check } from 'lucide-react';

export default function UsersPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Form State
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchUsers();
        }
    }, [user, authLoading, router]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/create', formData);
            setShowCreateModal(false);
            setFormData({ name: '', username: '', email: '', password: '' });
            fetchUsers();
            alert('Admin created successfully');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create admin');
        }
    };

    if (authLoading || loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

    const thStyle: React.CSSProperties = {
        padding: '12px 24px',
        textAlign: 'left',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid var(--glass-border)'
    };

    const tdStyle: React.CSSProperties = {
        padding: '16px 24px',
        borderBottom: '1px solid var(--glass-border)',
        whiteSpace: 'nowrap'
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>User Management</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} /> Create New Admin
                    </button>
                </div>

                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
                                <tr>
                                    <th style={thStyle}>User</th>
                                    <th style={thStyle}>Role</th>
                                    <th style={thStyle}>Joined</th>
                                </tr>
                            </thead>
                            <tbody style={{ backgroundColor: 'transparent' }}>
                                {users.map((u) => (
                                    <tr key={u.id} style={{ transition: 'background 0.2s' }}>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div style={{ height: '40px', width: '40px', flexShrink: 0 }}>
                                                    {u.avatarUrl ? (
                                                        <img style={{ height: '100%', width: '100%', borderRadius: '50%', objectFit: 'cover' }} src={u.avatarUrl} alt="" />
                                                    ) : (
                                                        <div style={{ height: '100%', width: '100%', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                                            {u.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ marginLeft: '1rem' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {u.name || u.username}
                                                        {u.role === 'ADMIN' && <div style={{ background: '#3b82f6', borderRadius: '50%', padding: '2px', display: 'flex' }}><Check size={10} color="white" /></div>}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: u.role === 'ADMIN' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                                color: u.role === 'ADMIN' ? '#16a34a' : 'inherit'
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Admin Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1003,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '2rem', backgroundColor: 'var(--bg-main)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Create New Admin</h2>
                        <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Name</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Username</label>
                                <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Email</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Password</label>
                                <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost" style={{ padding: '10px 20px' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>Create Admin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
