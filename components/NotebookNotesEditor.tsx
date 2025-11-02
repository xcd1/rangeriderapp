import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ToolbarButtonProps {
    onClick: (e: React.MouseEvent) => void;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
}
const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, children, title, disabled = false }) => (
    <button onMouseDown={onClick} title={title} disabled={disabled} className="w-8 h-8 flex items-center justify-center rounded hover:bg-brand-secondary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {children}
    </button>
);

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: string;
}
const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, content }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-brand-primary rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 border border-brand-bg flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-brand-secondary mb-4">Exportar para Google Docs</h2>
                <p className="text-brand-text-muted mb-4 text-sm">Para exportar, siga estes passos:</p>
                <ol className="list-decimal list-inside text-brand-text mb-4 text-sm space-y-2">
                    <li>Clique no botão "Copiar HTML" abaixo.</li>
                    <li>Abra um novo <a href="https://docs.new" target="_blank" rel="noopener noreferrer" className="text-brand-secondary underline">Google Doc</a> em branco.</li>
                    <li>Cole o conteúdo copiado (Ctrl+V ou Cmd+V) no documento.</li>
                </ol>
                <textarea readOnly value={content} className="w-full h-32 bg-brand-bg text-brand-text-muted rounded-md p-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-secondary"></textarea>
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={() => navigator.clipboard.writeText(content)} className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-secondary hover:brightness-110 text-brand-primary transition-all">Copiar HTML</button>
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-bg hover:brightness-125 transition-all">Fechar</button>
                </div>
            </div>
        </div>
    );
};

interface NotebookNotesEditorProps {
    notebookId: string;
    initialContent: string;
    onSave: (notebookId: string, updates: { notes: string }) => Promise<void>;
    onBack?: () => void;
    isSplitViewMode?: boolean;
}

const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS'];
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

const imageEditorStyles = `
    .resizable-image-container {
        outline: 2px solid transparent;
        transition: outline-color 0.2s;
        /* Fix for weird selection behavior in Firefox */
        -moz-user-select: none;
    }
    .resizable-image-container.selected {
        outline-color: #f5c339; /* brand-secondary */
    }
    .resizable-image-container .resize-handle {
        display: none;
    }
    .resizable-image-container.selected .resize-handle {
        display: block;
    }
`;

export const NotebookNotesEditor: React.FC<NotebookNotesEditorProps> = ({ notebookId, initialContent, onSave, onBack, isSplitViewMode = false }) => {
    const [saveStatus, setSaveStatus] = useState<'salvo' | 'salvando' | 'não salvo'>('salvo');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<HTMLDivElement | null>(null);
    
    const editorRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef(initialContent);
    const saveTimeoutRef = useRef<number | null>(null);
    const lastSavedContent = useRef(initialContent);

    // Set initial content once when the component mounts or the notebook changes.
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== initialContent) {
            editorRef.current.innerHTML = initialContent;
        }
        contentRef.current = initialContent;
        lastSavedContent.current = initialContent;
    }, [initialContent]);

    const triggerSave = useCallback(() => {
        setSaveStatus('salvando');
        onSave(notebookId, { notes: contentRef.current }).then(() => {
            setSaveStatus('salvo');
            lastSavedContent.current = contentRef.current;
        });
    }, [notebookId, onSave]);

    // Auto-save logic
    useEffect(() => {
        if (saveStatus !== 'não salvo') return;
        
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = window.setTimeout(triggerSave, 2000); // 2-second debounce

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [saveStatus, triggerSave]);

    const handleManualSave = useCallback(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (saveStatus !== 'salvo') {
            triggerSave();
        }
    }, [triggerSave, saveStatus]);


    const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
        contentRef.current = e.currentTarget.innerHTML;
        if (contentRef.current !== lastSavedContent.current) {
            setSaveStatus('não salvo');
        }
    };
    
    const handleCommand = (e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>, command: string, value?: string) => {
        e.preventDefault();
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        if (editorRef.current) {
            handleContentChange({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
        }
    };
    
    const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const size = e.target.value;
        if (!size) return;
        e.preventDefault();
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('fontSize', false, '1'); // Use a placeholder size
        const fontElements = editorRef.current?.getElementsByTagName('font');
        if (fontElements) {
            for (let i = 0; i < fontElements.length; i++) {
                if (fontElements[i].size === "1") {
                    fontElements[i].removeAttribute("size");
                    fontElements[i].style.fontSize = size + "px";
                }
            }
        }
        editorRef.current?.focus();
        if (editorRef.current) {
           handleContentChange({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
        }
    };
    
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head><title>Imprimir Anotações</title>
                    <style>
                        body { font-family: sans-serif; padding: 2rem; }
                        img { max-width: 100%; }
                    </style>
                    </head>
                    <body>${contentRef.current}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

     const insertImageHTML = (dataUrl: string) => {
        const html = `
            <div class="resizable-image-container" style="position: relative; display: inline-block; width: 50%;" contenteditable="false">
                <img src="${dataUrl}" style="width: 100%; height: auto; display: block;" />
                <div class="resize-handle" style="position: absolute; width: 12px; height: 12px; background: #2c5a6d; border: 2px solid #f5c339; bottom: -6px; right: -6px; cursor: se-resize; z-index: 10;"></div>
            </div>&nbsp;
        `;
        document.execCommand('insertHTML', false, html);
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                insertImageHTML(dataUrl);
            };
            reader.readAsDataURL(file);
        }
        if (imageInputRef.current) imageInputRef.current.value = "";
    };

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
        const items = e.clipboardData.items;
        for (const item of Array.from(items)) {
            // FIX: Cast clipboard item to DataTransferItem to access its properties, resolving 'property does not exist on type unknown' errors.
            if ((item as DataTransferItem).type.startsWith('image/')) {
                e.preventDefault();
                // FIX: Cast clipboard item to DataTransferItem to access its properties.
                const file = (item as DataTransferItem).getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        insertImageHTML(dataUrl);
                    };
                    reader.readAsDataURL(file);
                }
                return;
            }
        }
    }, []);

    const handleImageAlignment = (align: 'left' | 'right' | 'none') => {
        if (!selectedImage) return;

        selectedImage.style.float = align === 'none' ? 'none' : align;
        selectedImage.style.margin = align === 'none' ? '' : (align === 'left' ? '0.5em 1em 0.5em 0' : '0.5em 0 0.5em 1em');
        
        if (editorRef.current) {
            handleContentChange({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
        }
        editorRef.current?.focus();
    };

    useEffect(() => {
        const resizeHandle = selectedImage?.querySelector('.resize-handle') as HTMLDivElement;
        if (!resizeHandle || !selectedImage) return;

        const onMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = selectedImage.offsetWidth;

            const onMouseMove = (moveEvent: MouseEvent) => {
                const newWidth = startWidth + (moveEvent.clientX - startX);
                if (newWidth > 50) { // Minimum width
                    selectedImage.style.width = `${newWidth}px`;
                }
            };

            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                if (editorRef.current) {
                    handleContentChange({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
                }
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };

        resizeHandle.addEventListener('mousedown', onMouseDown);
        return () => resizeHandle.removeEventListener('mousedown', onMouseDown);
    }, [selectedImage]);

    const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const wrapper = target.closest('.resizable-image-container') as HTMLDivElement | null;
        
        if (selectedImage && selectedImage !== wrapper) {
            selectedImage.classList.remove('selected');
        }

        if (wrapper && wrapper !== selectedImage) {
            wrapper.classList.add('selected');
            setSelectedImage(wrapper);
        } else if (!wrapper) {
            setSelectedImage(null);
        }
    }, [selectedImage]);

    useEffect(() => {
        if (!selectedImage) {
            editorRef.current?.querySelectorAll('.resizable-image-container.selected').forEach(el => el.classList.remove('selected'));
        }
    }, [selectedImage]);


    const getSaveStatusText = () => {
        switch (saveStatus) {
            case 'salvo': return 'Salvo.';
            case 'salvando': return 'Salvando...';
            case 'não salvo': return 'Alterações pendentes.';
        }
    };

    return (
        <div className="flex flex-col h-full bg-brand-bg p-1">
            <style>{imageEditorStyles}</style>
            <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageFileChange} style={{ display: 'none' }} />
            <div className="flex items-center justify-between mb-4 flex-shrink-0 px-1">
                {!isSplitViewMode && onBack ? (
                    <button onClick={onBack} className="text-sm font-bold text-brand-secondary hover:underline inline-flex items-center p-2 rounded-md hover:bg-brand-primary gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        Voltar
                    </button>
                ) : <div />}
                <div className="flex items-center gap-4">
                     <span className="text-sm text-brand-text-muted">{getSaveStatusText()}</span>
                     <button onClick={handleManualSave} disabled={saveStatus !== 'não salvo'} title="Salvar Agora" className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold p-2 rounded-md transition-colors text-sm flex items-center justify-center w-8 h-8 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-[19px] w-[19px]" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm3 0h4v3H8V4zm2 11a1 1 0 100-2 1 1 0 000 2z"/></svg>
                    </button>
                    <button onClick={handlePrint} title="Imprimir/Exportar PDF" className="p-2 rounded hover:bg-brand-primary text-brand-text-muted hover:text-brand-text flex items-center justify-center w-8 h-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-[19px] w-[19px]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v-2.5D5 8.724 5.724 8 6.5 8h7c.776 0 1.5.724 1.5 1.5V14h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 12.5V12h14v.5z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => setIsExportModalOpen(true)} title="Exportar para Google Docs" className="p-2 rounded hover:bg-brand-primary text-brand-text-muted hover:text-brand-text flex items-center justify-center w-8 h-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-[19px] w-[19px]" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
                    </button>
                </div>
            </div>
            <div className="bg-brand-primary rounded-lg border border-brand-bg flex-grow flex flex-col min-h-0">
                <div className="flex flex-wrap items-center gap-2 p-2 border-b border-brand-bg text-brand-text">
                    <ToolbarButton title="Negrito (Ctrl+B)" onClick={(e) => handleCommand(e, 'bold')}>
                        <span className="font-bold text-lg">B</span>
                    </ToolbarButton>
                    <ToolbarButton title="Itálico (Ctrl+I)" onClick={(e) => handleCommand(e, 'italic')}>
                        <span className="font-serif italic text-lg">I</span>
                    </ToolbarButton>
                    <ToolbarButton title="Sublinhado (Ctrl+U)" onClick={(e) => handleCommand(e, 'underline')}>
                        <span className="underline text-lg">U</span>
                    </ToolbarButton>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <select onChange={(e) => handleCommand(e, 'fontName', e.target.value)} className="bg-brand-bg rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary">
                        {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                    <select onChange={handleFontSizeChange} className="bg-brand-bg rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary">
                        <option value="">Tamanho</option>
                        {fontSizes.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <ToolbarButton title="Alinhar à Esquerda" onClick={(e) => handleCommand(e, 'justifyLeft')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></ToolbarButton>
                    <ToolbarButton title="Centralizar" onClick={(e) => handleCommand(e, 'justifyCenter')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></ToolbarButton>
                    <ToolbarButton title="Alinhar à Direita" onClick={(e) => handleCommand(e, 'justifyRight')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 10a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></ToolbarButton>
                    <ToolbarButton title="Aumentar Recuo" onClick={(e) => handleCommand(e, 'indent')}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM11.707 9.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L13.586 11H11a1 1 0 110-2h2.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg></ToolbarButton>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <ToolbarButton title="Inserir Imagem" onClick={() => imageInputRef.current?.click()}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                    </ToolbarButton>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <ToolbarButton title="Alinhar Imagem à Esquerda" onClick={() => handleImageAlignment('left')} disabled={!selectedImage}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h4v4H5V5zm6 0h4v2h-4V5zm0 4h4v2h-4V9zm0 4h4v2h-4v-2z" /></svg>
                    </ToolbarButton>
                    <ToolbarButton title="Remover Alinhamento da Imagem" onClick={() => handleImageAlignment('none')} disabled={!selectedImage}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    </ToolbarButton>
                     <ToolbarButton title="Alinhar Imagem à Direita" onClick={() => handleImageAlignment('right')} disabled={!selectedImage}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm10 2v4h-4V5h4zM5 5h4v2H5V5zm0 4h4v2H5V9zm0 4h4v2H5v-2z" /></svg>
                    </ToolbarButton>
                </div>
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    onBlur={handleManualSave}
                    onClick={handleEditorClick}
                    onPaste={handlePaste}
                    className="p-6 flex-grow overflow-y-auto focus:outline-none bg-white text-gray-800 rounded-b-md shadow-inner"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                />
            </div>
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} content={contentRef.current} />
        </div>
    );
};