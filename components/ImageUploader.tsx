import React, { useRef } from 'react';

interface ImageUploaderProps {
    title: string;
    imageData: string | null;
    onUpload: (data: string | null) => void;
    className?: string;
    size?: 'normal' | 'small';
}

const PlusIcon = ({ isSmall }: { isSmall: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
        className={`${isSmall ? 'w-5 h-5 mb-1' : 'w-8 h-8 mb-2'} text-brand-text-muted mx-auto`}>
        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);


const ImageUploader: React.FC<ImageUploaderProps> = ({ title, imageData, onUpload, className = '', size = 'normal' }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isSmall = size === 'small';

    const handleFile = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpload(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        handleFile(file || null);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const file = items[i].getAsFile();
                handleFile(file);
                event.preventDefault();
                return;
            }
        }
    };
    
    const handleRemoveImage = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onUpload(null);
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Delete' && imageData) {
            handleRemoveImage(event);
        }
    };
    
    const triggerFileUpload = (e: React.MouseEvent) => {
        e.stopPropagation();
        inputRef.current?.click();
    };

    return (
        <div 
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            title={`Clique para carregar, cole (Ctrl+V) para adicionar, ou pressione 'Delete' para remover a imagem.`}
            className={`relative bg-brand-bg rounded-lg border-2 border-dashed border-brand-primary flex items-center justify-center text-center p-2 group transition-colors hover:border-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-secondary ${className}`}>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            {imageData ? (
                <>
                    <img src={imageData} alt={title} className="max-w-full max-h-full object-contain rounded-md" />
                    <button 
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-700/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold"
                        title="Remover imagem"
                    >
                        X
                    </button>
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-brand-text-muted pointer-events-none overflow-hidden">
                    <div 
                        onClick={triggerFileUpload}
                        className={`pointer-events-auto cursor-pointer rounded-lg hover:bg-brand-primary/50 transition-colors ${isSmall ? 'p-1' : 'p-4'}`}
                    >
                        <PlusIcon isSmall={isSmall} />
                        <span className={`font-semibold block ${isSmall ? 'text-xs' : 'text-sm'}`}>{title}</span>
                        {!isSmall && <p className="text-xs mt-1">Clique para carregar</p>}
                    </div>
                     <p className={`leading-tight ${isSmall ? 'text-[10px] mt-0.5' : 'text-xs mt-2'}`}>ou cole a imagem (Ctrl+V)</p>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;