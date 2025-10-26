import * as React from 'react';

// Defines the types of items the user can create
export type ItemKind = 'Theorem' | 'Lemma' | 'Proposition' | 'Corollary' | 'Definition';

// Defines the component's props
export interface FileNameReactProps {
    onSubmit: (result: { name: string; kind: ItemKind }) => void;
    onClose: () => void;
}

// --- Style Constants ---
const ACCENT = 'var(--interactive-accent, #2563eb)';
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

const cancelButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--text-normal)',
    border: `1px solid ${NEUTRAL_BORDER}`
};

// --- React Component ---
export const FileNameReact: React.FC<FileNameReactProps> = ({ onSubmit, onClose }) => {
    // --- State Hooks ---
    const [value, setValue] = React.useState('');
    const [kind, setKind] = React.useState<ItemKind>('Theorem');
    const [saveHover, setSaveHover] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // --- Effects ---
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

    // --- Handlers ---
    const submit = () => {
        const trimmed = value.trim(); 
        onSubmit({ name: trimmed, kind });
        setValue(''); // Reset value after submit
    };

    // Style for the save button (depends on hover state)
    const saveButtonStyle = (): React.CSSProperties => ({
        padding: '8px 14px',
        borderRadius: 6,
        cursor: 'pointer',
        background: saveHover ? ACCENT_HOVER : ACCENT,
        color: TEXT_ON_ACCENT,
        border: 'none',
        boxShadow: saveHover ? '0 6px 18px rgba(0,0,0,0.12)' : 'none',
        transition: 'background .12s ease, box-shadow .12s ease, transform .06s ease',
        transform: saveHover ? 'translateY(-1px)' : 'none'
    });

    // --- Render ---
    return (
        <div style={containerStyle}>
            <h2 style={headerStyle}>Create item</h2>

            {/* Kind Selector */}
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

            {/* Name Input */}
            <label style={labelStyle}>
                Name
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    placeholder={`(optional) ${kind} name`}
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

            {/* Action Buttons */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                    type="button"
                    onClick={() => submit()} // Button is always enabled
                    onMouseEnter={() => setSaveHover(true)}
                    onMouseLeave={() => setSaveHover(false)}
                    style={saveButtonStyle()}
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
