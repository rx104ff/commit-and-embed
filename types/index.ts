import type { ChangeEvent } from 'react';

export interface FileName {
    name: string;
    path: string;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (fileName: FileName) => void;
}

export type FileNameInputHandler = (event: ChangeEvent<HTMLInputElement>) => void;
