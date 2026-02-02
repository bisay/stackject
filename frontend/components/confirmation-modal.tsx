"use client";
import { X, AlertTriangle, AlertCircle, Trash2, Archive, RotateCcw } from 'lucide-react';
import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    actionLabel?: string;
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, type = 'warning', actionLabel = 'Confirm' }: ConfirmationModalProps) {
    if (!isOpen) return null;

    let Icon = AlertCircle;
    let iconColor = 'var(--primary)';
    let btnClass = 'btn-primary';

    if (type === 'danger') {
        Icon = Trash2;
        iconColor = '#ef4444';
        btnClass = 'btn-danger'; // Need to ensure we have styles or inline it
    } else if (type === 'warning') {
        Icon = Archive;
        iconColor = '#f59e0b'; // Amber
    } else if (type === 'info') {
        Icon = RotateCcw;
        iconColor = 'var(--term-cyan)';
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }} onClick={onClose}>
            <div
                className="glass-card"
                onClick={e => e.stopPropagation()}
                style={{
                    width: '400px',
                    padding: '2rem',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    transform: 'scale(1)',
                    animation: 'float 0.3s ease-out'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: `rgba(${type === 'danger' ? '239, 68, 68' : type === 'warning' ? '245, 158, 11' : '0, 223, 216'}, 0.1)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem'
                    }}>
                        <Icon size={32} color={iconColor} />
                    </div>

                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>{message}</p>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', width: '100%' }}>
                        <button
                            className="btn-ghost"
                            onClick={onClose}
                            style={{ flex: 1, justifyContent: 'center' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            style={{
                                flex: 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                background: type === 'danger' ? 'rgba(239, 68, 68, 0.2)' : type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'var(--glass-surface)',
                                border: `1px solid ${iconColor}`,
                                color: iconColor,
                                borderRadius: '8px',
                                padding: '10px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {actionLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
