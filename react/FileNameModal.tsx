import * as React from 'react';
const { useEffect, useRef, useState } = React;

export type ItemKind = 'Theorem' | 'Lemma' | 'Proposition' | 'Corollary' | 'Definition';

export interface FileNameReactProps {
    onSubmit: (result: { name: string; kind: ItemKind }) => void;
    onClose: () => void;
}

// Small unchanged UI but with a kind selector and returns both name+kind
export const FileNameReact: React.FC<FileNameReactProps> = ({ onSubmit, onClose }: FileNameReactProps) => {
    const [value, setValue] = useState('');
    const [kind, setKind] = useState<ItemKind>('Theorem');
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
        onSubmit({ name: trimmed, kind });
        setValue('');
    };

    return (
        <div style={{ minWidth: 340 }}>
            <h2 style={{ marginTop: 0 }}>Create item</h2>

            <label style={{ display: 'block', marginBottom: 8 }}>
                Type
                <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as ItemKind)}
                    style={{ marginLeft: 8, padding: '6px 8px' }}
                >
                    <option>Theorem</option>
                    <option>Lemma</option>
                    <option>Proposition</option>
                    <option>Corollary</option>
                    <option>Definition</option>
                </select>
            </label>

            <label style={{ display: 'block', marginBottom: 8 }}>
                Name
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    placeholder={`${kind} name`}
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
                        marginTop: 6
                    }}
                />
            </label>

            <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={() => submit()}
                    style={{ padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}
                >
                    OK
                </button>
                <button
                    type="button"
                    onClick={() => onClose()}
                    style={{ padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default FileNameReact;
