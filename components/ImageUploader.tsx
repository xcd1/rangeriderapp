import React, { useRef } from 'react';

interface ImageUploaderProps {
    title: string;
    imageData: string | null;
    onUpload: (data: string | null) => void;
    className?: string;
    size?: 'normal' | 'small';
    onZoom?: (imageData: string) => void;
}

const PlusIcon = ({ isSmall }: { isSmall: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
        className={`${isSmall ? 'w-5 h-5 mb-1' : 'w-8 h-8 mb-2'} text-brand-text-muted mx-auto`}>
        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const ZoomIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="11" y1="8" x2="11" y2="14"></line>
        <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
);


const ImageUploader: React.FC<ImageUploaderProps> = ({ title, imageData, onUpload, onZoom, className = '', size = 'normal' }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isSmall = size === 'small';

    const handleFile = (file: File | null) => {
        if (!file) {
            onUpload(null);
            return;
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (!event.target?.result) return;
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Define max dimensions to control file size
                    const MAX_WIDTH = 1280;
                    const MAX_HEIGHT = 1280;
                    let { width, height } = img;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height = height * (MAX_WIDTH / width);
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width = width * (MAX_HEIGHT / height);
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        // Fallback to original if canvas fails
                        onUpload(event.target?.result as string);
                        return;
                    }
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to JPEG with a quality setting. 0.9 is high quality.
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    onUpload(dataUrl);
                };
                img.onerror = () => {
                    // Fallback if image fails to load
                    onUpload(event.target?.result as string);
                }
                img.src = event.target.result as string;
            };
            reader.onerror = () => {
                console.error("Failed to read file.");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        handleFile(file || null);
    };

    const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
        event.preventDefault();
        const items = event.clipboardData.items;

        // First, check for direct image files in clipboard (e.g., from Snipping Tool)
        for (const item of Array.from(items)) {
            // FIX: Cast clipboard item to DataTransferItem to access its properties.
            if ((item as DataTransferItem).type.startsWith('image/')) {
                // FIX: Cast clipboard item to DataTransferItem to access its properties.
                const file = (item as DataTransferItem).getAsFile();
                if (file) {
                    handleFile(file);
                    return; // Exit after handling the first image file
                }
            }
        }
        
        // If no direct image file, check for HTML content (e.g., from Excel)
        for (const item of Array.from(items)) {
            // FIX: Cast clipboard item to DataTransferItem to access its properties.
            if ((item as DataTransferItem).type === 'text/html') {
                try {
                    // FIX: Cast clipboard item to DataTransferItem to access its properties.
                    const htmlString = await new Promise<string>((resolve) => (item as DataTransferItem).getAsString(resolve));
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlString, 'text/html');
                    const img = doc.querySelector('img');

                    if (img && img.src.startsWith('data:image/')) {
                        const response = await fetch(img.src);
                        const blob = await response.blob();
                        const file = new File([blob], "pasted_image.png", { type: blob.type });
                        handleFile(file);
                        return; // Exit after handling the image from HTML
                    }
                } catch (error) {
                    console.error("Failed to handle pasted HTML content:", error);
                }
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
                    {onZoom && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onZoom(imageData);
                            }}
                            className="absolute top-2 left-2 bg-brand-bg/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Ampliar imagem"
                        >
                            <ZoomIcon />
                        </button>
                    )}
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