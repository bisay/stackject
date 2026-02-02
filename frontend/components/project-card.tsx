"use client";
import React from 'react';
import { Rocket, ExternalLink, BadgeCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ProjectCard({ project }: { project: any }) {
    if (!project) return null;

    const isAdminProject = project.owner?.role === 'ADMIN';

    return (
        <a
            href={`/c/${project.owner?.username || 'unknown'}/project/${project.slug}`}
            style={{ textDecoration: 'none', display: 'inline-block', margin: '10px 0', width: '100%' }}
        >
            <span 
                className={isAdminProject ? 'admin-project-card' : 'glass-card'} 
                style={{ 
                    padding: '15px', 
                    display: 'flex', 
                    gap: '15px', 
                    alignItems: 'center', 
                    transition: 'all 0.3s ease', 
                    width: '100%',
                    position: 'relative' as const
                }}
            >
                {isAdminProject && (
                    <span style={{
                        position: 'absolute',
                        top: '-1px',
                        left: '20px',
                        background: 'linear-gradient(135deg, #FF0080, #7928CA, #00DFD8)',
                        backgroundSize: '200% 200%',
                        padding: '4px 12px',
                        borderRadius: '0 0 10px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(121,40,202,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <Sparkles size={10} /> OFFICIAL
                    </span>
                )}
                {project.imageUrl ? (
                    <span style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '10px', 
                        background: `url(${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${project.imageUrl}) center/cover`, 
                        display: 'block', 
                        flexShrink: 0,
                        border: isAdminProject ? '2px solid rgba(121,40,202,0.4)' : 'none',
                        boxShadow: isAdminProject ? '0 4px 15px rgba(121,40,202,0.3)' : 'none'
                    }}></span>
                ) : (
                    <span style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '10px', 
                        background: isAdminProject 
                            ? 'linear-gradient(135deg, rgba(255,0,128,0.25), rgba(121,40,202,0.25), rgba(0,223,216,0.25))' 
                            : 'var(--glass-surface)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexShrink: 0,
                        boxShadow: isAdminProject ? '0 4px 15px rgba(121,40,202,0.3)' : 'none'
                    }}>
                        <Rocket size={24} color={isAdminProject ? '#7928CA' : 'var(--primary)'} />
                    </span>
                )}

                <span style={{ flex: 1, display: 'block', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {project.name}
                        {isAdminProject && (
                            <BadgeCheck size={16} style={{ color: '#1DA1F2', filter: 'drop-shadow(0 0 3px rgba(29,161,242,0.5))' }} />
                        )}
                        <ExternalLink size={14} color="var(--text-muted)" />
                    </span>
                    <span style={{ 
                        fontSize: '0.85rem', 
                        color: isAdminProject ? 'var(--primary)' : 'var(--text-muted)', 
                        marginTop: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        by @{project.owner?.username || 'unknown'}
                        {isAdminProject && <BadgeCheck size={12} style={{ color: '#1DA1F2' }} />}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {project.description || "No description provided."}
                    </span>
                </span>
            </span>
        </a>
    );
}
