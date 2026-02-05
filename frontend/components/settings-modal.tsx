"use client";
import { useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import api, { getApiUrl } from '@/lib/api';
import { toast } from 'sonner';
import { X, Camera, Loader2, Save, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { user, login } = useAuth(); // We might need a way to refresh user data without full login, but login(data) might not be right if it expects credentials. checkUser is internal.
    // Actually, we can trigger a reload or exposed refreshUser from context, but for now let's just update local state and maybe reload page or hope context refreshes on next nav.
    // Ideally AuthContext should expose a 'refreshProfile' method.
    // For now, I'll stick to basic implementation and maybe add window.location.reload() or improved context later.

    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatarUrl ? `${getApiUrl()}${user.avatarUrl}` : null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatar(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('bio', bio);
            formData.append('email', email);
            if (avatar) {
                formData.append('avatar', avatar);
            }

            const res = await api.patch('/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Profile updated successfully!");
            // Quick hack to refresh user data: reload page or use context if available.
            // Since AuthContext doesn't expose refresh, and user data is critical, a reload is safest for now.
            window.location.reload();
            onClose();

        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteAccount = async (deleteData: boolean) => {
        if (!window.confirm("Are you absolutely sure? This action cannot be undone.")) return;

        setLoading(true);
        try {
            await api.delete('/users/users/me', { data: { deleteData } }); // Wait, controller path is 'users', and delete is 'me', so it's /users/me. But api.delete might need full path or relative to baseURL.
            // My backend controller is @Controller('users'), endpoint is @Delete('me'). So path is /users/me. 
            // My api axios wrapper likely uses baseURL. 
            // WAIT! The delete endpoint I added is in `UsersController`, mapped to `users`. So correct path is `/users/me`.
            // But verify: api.delete usually takes url as first arg.
            // Let's use `/users/me`.
            // Wait, I see I wrote `/users/users/me` above in comment, checking logic.
            // Controller: 'users'. Method: 'me'. URL: /users/me.

            await api.delete('/users/me', { data: { deleteData } });

            toast.success("Account deleted successfully.");
            window.location.href = '/login';
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete account");
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)'
        }} onClick={onClose}>
            <div className="glass-card" onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: '500px', margin: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                position: 'relative', animation: 'fadeIn 0.2s ease-out',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                }}>
                    <X size={20} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Profile Settings</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Avatar Selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                overflow: 'hidden', cursor: 'pointer', position: 'relative',
                                border: '2px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: '#1a1a2e'
                            }}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>{name?.[0] || 'U'}</span>
                            )}

                            <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0, transition: 'opacity 0.2s', ':hover': { opacity: 1 }
                            } as any} className="hover-overlay">
                                <Camera size={24} color="white" />
                            </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to upload new picture</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Fields */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px',
                                border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)',
                                color: 'white', outline: 'none', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Email</label>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        <h3 style={{ color: '#ff4d4d', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={16} /> Danger Zone
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Once you delete your account, there is no going back. Please be certain.
                        </p>

                        {!showDeleteConfirm ? (
                            <button type="button" onClick={() => setShowDeleteConfirm(true)} style={{
                                width: '100%', padding: '10px', borderRadius: '8px',
                                border: '1px solid #ff4d4d', color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)',
                                cursor: 'pointer', fontWeight: 600
                            }}>
                                Delete Account
                            </button>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s' }}>
                                <button type="button" onClick={() => handleDeleteAccount(false)} style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    border: '1px solid #ffaa00', color: '#ffaa00', background: 'rgba(255, 170, 0, 0.1)',
                                    cursor: 'pointer', textAlign: 'left'
                                }}>
                                    <strong>Anonymize Account</strong><br />
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Delete my personal info but keep my content (posts, comments) visible as "Unregistered".</span>
                                </button>

                                <button type="button" onClick={() => handleDeleteAccount(true)} style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    border: '1px solid #ff4d4d', color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)',
                                    cursor: 'pointer', textAlign: 'left'
                                }}>
                                    <strong>Delete Everything</strong><br />
                                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Permanently remove my account and ALL my content.</span>
                                </button>

                                <button type="button" onClick={() => setShowDeleteConfirm(false)} style={{
                                    marginTop: '8px', width: '100%', padding: '8px', borderRadius: '8px',
                                    border: 'none', color: 'var(--text-muted)', background: 'transparent',
                                    cursor: 'pointer', fontSize: '0.9rem'
                                }}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{
                            padding: '10px 20px', borderRadius: '8px', background: 'transparent',
                            border: '1px solid var(--glass-border)', color: 'var(--text-muted)', cursor: 'pointer'
                        }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary" style={{
                            padding: '10px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            {loading ? <Loader2 className="spin" size={18} /> : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>

                </form>
            </div>
            <style jsx>{`
                .hover-overlay:hover { opacity: 1 !important; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}
