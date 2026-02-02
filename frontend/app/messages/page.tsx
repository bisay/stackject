"use client";
import React, { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/navbar';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Loader2, Send, Search, MessageSquare, ArrowLeft, PlusCircle, X, Paperclip, File as FileIcon } from 'lucide-react';

export default function MessagesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialPartnerId = searchParams.get('userId');

    const [conversations, setConversations] = useState<any[]>([]);
    const [activePartner, setActivePartner] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Attachment State
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [attachmentType, setAttachmentType] = useState<string | null>(null);

    // Initialize Active Partner from URL params OR LocalStorage (Clean URL)
    useEffect(() => {
        // 1. Priority: LocalStorage (from Profile click)
        const pendingUser = localStorage.getItem('pendingChatUser');
        if (pendingUser) {
            try {
                const userObj = JSON.parse(pendingUser);
                setActivePartner(userObj);
                localStorage.removeItem('pendingChatUser'); // Consume it
                return;
            } catch (e) {
                console.error("Failed to parse pending chat user");
            }
        }

        // 2. Fallback: URL Params (Legacy support)
        if (!initialPartnerId) return;

        const pName = searchParams.get('name');
        const pUsername = searchParams.get('username');
        const pAvatar = searchParams.get('avatarUrl');

        if (pName && pUsername) {
            setActivePartner({
                id: initialPartnerId,
                name: decodeURIComponent(pName),
                username: pUsername,
                avatarUrl: pAvatar ? decodeURIComponent(pAvatar) : null
            });
        }
    }, [initialPartnerId, searchParams]);

    // Fetch conversations
    useEffect(() => {
        if (!user) return;

        const fetchConversations = async () => {
            try {
                const res = await api.get('/messages/conversations');
                setConversations(res.data);

                // If fetching conversations reveals existing partner name that differs or improves info, update it?
                // Actually, if we deep linked, we have info. If we didn't, we need to fetch info ONLY if we don't have it.
                if (initialPartnerId && !activePartner) {
                    // Check existing conversations
                    const existing = res.data.find((c: any) => c.partner.id === initialPartnerId);
                    if (existing) {
                        setActivePartner(existing.partner);
                    } else {
                        // If URL params were missing, fetch from ID
                        try {
                            const partnerRes = await api.get(`/users/id/${initialPartnerId}`);
                            setActivePartner(partnerRes.data);
                        } catch (e) {
                            console.error("Failed to fetch partner by ID", e);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, [user, initialPartnerId]); // Added activePartner to dep might cause loops? No, we check !activePartner inside. But let's avoid adding it to dep.

    // Fetch messages for active partner & Mark as read
    useEffect(() => {
        if (!activePartner) return;
        const fetchMessages = async () => {
            try {
                const res = await api.get(`/messages/${activePartner.id}`);
                setMessages(res.data);

                // Mark as read immediately when fetching active chat
                api.post(`/messages/${activePartner.id}/read`).catch(() => { });

                if (res.data.length > 0) {
                    const firstMsg = res.data[0];
                    // Logic for partner details...
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll messages
        return () => clearInterval(interval);
    }, [activePartner]);

    // Scroll to bottom logic
    const prevMessagesLength = useRef(0);

    useEffect(() => {
        const container = chatContainerRef.current;
        const isNewMessage = messages.length > prevMessagesLength.current;

        if (isNewMessage) {
            const lastMessage = messages[messages.length - 1];
            const isMe = lastMessage?.senderId === user?.id;

            // Check if user is near bottom (within 150px)
            let isNearBottom = false;
            if (container) {
                const { scrollTop, scrollHeight, clientHeight } = container;
                isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
            }

            // Scroll if first load, my message, or already at bottom
            if (prevMessagesLength.current === 0 || isMe || isNearBottom) {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages, user]);

    // Force scroll on partner change
    useEffect(() => {
        prevMessagesLength.current = 0; // Reset
    }, [activePartner]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.type.startsWith('video/')) {
            if (file.size > 50 * 1024 * 1024) { // 50MB
                alert("Video too large (Max 50MB)");
                return;
            }
        } else if (file.type.startsWith('image/')) {
            if (file.size > 10 * 1024 * 1024) { // 10MB
                alert("Image too large (Max 10MB)");
                return;
            }
        }

        setAttachment(file);
        setAttachmentType(file.type);
        const url = URL.createObjectURL(file);
        setAttachmentPreview(url);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!input.trim() && !attachment) || !activePartner) return;

        try {
            let attachmentUrl = undefined;
            let type = undefined;

            if (attachment) {
                const formData = new FormData();
                formData.append('file', attachment);
                const uploadRes = await api.post('/messages/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                attachmentUrl = uploadRes.data.url;
                type = attachment.type;
            }

            await api.post('/messages', {
                receiverId: activePartner.id,
                content: input || (attachment ? 'Sent a file' : ''),
                attachmentUrl,
                attachmentType: type
            });
            setInput("");
            setAttachment(null);
            setAttachmentPreview(null);
            setAttachmentType(null);

            // Optimistic update? Or just wait for poll. Poll is fast enough (3s) or manual trigger.
            // Do manual trigger
            const res = await api.get(`/messages/${activePartner.id}`);
            setMessages(res.data);

            // Refresh conversations to bump to top
            const convRes = await api.get('/messages/conversations');
            setConversations(convRes.data);
        } catch (err: any) {
            console.error(err);
            alert("Failed to send: " + (err.response?.data?.message || err.message));
        }
    };

    const [showNewChat, setShowNewChat] = useState(false);
    const [newChatUsername, setNewChatUsername] = useState("");

    const handleNewChat = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Find user by username using the existing profile endpoint
            // Note: This endpoint gets full profile, which is fine.
            const res = await api.get(`/users/${newChatUsername}`);
            setActivePartner(res.data);
            setShowNewChat(false);
            setNewChatUsername("");
        } catch (err) {
            alert("User not found");
        }
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Loader2 className="spin" /></div>;

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <div className={`messages-layout ${activePartner ? 'show-chat' : 'show-list'}`} style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', display: 'flex', height: 'calc(100vh - 80px)', borderTop: '1px solid var(--glass-border)' }}>

                {/* Conversations Sidebar */}
                <div className="sidebar" style={{ borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Messages</h2>
                    </div>



                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {conversations.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                No conversations yet.
                            </div>
                        ) : (
                            conversations.map((c: any) => (
                                <div
                                    key={c.partner.id}
                                    onClick={() => setActivePartner(c.partner)}
                                    style={{
                                        padding: '15px 20px',
                                        borderBottom: '1px solid var(--glass-border)',
                                        cursor: 'pointer',
                                        background: activePartner?.id === c.partner.id ? 'var(--glass-surface)' : 'transparent',
                                        display: 'flex', alignItems: 'center', gap: '12px'
                                    }}
                                    className="hover:bg-white/5"
                                >
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                        {c.partner.avatarUrl ? <img src={c.partner.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.partner.name?.[0]}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                            {c.partner.name}
                                            {c.unreadCount > 0 && (
                                                <span style={{
                                                    background: '#ff4444', color: 'white',
                                                    borderRadius: '50%', width: '18px', height: '18px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.7rem', fontWeight: 'bold'
                                                }}>
                                                    {c.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: c.unreadCount > 0 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: c.unreadCount > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {c.lastMessage.senderId === user?.id ? 'You: ' : ''}{c.lastMessage.content}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {new Date(c.lastMessage.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                    {activePartner ? (
                        <>
                            {/* Header */}
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--glass-bg)' }}>
                                <button
                                    className="mobile-only"
                                    onClick={() => setActivePartner(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: 0 }}
                                >
                                    <ArrowLeft size={24} />
                                </button>
                                <Link href={`/c/${activePartner.username}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
                                    {activePartner.avatarUrl ? (
                                        <img src={activePartner.avatarUrl} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                                            {activePartner.name?.[0].toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{activePartner.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{activePartner.username}</div>
                                    </div>
                                </Link>
                            </div>

                            {/* Messages */}
                            <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* ... messages map ... */}
                                {messages.map((m: any) => {
                                    const isMe = m.senderId === user?.id;
                                    return (
                                        <div key={m.id} style={{
                                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%', // Increased max-width for mobile
                                            display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start'
                                        }}>
                                            <div style={{
                                                background: isMe ? 'var(--primary)' : 'var(--glass-surface)',
                                                color: isMe ? 'white' : 'var(--text-main)',
                                                padding: '10px 15px', borderRadius: '18px',
                                                borderBottomRightRadius: isMe ? '4px' : '18px',
                                                borderBottomLeftRadius: isMe ? '18px' : '4px',
                                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                                border: isMe ? 'none' : '1px solid var(--glass-border)'
                                            }}>
                                                {m.attachmentUrl && (
                                                    <div style={{ marginBottom: '8px' }}>
                                                        {m.attachmentType?.startsWith('image/') ? (
                                                            <img src={m.attachmentUrl} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(m.attachmentUrl, '_blank')} />
                                                        ) : m.attachmentType?.startsWith('video/') ? (
                                                            <video src={m.attachmentUrl} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
                                                        ) : (
                                                            <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px', color: 'white', textDecoration: 'none' }}>
                                                                <FileIcon size={20} />
                                                                <span>Download File</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {m.content}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'var(--glass-bg)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {/* Preview Attached File */}
                                {attachmentPreview && (
                                    <div style={{ position: 'relative', width: 'fit-content', maxWidth: '200px' }}>
                                        {attachmentType?.startsWith('image/') ? (
                                            <img src={attachmentPreview} style={{ borderRadius: '8px', maxHeight: '150px', maxWidth: '100%', border: '1px solid var(--glass-border)' }} />
                                        ) : attachmentType?.startsWith('video/') ? (
                                            <video src={attachmentPreview} style={{ borderRadius: '8px', maxHeight: '150px', maxWidth: '100%', border: '1px solid var(--glass-border)' }} controls={false} />
                                        ) : (
                                            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Paperclip size={16} /> Attached File
                                            </div>
                                        )}
                                        <button
                                            onClick={() => { setAttachment(null); setAttachmentPreview(null); setAttachmentType(null); }}
                                            style={{ position: 'absolute', top: -8, right: -8, background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleFileSelect}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ marginBottom: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
                                        className="hover-bg-icon"
                                    >
                                        <Paperclip size={20} />
                                    </button>

                                    <textarea
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend(e);
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: '18px', border: '1px solid var(--glass-border)',
                                            background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none',
                                            resize: 'none', minHeight: '44px', maxHeight: '120px', fontFamily: 'inherit', lineHeight: '1.4'
                                        }}
                                        rows={1}
                                    />
                                    <button type="submit" disabled={!input.trim() && !attachment} style={{
                                        width: '45px', height: '45px', borderRadius: '50%', background: 'var(--primary)',
                                        color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: (input.trim() || attachment) ? 'pointer' : 'default', opacity: (input.trim() || attachment) ? 1 : 0.5,
                                        marginBottom: '2px'
                                    }}>
                                        <Send size={20} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state desktop-hidden" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
                            <div style={{ width: '80px', height: '80px', background: 'var(--glass-surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                <MessageSquare size={40} />
                            </div>
                            <h3>Select a conversation</h3>
                            <p>Choose a user from the sidebar or start a new chat from a profile.</p>
                        </div>
                    )}
                </div>

            </div>
            <style jsx>{`
                .sidebar { width: 300px; }
                @media (max-width: 768px) {
                    .messages-layout.show-list .sidebar { width: 100%; display: flex !important; }
                    .messages-layout.show-list .chat-area { display: none !important; }
                    
                    .messages-layout.show-chat .sidebar { display: none !important; }
                    .messages-layout.show-chat .chat-area { display: flex !important; width: 100%; }
                    
                    /* Empty state on mobile should be hidden if sidebar is shown, effectively empty state is sidebar default */
                    .empty-state { display: none !important; } 
                }
            `}</style>
        </main>
    )
}
