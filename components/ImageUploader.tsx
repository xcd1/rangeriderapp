import React, { useRef } from 'react';

interface ImageUploaderProps {
    title: string;
    imageData: string | null;
    onUpload: (data: string | null) => void;
    className?: string;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-brand-text-muted mb-2 mx-auto"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, imageData, onUpload, className = '' }) => {
    const inputRef = useRef<HTMLInputElement>(null);

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
                <div className="w-full h-full flex flex-col items-center justify-center text-brand-text-muted pointer-events-none">
                    <div 
                        onClick={triggerFileUpload}
                        className="pointer-events-auto cursor-pointer p-4 rounded-lg hover:bg-brand-primary/50 transition-colors"
                    >
                        <PlusIcon />
                        <span className="text-sm font-semibold">{title}</span>
                        <p className="text-xs mt-1">Clique para carregar</p>
                    </div>
                     <p className="text-xs mt-2">ou cole a imagem (Ctrl+V)</p>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;