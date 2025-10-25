// FIX: Added 'useCallback' to the React import to resolve 'Cannot find name' errors.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Scenario, SpotType } from '../types';

const getScenarioTitle = (scenario: Scenario): string => {
    const { spotType, gameScenario } = scenario;
    const gsSuffix = gameScenario ? ` [${gameScenario}]` : '';

    if (spotType === 'Blind War') {
        const { blindWarPosition, blindWarAction } = scenario;
        if (!blindWarPosition || !blindWarAction) return `Blind War (Incompleto)${gsSuffix}`;
        return `Blind War: ${blindWarPosition} ${blindWarAction}${gsSuffix}`;
    }
    
    if (spotType === 'HRC Enviroment') {
        const { rangeAction, raiserPos, heroPos, coldCallerPos, aggressorPos } = scenario;
        if (!rangeAction) return `HRC Enviroment (Incompleto)${gsSuffix}`;

        let baseTitle = `${rangeAction}`;
        if (rangeAction === 'RFI' && raiserPos) {
            baseTitle = `RFI: ${raiserPos}`;
        } else if (raiserPos && heroPos) {
            baseTitle = `${rangeAction}: ${heroPos} vs ${raiserPos}`;
        }

        let title = baseTitle;
        if (coldCallerPos) title += ` (CC: ${coldCallerPos})`;
        if (aggressorPos) title += ` (Agg: ${aggressorPos})`;
        
        return `${title}${gsSuffix}`;
    }

    // Default to "Facing 2bet" / "Rfi" logic
    const { rangeAction, raiserPos, heroPos } = scenario;
    if (!rangeAction) return `Cenário Incompleto${gsSuffix}`;
    if (rangeAction === 'RFI') {
        return raiserPos ? `RFI: ${raiserPos}${gsSuffix}` : `RFI (Incompleto)${gsSuffix}`;
    }
    if (rangeAction === 'F2bet') {
        return raiserPos && heroPos ? `F2bet: ${heroPos} vs ${raiserPos}${gsSuffix}` : `F2bet (Incompleto)${gsSuffix}`;
    }
    
    return `${rangeAction} (Incompleto)${gsSuffix}`;
};

// --- RangeZoomModal Component (for main range images) ---
interface RangeZoomModalProps {
    imageSrc: string;
    onClose: () => void;
}
const RangeZoomModal: React.FC<RangeZoomModalProps> = ({ imageSrc, onClose }) => {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const imgRef = useRef<HTMLImageElement>(null);
    const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });

    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 5));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 1));
    const handleZoomReset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

    const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
        if (scale <= 1) return;
        dragInfo.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initialX: offset.x, initialY: offset.y };
        e.currentTarget.style.cursor = 'grabbing';
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLImageElement>) => {
        dragInfo.current.isDragging = false;
        e.currentTarget.style.cursor = 'grab';
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!dragInfo.current.isDragging) return;
        const dx = (e.clientX - dragInfo.current.startX) / scale;
        const dy = (e.clientY - dragInfo.current.startY) / scale;
        setOffset({ x: dragInfo.current.initialX + dx, y: dragInfo.current.initialY + dy });
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-[10000]" onClick={onClose}>
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-brand-bg p-2 rounded-lg">
                <button onClick={(e) => { e.stopPropagation(); handleZoomOut(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold">-</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomIn(); }} className="w-8 h-8 rounded-md bg-brand-primary text-lg font-bold">+</button>
                <button onClick={(e) => { e.stopPropagation(); handleZoomReset(); }} className="h-8 px-3 rounded-md bg-brand-primary text-sm">Reset</button>
                <button onClick={onClose} className="w-8 h-8 rounded-md bg-red-700 text-lg font-bold">&times;</button>
            </div>
            <div className="w-full h-full flex items-center justify-center overflow-hidden" onWheel={handleWheel}>
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Range ampliado"
                    className="max-w-none max-h-none transition-transform duration-100"
                    style={{ 
                        transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
                        cursor: scale > 1 ? 'grab' : 'default'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves image
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
};


// --- DraggableImageViewer Component ---
interface DraggableImageViewerProps {
  id: string;
  title: string;
  imageSrc: string;
  zIndex: number;
  onClose: (id: string) => void;
  onBringToFront: (id: string) => void;
}

const DraggableImageViewer: React.FC<DraggableImageViewerProps> = ({ id, title, imageSrc, zIndex, onClose, onBringToFront }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 400, height: 350 });
    const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
    const resizeInfo = useRef({ isResizing: false, startX: 0, startY: 0, initialW: 0, initialH: 0 });

    useEffect(() => {
        const newX = Math.max(50, Math.floor(Math.random() * (window.innerWidth - size.width - 50)));
        const newY = Math.max(50, Math.floor(Math.random() * (window.innerHeight - size.height - 50)));
        setPosition({ x: newX, y: newY });
    }, [id]);

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragInfo.current.isDragging) return;
        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;
        setPosition({
            x: dragInfo.current.initialX + dx,
            y: dragInfo.current.initialY + dy
        });
    };

    const handleMouseUp = () => {
        dragInfo.current.isDragging = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        onBringToFront(id);
        dragInfo.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        if (!resizeInfo.current.isResizing) return;
        const dx = e.clientX - resizeInfo.current.startX;
        const dy = e.clientY - resizeInfo.current.startY;
        setSize({
            width: Math.max(300, resizeInfo.current.initialW + dx),
            height: Math.max(250, resizeInfo.current.initialH + dy),
        });
    }, []);

    const handleResizeMouseUp = useCallback(() => {
        resizeInfo.current.isResizing = false;
        window.removeEventListener('mousemove', handleResizeMouseMove);
        window.removeEventListener('mouseup', handleResizeMouseUp);
    }, [handleResizeMouseMove]);

    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        onBringToFront(id);
        resizeInfo.current = {
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            initialW: size.width,
            initialH: size.height,
        };
        window.addEventListener('mousemove', handleResizeMouseMove);
        window.addEventListener('mouseup', handleResizeMouseUp);
    };

    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleResizeMouseMove);
            window.removeEventListener('mouseup', handleResizeMouseUp);
        };
    }, [handleResizeMouseMove, handleResizeMouseUp]);

    return (
        <div 
            className="fixed bg-brand-primary rounded-lg shadow-2xl border-2 border-brand-secondary/50 flex flex-col"
            style={{ 
                left: position.x, 
                top: position.y, 
                zIndex: zIndex,
                width: `${size.width}px`,
                height: `${size.height}px`,
             }}
            onMouseDown={() => onBringToFront(id)}
        >
            <div 
                className="bg-brand-bg text-brand-text p-2 rounded-t-lg flex justify-between items-center cursor-move"
                onMouseDown={handleMouseDown}
            >
                <span className="text-sm font-bold truncate pr-2">{title}</span>
                <button 
                    onClick={() => onClose(id)}
                    className="text-white bg-red-600 hover:bg-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0"
                >
                    &times;
                </button>
            </div>
            <div className="p-2 flex-grow flex items-center justify-center relative overflow-hidden">
                <img src={imageSrc} alt={title} className="max-w-full max-h-full object-contain"/>
            </div>
             <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
                onMouseDown={handleResizeMouseDown}
                title="Redimensionar"
                style={{
                  borderBottom: '4px solid #f5c339',
                  borderRight: '4px solid #f5c339',
                }}
             />
        </div>
    );
};


// --- ComparisonView Component ---
interface OpenModal {
  id: string;
  title: string;
  imageSrc: string;
  zIndex: number;
}

interface ComparisonViewProps {
    scenarios: Scenario[];
    onBack: () => void;
    spotType: SpotType | null;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ scenarios, onBack, spotType }) => {
    const [openModals, setOpenModals] = useState<OpenModal[]>([]);
    const [zIndexCounter, setZIndexCounter] = useState(100);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    const handleOpenImage = (scenario: Scenario, type: 'tableDraw' | 'rp') => {
        const modalId = `${scenario.id}-${type}`;
        const existingModal = openModals.find(m => m.id === modalId);
        
        const newZIndex = zIndexCounter + 1;
        setZIndexCounter(newZIndex);

        if (existingModal) {
            handleBringToFront(modalId);
        } else {
            const imageSrc = type === 'tableDraw' ? scenario.printSpotImage : scenario.rpImage;
            if (!imageSrc) return;
            const title = `${getScenarioTitle(scenario)} - ${type === 'tableDraw' ? 'Table Draw' : 'RP'}`;

            setOpenModals(current => [...current, { id: modalId, title, imageSrc, zIndex: newZIndex }]);
        }
    };
    
    const handleCloseImage = (id: string) => {
        setOpenModals(current => current.filter(m => m.id !== id));
    };

    const handleBringToFront = (id: string) => {
        const newZIndex = zIndexCounter + 1;
        setZIndexCounter(newZIndex);
        setOpenModals(current => 
            current.map(m => m.id === id ? { ...m, zIndex: newZIndex } : m)
        );
    };

    const handleCloseAll = () => setOpenModals([]);

    const showFrequencies = spotType === 'Rfi' || spotType === 'Blind War';


    return (
        <div>
            {openModals.length > 1 && (
                <button 
                    onClick={handleCloseAll}
                    className="fixed top-6 right-6 z-[9999] bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform hover:scale-105"
                >
                    Fechar Tudo
                </button>
            )}
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-brand-text">Comparação de Ranges</h2>
                <button onClick={onBack} className="bg-brand-primary hover:bg-brand-primary/80 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors">
                    &larr; Voltar
                </button>
            </div>
            {scenarios.length < 2 ? (
                 <div className="text-center py-12 text-brand-text-muted">
                    <p>Selecione 2 ou mais cenários para comparar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {scenarios.map(scenario => {
                        const title = getScenarioTitle(scenario);
                        return (
                            <div key={scenario.id} className="bg-brand-primary rounded-lg p-4 border border-brand-bg flex flex-col gap-4">
                                <h3 className="font-bold text-center text-brand-text truncate" title={title}>
                                    {title}
                                </h3>
                                
                                <div 
                                    className="bg-brand-bg aspect-[7/6] rounded flex items-center justify-center group relative"
                                    onClick={() => scenario.rangeImage && setZoomedImage(scenario.rangeImage)}
                                    style={{ cursor: scenario.rangeImage ? 'zoom-in' : 'default' }}
                                >
                                    {scenario.rangeImage ? (
                                        <>
                                            <img src={scenario.rangeImage} alt="Range" className="max-w-full max-h-full object-contain"/>
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 text-sm">Sem Imagem de Range</span>
                                    )}
                                </div>
                                
                                {showFrequencies && scenario.frequenciesImage && (
                                    <>
                                        <h4 className="text-sm font-semibold text-center text-brand-text-muted -mb-2">Frequências</h4>
                                        <div 
                                            className="bg-brand-bg aspect-[6/1] rounded flex items-center justify-center group relative"
                                            onClick={() => setZoomedImage(scenario.frequenciesImage)}
                                            style={{ cursor: 'zoom-in' }}
                                        >
                                            <img src={scenario.frequenciesImage} alt="Frequências" className="max-w-full max-h-full object-contain"/>
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {scenario.spotType === 'HRC Enviroment' && (scenario.printSpotImage || scenario.rpImage) && (
                                    <div className="flex justify-center gap-2 mt-auto pt-2">
                                        {scenario.printSpotImage && (
                                            <button 
                                                onClick={() => handleOpenImage(scenario, 'tableDraw')}
                                                className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1.5 px-3 rounded-md transition-colors text-sm"
                                            >
                                                Table Draw
                                            </button>
                                        )}
                                        {scenario.rpImage && (
                                            <button 
                                                onClick={() => handleOpenImage(scenario, 'rp')}
                                                className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1.5 px-3 rounded-md transition-colors text-sm"
                                            >
                                                RP
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
            
            {openModals.map(modal => (
                <DraggableImageViewer
                    key={modal.id}
                    id={modal.id}
                    title={modal.title}
                    imageSrc={modal.imageSrc}
                    zIndex={modal.zIndex}
                    onClose={handleCloseImage}
                    onBringToFront={handleBringToFront}
                />
            ))}
            {zoomedImage && (
                <RangeZoomModal imageSrc={zoomedImage} onClose={() => setZoomedImage(null)} />
            )}
        </div>
    );
};

export default ComparisonView;