"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function SetupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        name: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if admin already exists
        api.post('/admin/setup', { check: true }).catch(err => {
            if (err.response?.status === 403) {
                router.push('/login');
            }
        });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/admin/setup', formData);
            router.push('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Setup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at top left, #a1a1aa, #f4f4f5)', // Light mode equivalent or keep dark? The login was dark. Let's make it consistent with login.
            // Actually login used: background: 'radial-gradient(circle at top left, #2a2a40, #000)'
            // Let's use the login style for consistency.
            backgroundColor: '#000',
            backgroundImage: 'radial-gradient(circle at top left, #2a2a40, #000)',
            padding: '1rem'
        }}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                border: '1px solid var(--glass-border)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Admin Setup
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>Create the first administrator account</p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Full Name</label>
                        <input
                            type="text"
                            required
                            style={{ width: '100%' }}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Username</label>
                        <input
                            type="text"
                            required
                            style={{ width: '100%' }}
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Email Address</label>
                        <input
                            type="email"
                            required
                            style={{ width: '100%' }}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Password</label>
                        <input
                            type="password"
                            required
                            style={{ width: '100%' }}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{ marginTop: '1rem', width: '100%', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Setting up...' : 'Create Admin Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
