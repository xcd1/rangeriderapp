import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ToolbarButtonProps {
    onClick: (e: React.MouseEvent) => void;
    children: React.ReactNode;
    title: string;
}
const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, children, title }) => (
    <button onMouseDown={onClick} title={title} className="w-8 h-8 flex items-center justify-center rounded hover:bg-brand-secondary/20 transition-colors">
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

export const NotebookNotesEditor: React.FC<NotebookNotesEditorProps> = ({ notebookId, initialContent, onSave, onBack }) => {
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
                <button onClick={onBack} className="text-sm font-bold text-brand-secondary hover:underline inline-flex items-center p-2 rounded-md hover:bg-brand-primary gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    Voltar
                </button>
                <div className="flex items-center gap-4">
                     <span className="text-sm text-brand-text-muted">{getSaveStatusText()}</span>
                     <button onClick={handleManualSave} disabled={saveStatus === 'salvo'} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path d="M7.5 2.5a2.5 2.5 0 00-4.95.148A2.5 2.5 0 004.5 7.5H7v2.502a2.5 2.5 0 002.493 2.499l.004.001h.002a2.5 2.5 0 002.499-2.5V7.5h2.5a2.5 2.5 0 002.352-4.95A2.5 2.5 0 0017.5 0H14v2.5a2.5 2.5 0 00-2.5 2.5V5h-1.5v-.001A2.5 2.5 0 007.5 2.5z" /><path d="M8 10a2 2 0 100-4 2 2 0 000 4z" /><path d="M3 12.5A2.5 2.5 0 015.5 10H8v2.5a2.5 2.5 0 01-2.5 2.5V15h1.5v.001A2.5 2.5 0 0110 17.5v2.5h-2.5a2.5 2.5 0 01-2.148-4.95A2.5 2.5 0 013 12.5z" /></svg>
                        Salvar Agora
                    </button>
                    <button onClick={handlePrint} title="Imprimir/Exportar PDF" className="p-2 rounded hover:bg-brand-primary text-brand-text-muted hover:text-brand-text flex items-center justify-center w-8 h-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v-2.5D5 8.724 5.724 8 6.5 8h7c.776 0 1.5.724 1.5 1.5V14h1a2 2 0 002-2v-3a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8.5a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 013 12.5V12h14v.5z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => setIsExportModalOpen(true)} title="Exportar para Google Docs" className="p-2 rounded hover:bg-brand-primary text-brand-text-muted hover:text-brand-text flex items-center justify-center w-8 h-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" /><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" /></svg>
                    </button>
                </div>
            </div>
            <div className="bg-brand-primary rounded-lg border border-brand-bg flex-grow flex flex-col min-h-0">
                <div className="flex flex-wrap items-center gap-2 p-2 border-b border-brand-bg text-brand-text">
                    <ToolbarButton title="Negrito (Ctrl+B)" onClick={(e) => handleCommand(e, 'bold')}><svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg></ToolbarButton>
                    <ToolbarButton title="Itálico (Ctrl+I)" onClick={(e) => handleCommand(e, 'italic')}><svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM10 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" /></svg></ToolbarButton>
                    <ToolbarButton title="Sublinhado (Ctrl+U)" onClick={(e) => handleCommand(e, 'underline')}><svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg></ToolbarButton>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <select onChange={(e) => handleCommand(e, 'fontName', e.target.value)} className="bg-brand-bg rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary">
                        {fonts.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                    <select onChange={handleFontSizeChange} className="bg-brand-bg rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-secondary">
                        <option value="">Tamanho</option>
                        {fontSizes.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <ToolbarButton title="Alinhar à Esquerda" onClick={(e) => handleCommand(e, 'justifyLeft')}><svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></ToolbarButton>
                    <ToolbarButton title="Centralizar" onClick={(e) => handleCommand(e, 'justifyCenter')}><svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></ToolbarButton>
                    <ToolbarButton title="Alinhar à Direita" onClick={(e) => handleCommand(e, 'justifyRight')}><svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 10a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg></ToolbarButton>
                    <div className="w-px h-6 bg-brand-bg mx-2"></div>
                    <ToolbarButton title="Aumentar Recuo" onClick={(e) => handleCommand(e, 'indent')}><svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM11.707 9.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L13.586 11H11a1 1 0 110-2h2.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg></ToolbarButton>
                </div>
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    onBlur={handleManualSave}
                    className="p-6 flex-grow overflow-y-auto focus:outline-none"
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                />
            </div>
            <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} content={contentRef.current} />
        </div>
    );
};

// No default export was present, causing import errors.
// Adding a named export to resolve the issue.
// export default NotebookNotesEditor;
// The above line was commented out in my thought process, but it should be a named export. Re-reading StudyView, it uses a named import `import { NotebookNotesEditor } from './NotebookNotesEditor';`. The original file was missing an export entirely.
// I will provide a named export.
