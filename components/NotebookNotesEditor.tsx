import React, { useState, useEffect, useRef, useCallback } from 'react';

// Icons
const BoldIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"></path></svg>;
const ItalicIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"></path></svg>;
const UnderlineIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"></path></svg>;
const AlignLeftIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"></path></svg>;
const AlignCenterIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"></path></svg>;
const AlignRightIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"></path></svg>;
const IndentIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 21h18v-2H3v2zM3 3v2h18V3H3zm8 4h10V7H11v2zm0 4h10v-2H11v2zm0 4h10v-2H11v2zM3 7l4 4-4 4V7z"></path></svg>;
const OutdentIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-4h18V3H3v2zm4 12V7l-4 4 4 4z"></path></svg>;
const PrintIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM16 19H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM18 3H6v4h12V3z"></path></svg>;
const GoogleDocsIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="#4285F4"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16H8v-2h4v2zm4-4H8v-2h8v2zm-2-4H8V8h6v2z"></path></svg>;
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;


interface ToolbarButtonProps {
    onClick: (e: React.MouseEvent) => void;
    children: React.ReactNode;
    title: string;
}
const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, children, title }) => (
    <button onMouseDown={onClick} title={title} className="p-2 rounded hover:bg-brand-secondary/20 transition-colors">
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
    onBack: () => void;
}

const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS'];
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

const NotebookNotesEditor: React.FC<NotebookNotesEditorProps> = ({ notebookId, initialContent, onSave, onBack }) => {
    const [saveStatus, setSaveStatus] = useState<'salvo' | 'salvando' | 'não salvo'>('salvo');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    
    const editorRef = useRef<HTMLDivElement>(null);
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


    // Auto-save logic
    useEffect(() => {
        if (contentRef.current === lastSavedContent.current) return;
        
        setSaveStatus('não salvo');

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = window.setTimeout(() => {
            setSaveStatus('salvando');
            onSave(notebookId, { notes: contentRef.current }).then(() => {
                setSaveStatus('salvo');
                lastSavedContent.current = contentRef.current;
            });
        }, 5000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [contentRef.current, notebookId, onSave]);

    const handleManualSave = useCallback(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (saveStatus !== 'salvo') {
            setSaveStatus('salvando');
            onSave(notebookId, { notes: contentRef.current }).then(() => {
                setSaveStatus('salvo');
                lastSavedContent.current = contentRef.current;
            });
        }
    }, [notebookId, onSave, saveStatus]);


    const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
        contentRef.current = e.currentTarget.innerHTML;
        // Trigger a re-render to update save status, but don't re-render editor content
        setSaveStatus(prev => prev === 'salvo' ? 'não salvo' : prev);
    };
    
    const handleCommand = (e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>, command: string, value?: string) => {
        e.preventDefault();
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        if (editorRef.current) {
            contentRef.current = editorRef.current.innerHTML;
            setSaveStatus(prev => prev === 'salvo' ? 'não salvo' : prev);
        }
    };
    
    const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const size = e.target.value;
        if (!size) return;
        e.preventDefault();

        // This is a common hack to apply custom styles like specific font sizes.
        // 1. Ensure spans are used.
        document.execCommand('styleWithCSS', false, 'true');
        // 2. Apply a temporary, unique style that we can find. `fontSize: 0` is unlikely to be used.
        const uniqueStyle = '0px';
        document.execCommand('fontSize', false, uniqueStyle);

        // 3. Find all elements with that unique style and replace it with the desired size.
        const elements = editorRef.current?.querySelectorAll<HTMLElement>('span[style*="font-size: 0px"]');
        if (elements) {
            elements.forEach(el => {
                el.style.fontSize = `${size}px`;
            });
        }
        
        editorRef.current?.focus();
        if (editorRef.current) {
            contentRef.current = editorRef.current.innerHTML;
            setSaveStatus(prev => prev === 'salvo' ? 'não salvo' : prev);
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

    const getSaveStatusText = () => {
        switch (saveStatus) {
            case 'salvo': return 'Salvo.';
            case 'salvando': return 'Salvando...';
            case 'não salvo': return 'Alterações pendentes.';
        }
    };
    
    const rulerMarkings = Array.from({ length: 15 }, (_, i) => i); // For decorative rulers

    return (
        <div className="flex flex-col h-full bg-brand-bg">
            <div className="flex items-center justify-between mb-4 flex-shrink-0 px-1">
                <button onClick={onBack} className="text-sm font-bold text-brand-secondary hover:underline inline-flex items-center">
                    <BackArrowIcon /> Voltar para Spots
                </button>
                <div className="flex items-center gap-4">
                     <span className="text-sm text-brand-text-muted">{getSaveStatusText()}</span>
                     <button onClick={handleManualSave} disabled={saveStatus !== 'não salvo'} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-1.5 px-3 rounded-md transition-colors text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                        <SaveIcon />
                        Salvar Agora
                    </button>
                    <button onClick={handlePrint} title="Imprimir/Exportar PDF" className="p-2 rounded hover:bg-brand-primary text-brand-text-muted hover:text-brand-text"><PrintIcon /></button>
                    <button onClick={() => setIsExportModalOpen(true)} title="Exportar para Google Docs" className="p-2 rounded hover:bg-brand-primary text-brand-text-muted hover:text-brand-text"><GoogleDocsIcon /></button>
                </div>
            </div>
            <div className="bg-brand-primary rounded-lg border border-brand-bg flex-grow flex flex-col min-h-0">
                <div className="flex flex-wrap items-center gap-2 p-2 border-b border-brand-bg text-brand-text">
                    <ToolbarButton title="Negrito (Ctrl+B)" onClick={(e) => handleCommand(e, 'bold')}><BoldIcon/></ToolbarButton>
                    <ToolbarButton title="Itálico (Ctrl+I)" onClick={(e) => handleCommand(e, 'italic')}><ItalicIcon/></ToolbarButton>
                    <ToolbarButton title="Sublinhado (Ctrl+U)" onClick={(e) => handleCommand(e, 'underline')}><UnderlineIcon/></ToolbarButton>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <select onChange={(e) => handleCommand(e, 'fontName', e.target.value)} className="bg-brand-bg rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary">
                        {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                    <select onChange={handleFontSizeChange} className="bg-brand-bg rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary">
                        <option value="">Tamanho</option>
                        {fontSizes.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <ToolbarButton title="Alinhar à Esquerda" onClick={(e) => handleCommand(e, 'justifyLeft')}><AlignLeftIcon/></ToolbarButton>
                    <ToolbarButton title="Centralizar" onClick={(e) => handleCommand(e, 'justifyCenter')}><AlignCenterIcon/></ToolbarButton>
                    <ToolbarButton title="Alinhar à Direita" onClick={(e) => handleCommand(e, 'justifyRight')}><AlignRightIcon/></ToolbarButton>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <ToolbarButton title="Aumentar Recuo" onClick={(e) => handleCommand(e, 'indent')}><IndentIcon/></ToolbarButton>
                    <ToolbarButton title="Diminuir Recuo" onClick={(e) => handleCommand(e, 'outdent')}><OutdentIcon/></ToolbarButton>
                </div>

                <div className="flex-grow p-4 md:p-8 overflow-auto bg-gray-300">
                    <div className="flex mx-auto" style={{ maxWidth: '8.5in' }}>
                        {/* Left Ruler */}
                        <div className="w-10 flex-shrink-0 pt-10 relative">
                             {rulerMarkings.map(i => (
                                <div key={i} className="h-[2.5rem] border-r border-gray-400 text-right pr-1 text-xs text-gray-500 relative">
                                    <span className="absolute -right-0 -top-1.5 pr-1">{i > 0 ? i * 2 : ''}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex-grow">
                             {/* Top Ruler */}
                            <div className="h-10 flex items-end pl-10 relative bg-white shadow-sm">
                                {rulerMarkings.map(i => (
                                    <div key={i} className="w-[2.5rem] border-t border-gray-400 text-center pt-1 text-xs text-gray-500 relative">
                                        <span className="absolute -top-0 -left-1 pt-1">{i > 0 ? i * 2 : ''}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Paper */}
                            <div 
                                ref={editorRef}
                                onInput={handleContentChange}
                                contentEditable
                                className="bg-white shadow-lg text-black p-10 md:p-16 focus:outline-none"
                                style={{ minHeight: '11in' }} // A4 dimensions
                            />
                        </div>
                    </div>
                </div>

            </div>
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} content={contentRef.current} />
        </div>
    );
};

export default NotebookNotesEditor;