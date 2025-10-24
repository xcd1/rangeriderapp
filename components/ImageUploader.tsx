
import React, { useRef } from 'react';

interface ImageUploaderProps {
    title: string;
    imageData: string | null;
    onUpload: (data: string | null) => void;
    className?: string;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-500 mb-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, imageData, onUpload, className = '' }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpload(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onUpload(null);
    }

    return (
        <div className={`relative bg-gray-900 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center text-center p-2 group transition-colors hover:border-blue-500 ${className}`}>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {imageData ? (
                <>
                    <img src={imageData} alt={title} className="max-w-full max-h-full object-contain rounded-md" />
                    <button 
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-600/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold"
                        title="Remover imagem"
                    >
                        X
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center text-gray-500">
                    <PlusIcon />
                    <span className="text-sm font-semibold">{title}</span>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
