import * as React from 'react';

export type ItemKind = 'Theorem' | 'Lemma' | 'Proposition' | 'Corollary' | 'Definition';

export interface FileNameReactProps {
    onSubmit: (result: { name: string; kind: ItemKind }) => void;
    onClose: () => void;
}

const ACCENT = 'var(--interactive-accent, #2563eb)';        // primary (Save) color — blue fallback
const ACCENT_HOVER = 'var(--interactive-accent-hover, #1e40af)';
const NEUTRAL_BORDER = 'var(--interactive-border, #cfcfcf)';
const TEXT_ON_ACCENT = 'var(--text-on-accent, #fff)';

const containerStyle: React.CSSProperties = {
    minWidth: 340,
    padding: 12,
    fontFamily: 'var(--font-family)',
    color: 'var(--text-normal)',
    background: 'var(--background-primary)'
};

const headerStyle: React.CSSProperties = { marginTop: 0, marginBottom: 8 };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 8, fontSize: 13 };

const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    fontSize: 14,
    borderRadius: 6,
    border: `1px solid ${NEUTRAL_BORDER}`,
    marginTop: 6,
    background: 'var(--background-primary)'
};

export const FileNameReact: React.FC<FileNameReactProps> = ({ onSubmit, onClose }: FileNameReactProps) => {
    const [value, setValue] = React.useState('');
    const [kind, setKind] = React.useState<ItemKind>('Theorem');
    const [saveHover, setSaveHover] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
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

    const trimmed = value.trim();
    const submit = () => {
        if (!trimmed) return;
        onSubmit({ name: trimmed, kind });
        setValue('');
    };

    const saveButtonStyle = (enabled: boolean): React.CSSProperties => ({
        padding: '8px 14px',
        borderRadius: 6,
        cursor: enabled ? 'pointer' : 'not-allowed',
        background: enabled ? (saveHover ? ACCENT_HOVER : ACCENT) : 'rgba(0,0,0,0.08)',
        color: enabled ? TEXT_ON_ACCENT : 'var(--text-muted)',
        border: 'none',
        boxShadow: enabled && saveHover ? '0 6px 18px rgba(0,0,0,0.12)' : 'none',
        transition: 'background .12s ease, box-shadow .12s ease, transform .06s ease',
        transform: saveHover && enabled ? 'translateY(-1px)' : 'none'
    });

    const cancelButtonStyle: React.CSSProperties = {
        padding: '8px 12px',
        borderRadius: 6,
        cursor: 'pointer',
        background: 'transparent',
        color: 'var(--text-normal)',
        border: `1px solid ${NEUTRAL_BORDER}`
    };

    return (
        <div style={containerStyle}>
            <h2 style={headerStyle}>Create item</h2>

            <label style={labelStyle}>
                Type
                <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as ItemKind)}
                    style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 6 }}
                >
                    <option>Theorem</option>
                    <option>Lemma</option>
                    <option>Proposition</option>
                    <option>Corollary</option>
                    <option>Definition</option>
                </select>
            </label>

            <label style={labelStyle}>
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
                    style={inputStyle}
                    aria-label="Item name"
                />
            </label>

            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={() => submit()}
                    onMouseEnter={() => setSaveHover(true)}
                    onMouseLeave={() => setSaveHover(false)}
                    style={saveButtonStyle(Boolean(trimmed))}
                    aria-disabled={!trimmed}
                    disabled={!trimmed}
                >
                    Save
                </button>

                <button
                    type="button"
                    onClick={() => onClose()}
                    style={cancelButtonStyle}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default FileNameReact;
