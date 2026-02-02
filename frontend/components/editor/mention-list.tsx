import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Rocket } from 'lucide-react';

export default forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];

        if (item) {
            props.command({ id: item.id, label: item.name });
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    return (
        <div className="glass-card" style={{
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            background: 'rgba(20, 20, 30, 0.95)',
            border: '1px solid var(--glass-border)',
            minWidth: '200px'
        }}>
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        className={`mention-item ${index === selectedIndex ? 'is-selected' : ''}`}
                        key={index}
                        onClick={() => selectItem(index)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            background: index === selectedIndex ? 'var(--primary)' : 'transparent',
                            color: index === selectedIndex ? 'white' : 'var(--text-main)',
                            border: 'none',
                            borderRadius: '6px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <Rocket size={14} />
                            )}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>@{item.slug}</div>
                        </div>
                    </button>
                ))
            ) : (
                <div className="item" style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No result
                </div>
            )}
        </div>
    );
});
