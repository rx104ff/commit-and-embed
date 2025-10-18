import * as React from 'react';
const { useEffect, useRef, useState } = React;

export interface FileNameReactProps {
    onSubmit: (name: string) => void;
    onClose: () => void;
}

export const FileNameReact: React.FC<FileNameReactProps> = ({ onSubmit, onClose }: FileNameReactProps) => {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const submit = () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
        setValue('');
    };

    return (
        <div style={{ minWidth: 300 }}>
            <h2 style={{ marginTop: 0 }}>Enter Theorem Name</h2>
            <input
                ref={inputRef}
                type="text"
                value={value}
                placeholder="Theorem name"
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submit();
                    }
                }}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px 8px',
                    fontSize: '14px',
                    borderRadius: 4,
                    border: '1px solid var(--interactive-border, #ccc)',
                }}
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={() => {
                        submit();
                    }}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 4,
                        cursor: 'pointer',
                    }}
                >
                    OK
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onClose();
                    }}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 4,
                        cursor: 'pointer',
                    }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default FileNameReact;
