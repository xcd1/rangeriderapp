import React, { useState, useRef, useEffect, useCallback, useMemo, useContext } from 'react';
import type { Scenario, Notebook } from '../types';
import { useComparison, CardState, ComparisonLayoutState } from '../contexts/ComparisonContext';
import { AppContext } from '../App';
import { NotebookNotesEditor } from './NotebookNotesEditor';

const getScenarioTitle = (scenario: Scenario): string => {
    if (scenario.manualTitle) {
        return scenario.manualTitle;
    }

    const { spotType, gameScenario } = scenario;
    const gsSuffix = gameScenario ? ` [${gameScenario}]` : '';

    if (spotType === 'Stats Analysis') {
        return `Análise de Stats${gsSuffix}`;
    }

    if (spotType === 'Blind War') {
        const { blindWarPosition, blindWarAction } = scenario;
        if (!blindWarPosition || !blindWarAction) return `Blind War (Incompleto)${gsSuffix}`;
        return `Blind War: ${blindWarPosition} ${blindWarAction}${gsSuffix}`;
    }
    
    if (spotType === 'HRC Enviroment') {
        const { rangeAction, raiserPos, heroPos, coldCallerPos, aggressorPos } = scenario;
        if (!rangeAction) return `GTO Mastered (Incompleto)${gsSuffix}`;

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

// --- DraggableZoomModal Component (replaces old RangeZoomModal) ---
const DraggableZoomModal: React.FC<{ imageSrc: string; onClose: () => void }> = ({ imageSrc, onClose }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isSized, setIsSized] = useState(false);

    const stateRef = useRef({
        isWindowDragging: false,
        isImagePanning: false,
        isResizing: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        initialW: 0,
        initialH: 0,
    });
    
    const nodeRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        setIsSized(false);
        setScale(1);
        setOffset({ x: 0, y: 0 });
    }, [imageSrc]);

    const clampOffset = useCallback((newOffset: {x: number, y: number}, currentScale: number) => {
        if (!imgRef.current || !containerRef.current) return newOffset;
        
        const scaledWidth = imgRef.current.naturalWidth * currentScale;
        const scaledHeight = imgRef.current.naturalHeight * currentScale;
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        const maxOffsetX = Math.max(0, (scaledWidth - containerWidth) / 2);
        const maxOffsetY = Math.max(0, (scaledHeight - containerHeight) / 2);

        return {
            x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffset.x)),
            y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffset.y)),
        };
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (stateRef.current.isWindowDragging) {
            const dx = e.clientX - stateRef.current.startX;
            const dy = e.clientY - stateRef.current.startY;
            setPosition({ x: stateRef.current.initialX + dx, y: stateRef.current.initialY + dy });
        } else if (stateRef.current.isImagePanning) {
            const dx = e.clientX - stateRef.current.startX;
            const dy = e.clientY - stateRef.current.startY;
            const newOffset = { x: stateRef.current.initialX + dx, y: stateRef.current.initialY + dy };
            setOffset(clampOffset(newOffset, scale));
        } else if (stateRef.current.isResizing) {
            const dx = e.clientX - stateRef.current.startX;
            const dy = e.clientY - stateRef.current.startY;
            setSize({
                width: Math.max(300, stateRef.current.initialW + dx),
                height: Math.max(250, stateRef.current.initialH + dy),
            });
        }
    }, [scale, clampOffset]);

    const handleMouseUp = useCallback(() => {
        if (nodeRef.current && stateRef.current.isImagePanning) {
            const img = nodeRef.current.querySelector('img');
            if(img) img.style.cursor = 'grab';
        }
        stateRef.current.isWindowDragging = false;
        stateRef.current.isImagePanning = false;
        stateRef.current.isResizing = false;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleWindowDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        stateRef.current = {
            ...stateRef.current,
            isWindowDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleImagePanStart = (e: React.MouseEvent<HTMLImageElement>) => {
        if (scale <= 1) return;
        e.preventDefault();
        stateRef.current = {
            ...stateRef.current,
            isImagePanning: true,
            startX: e.clientX,
            startY: e.clientY,
            initialX: offset.x,
            initialY: offset.y,
        };
        e.currentTarget.style.cursor = 'grabbing';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        stateRef.current = {
            ...stateRef.current,
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            initialW: size.width,
            initialH: size.height,
        };
        document.body.style.cursor = 'se-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newScale = e.deltaY < 0 ? scale * 1.1 : scale / 1.1;
        const clampedScale = Math.max(1, Math.min(newScale, 10));
        setScale(clampedScale);
        setOffset(prev => clampOffset(prev, clampedScale));
    };

    const handleZoomIn = (e: React.MouseEvent) => { e.stopPropagation(); const newScale = Math.min(scale * 1.2, 10); setScale(newScale); setOffset(prev => clampOffset(prev, newScale)); };
    const handleZoomOut = (e: React.MouseEvent) => { e.stopPropagation(); const newScale = Math.max(scale / 1.2, 1); setScale(newScale); setOffset(prev => clampOffset(prev, newScale));};
    const handleZoomReset = (e: React.MouseEvent) => { e.stopPropagation(); setScale(1); setOffset({ x: 0, y: 0 }); };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (isSized || !e.currentTarget) return;
        const img = e.currentTarget;
        const { naturalWidth, naturalHeight } = img;
        
        const padding = 80;
        const maxWidth = window.innerWidth - padding;
        const maxHeight = window.innerHeight - padding;
        const imageRatio = naturalWidth / naturalHeight;
        const containerRatio = maxWidth / maxHeight;

        let initialWidth, initialHeight;

        if (imageRatio > containerRatio) {
            initialWidth = maxWidth;
            initialHeight = maxWidth / imageRatio;
        } else {
            initialHeight = maxHeight;
            initialWidth = maxHeight * imageRatio;
        }

        const titleBarHeight = 40;
        const finalWidth = Math.max(initialWidth, 300);
        const finalHeight = Math.max(initialHeight, 250) + titleBarHeight;

        setSize({ width: finalWidth, height: finalHeight });
        setPosition({
            x: (window.innerWidth - finalWidth) / 2,
            y: (window.innerHeight - finalHeight) / 2,
        });
        setIsSized(true);
    };

    return (
        <div
            ref={nodeRef}
            className="fixed bg-brand-primary rounded-lg shadow-2xl border-2 border-brand-secondary/50 flex flex-col transition-opacity duration-200"
            style={{ 
                left: position.x, 
                top: position.y, 
                width: size.width, 
                height: size.height, 
                zIndex: 10000,
                opacity: isSized ? 1 : 0,
            }}
            onWheel={handleWheel}
        >
            <div
                className="bg-brand-bg text-brand-text p-2 rounded-t-lg flex justify-between items-center cursor-move"
                onMouseDown={handleWindowDragStart}
            >
                <div className="flex items-center gap-2">
                    <button onClick={handleZoomOut} className="w-6 h-6 rounded-md bg-brand-primary text-lg font-bold flex items-center justify-center">-</button>
                    <button onClick={handleZoomIn} className="w-6 h-6 rounded-md bg-brand-primary text-lg font-bold flex items-center justify-center">+</button>
                    <button onClick={handleZoomReset} className="h-6 px-2 rounded-md bg-brand-primary text-xs">Reset</button>
                </div>
                <button onClick={onClose} className="text-white bg-red-600 hover:bg-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>
            <div ref={containerRef} className="p-2 flex-grow flex items-center justify-center relative overflow-hidden bg-brand-bg/20">
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Range ampliado"
                    onLoad={handleImageLoad}
                    className="max-w-none max-h-none transition-transform duration-100"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        cursor: scale > 1 ? 'grab' : 'default',
                    }}
                    onMouseDown={handleImagePanStart}
                />
            </div>
            <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
                onMouseDown={handleResizeStart}
                title="Redimensionar"
                style={{
                  borderBottom: '4px solid #f5c339',
                  borderRight: '4px solid #f5c339',
                  borderBottomRightRadius: '4px',
                }}
             />
        </div>
    );
};


// --- DraggableImageViewer Component (For HRC Modals) ---
interface DraggableImageViewerProps {
  id: string;
  title: string;
  imageSrc: string;
  zIndex: number;
  initialPosition: { x: number; y: number };
  onClose: (id: string) => void;
  onBringToFront: (id: string) => void;
}

const DraggableImageViewer: React.FC<DraggableImageViewerProps> = ({ id, title, imageSrc, zIndex, initialPosition, onClose, onBringToFront }) => {
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState({ width: 560, height: 490 });
    const stateRef = useRef({
        isDragging: false,
        isResizing: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        initialW: 0,
        initialH: 0,
    });

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (stateRef.current.isDragging) {
            const dx = event.clientX - stateRef.current.startX;
            const dy = event.clientY - stateRef.current.startY;
            setPosition({ x: stateRef.current.initialX + dx, y: stateRef.current.initialY + dy });
        }
        if (stateRef.current.isResizing) {
            const dx = event.clientX - stateRef.current.startX;
            const dy = event.clientY - stateRef.current.startY;
            setSize({
                width: Math.max(300, stateRef.current.initialW + dx),
                height: Math.max(250, stateRef.current.initialH + dy),
            });
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        stateRef.current.isDragging = false;
        stateRef.current.isResizing = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault(); // Prevent text selection
        onBringToFront(id);
        stateRef.current = {
            ...stateRef.current,
            isDragging: true,
            isResizing: false,
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'move';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        onBringToFront(id);
        stateRef.current = {
            ...stateRef.current,
            isDragging: false,
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            initialW: size.width,
            initialH: size.height,
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'se-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        // Safety cleanup on unmount
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

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
                onMouseDown={handleDragMouseDown}
            >
                <span className="text-sm font-bold truncate pr-2">{title}</span>
                <button 
                    onClick={() => onClose(id)}
                    className="text-white bg-red-600 hover:bg-red-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>
            <div className="p-2 flex-grow flex items-center justify-center relative overflow-hidden bg-brand-bg/20">
                <img src={imageSrc} alt={title} className="max-w-full max-h-full object-contain"/>
            </div>
             <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
                onMouseDown={handleResizeMouseDown}
                title="Redimensionar"
                style={{
                  borderBottom: '4px solid #f5c339',
                  borderRight: '4px solid #f5c339',
                  borderBottomRightRadius: '4px',
                }}
             />
        </div>
    );
};


// --- FreeDraggableCard Component (For Stats Analysis Canvas) ---
const FreeDraggableCard: React.FC<{
  cardState: CardState;
  scenario: Scenario;
  onUpdate: (id: string, updates: Partial<Pick<CardState, 'position' | 'size'>>) => void;
  onBringToFront: (id: string) => void;
  onZoom: (src: string) => void;
}> = ({ cardState, scenario, onUpdate, onBringToFront, onZoom }) => {
    const stateRef = useRef({
        isDragging: false,
        isResizing: false,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0,
        initialW: 0,
        initialH: 0,
    });

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (stateRef.current.isDragging) {
            const dx = event.clientX - stateRef.current.startX;
            const dy = event.clientY - stateRef.current.startY;
            onUpdate(cardState.id, { position: { x: stateRef.current.initialX + dx, y: stateRef.current.initialY + dy } });
        }
        if (stateRef.current.isResizing) {
            const dx = event.clientX - stateRef.current.startX;
            const dy = event.clientY - stateRef.current.startY;
            onUpdate(cardState.id, { size: { width: Math.max(300, stateRef.current.initialW + dx), height: Math.max(250, stateRef.current.initialH + dy) } });
        }
    }, [onUpdate, cardState.id]);

    const handleMouseUp = useCallback(() => {
        stateRef.current.isDragging = false;
        stateRef.current.isResizing = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleDragMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        onBringToFront(cardState.id);
        stateRef.current = {
            ...stateRef.current,
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            initialX: cardState.position.x,
            initialY: cardState.position.y,
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'move';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        onBringToFront(cardState.id);
        stateRef.current = {
            ...stateRef.current,
            isResizing: true,
            startX: e.clientX,
            startY: e.clientY,
            initialW: cardState.size.width,
            initialH: cardState.size.height,
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'se-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
      <div
        className="absolute bg-brand-primary rounded-lg shadow-2xl border-2 border-brand-secondary/50 flex flex-col"
        style={{
            left: cardState.position.x,
            top: cardState.position.y,
            width: cardState.size.width,
            height: cardState.size.height,
            zIndex: cardState.zIndex,
        }}
        onMouseDown={() => onBringToFront(cardState.id)}
      >
        <div 
          className="bg-brand-bg text-brand-text p-2 rounded-t-lg flex justify-between items-center cursor-move"
          onMouseDown={handleDragMouseDown}
        >
            <h3 className="font-bold text-sm text-center text-brand-text truncate pr-2" title={getScenarioTitle(scenario)}>
                {getScenarioTitle(scenario)}
            </h3>
        </div>
        <div className="p-2 flex-grow flex items-center justify-center relative overflow-hidden bg-brand-bg/20">
            {scenario.rangeImage ? (
                <>
                    <img src={scenario.rangeImage} alt="Stats Analysis" className="max-w-full max-h-full object-contain"/>
                    <div
                        className="absolute inset-0 cursor-zoom-in"
                        onClick={() => onZoom(scenario.rangeImage!)}
                        title="Ampliar imagem"
                    />
                </>
            ) : (
                <span className="text-gray-500 text-sm">Sem Imagem</span>
            )}
        </div>
        <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
            onMouseDown={handleResizeMouseDown}
            title="Redimensionar"
            style={{
              borderBottom: '4px solid #f5c339',
              borderRight: '4px solid #f5c339',
              borderBottomRightRadius: '4px',
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
  position: { x: number; y: number };
}

interface ComparisonViewProps {
    scenarios: Scenario[];
    onBack: () => void;
    comparisonKey: string;
}

const getNumCols = (gridElement: HTMLElement | null): number => {
    if (gridElement) {
        const gridComputedStyle = window.getComputedStyle(gridElement);
        const gridTemplateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
        return gridTemplateColumns.split(' ').length;
    }
    const width = window.innerWidth;
    if (width >= 1536) return 5;
    if (width >= 1280) return 4;
    if (width >= 768) return 3;
    return 2;
};

const layouts = [
    { type: 'single', label: '2x2', rows: 2, cols: 2 },
    { type: 'single', label: '3x3', rows: 3, cols: 3 },
    { type: 'dual', labels: ['2', '3'], layouts: [{ rows: 2, cols: 3 }, { rows: 3, cols: 2 }] },
    { type: 'dual', labels: ['2', '4'], layouts: [{ rows: 2, cols: 4 }, { rows: 4, cols: 2 }] },
    { type: 'dual', labels: ['2', '5'], layouts: [{ rows: 2, cols: 5 }, { rows: 5, cols: 2 }] },
    { type: 'dual', labels: ['3', '4'], layouts: [{ rows: 3, cols: 4 }, { rows: 4, cols: 3 }] },
    { type: 'dual', labels: ['3', '5'], layouts: [{ rows: 3, cols: 5 }, { rows: 5, cols: 3 }] },
];

const isLayoutEnabled = (rows: number, cols: number, count: number): boolean => {
    const totalSlots = rows * cols;
    if (totalSlots === 0) return false;
    const min = totalSlots <= 6 ? totalSlots - 1 : totalSlots - 2;
    const max = totalSlots;
    return count >= min && count <= max;
};

const gridColClassMap: { [key: number]: string } = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
};

const SimpleScenarioCard: React.FC<{ 
    scenario: Scenario; 
    onZoom: (src: string) => void;
    onOpenImage: (scenario: Scenario, type: 'printSpotImage' | 'rpImage' | 'tableViewImage' | 'plusInfoImage' | 'evImage') => void;
}> = ({ scenario, onZoom, onOpenImage }) => {
    const isStats = scenario.spotType === 'Stats Analysis';
    return (
        <div className="w-full h-full bg-brand-primary rounded-lg p-3 border border-brand-bg flex flex-col">
            <h3 className="font-bold text-center text-brand-text truncate mb-2 flex-shrink-0" title={getScenarioTitle(scenario)}>
                {getScenarioTitle(scenario)}
            </h3>
            <div className={`bg-brand-bg ${isStats ? 'aspect-video' : 'aspect-square'} rounded flex items-center justify-center relative flex-shrink-0`}>
                {scenario.rangeImage ? (
                    <>
                        <img src={scenario.rangeImage} alt="Range" className="max-w-full max-h-full object-contain"/>
                        <div
                            className="absolute inset-0 cursor-zoom-in"
                            onClick={() => scenario.rangeImage && onZoom(scenario.rangeImage)}
                            title="Ampliar imagem"
                        />
                    </>
                ) : (
                    <span className="text-gray-500 text-sm">Sem Imagem</span>
                )}
            </div>
            {!isStats && scenario.frequenciesImage && scenario.showFrequenciesInCompare && (
                <div className="bg-brand-bg aspect-[6/1] rounded flex items-center justify-center relative mt-2 flex-shrink-0">
                    <img src={scenario.frequenciesImage} alt="Frequências" className="max-w-full max-h-full object-contain"/>
                    <div
                        className="absolute inset-0 cursor-zoom-in"
                        onClick={() => onZoom(scenario.frequenciesImage!)}
                        title="Ampliar imagem"
                    />
                </div>
            )}
             {!isStats && scenario.evImage && scenario.showEvInCompare && (
                 <div className="bg-brand-bg aspect-square rounded flex items-center justify-center relative mt-2 flex-shrink-0">
                    <img src={scenario.evImage} alt="EV" className="max-w-full max-h-full object-contain"/>
                    <div
                        className="absolute inset-0 cursor-zoom-in"
                        onClick={() => onZoom(scenario.evImage!)}
                        title="Ampliar imagem"
                    />
                </div>
            )}
            <div className="mt-auto pt-2 flex-shrink-0">
                {!isStats && (scenario.printSpotImage || scenario.rpImage || scenario.tableViewImage || scenario.plusInfoImage || scenario.evImage) && (
                    <div className="flex justify-center flex-wrap gap-1.5">
                    {scenario.printSpotImage && <button onClick={() => onOpenImage(scenario, 'printSpotImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">HRC Table View</button>}
                    {scenario.rpImage && <button onClick={() => onOpenImage(scenario, 'rpImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">RP</button>}
                    {scenario.evImage && <button onClick={() => onOpenImage(scenario, 'evImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">EV</button>}
                    {scenario.tableViewImage && <button onClick={() => onOpenImage(scenario, 'tableViewImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">Table View</button>}
                    {scenario.plusInfoImage && <button onClick={() => onOpenImage(scenario, 'plusInfoImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">+Info</button>}
                    </div>
                )}
            </div>
        </div>
    );
};


const ComparisonView: React.FC<ComparisonViewProps> = ({ scenarios, onBack, comparisonKey }) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const appContext = useContext(AppContext);
    const { scenariosToCompare, getLayoutState, setLayoutState } = useComparison();
    
    const layoutState = getLayoutState(comparisonKey);
    const { isSimpleMode, orderedScenarios: orderedScenarioIds, gridCols, zoomLevel, cardStates } = layoutState;

    const setLayoutStateForKey = useCallback((updater: React.SetStateAction<ComparisonLayoutState>) => {
        setLayoutState(comparisonKey, updater);
    }, [comparisonKey, setLayoutState]);

    // --- Local state (not persisted globally) ---
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [openModals, setOpenModals] = useState<OpenModal[]>([]);
    const [originalOrder, setOriginalOrder] = useState<Scenario[]>([]);
    const [history, setHistory] = useState<(string | null)[][]>([]);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ index: number; position: 'top' | 'bottom' | 'left' | 'right' } | null>(null);
    const [isOverEmpty, setIsOverEmpty] = useState<number | null>(null);
    const [zIndexCounter, setZIndexCounter] = useState(100);
    const [statsZIndexCounter, setStatsZIndexCounter] = useState(100);
    const lastModalPosition = useRef({ x: 50, y: 50 });

    // --- iNotes State & Logic ---
    const [isNotesSplitViewOpen, setIsNotesSplitViewOpen] = useState(() => {
        if (comparisonKey === 'global') return false;
        const saved = localStorage.getItem(`notesSplitViewOpen-comparison-${comparisonKey}`);
        return saved === 'true';
    });
    const [notesPanelWidth, setNotesPanelWidth] = useState(() => {
        const savedWidth = localStorage.getItem('notesPanelWidthComparison');
        const width = savedWidth ? parseInt(savedWidth, 10) : 450;
        return Math.max(300, Math.min(width, 800));
    });
    const isResizingNotesPanel = useRef(false);

    const activeNotebook = useMemo(() => {
        if (comparisonKey === 'global' || !appContext) return null;
        return appContext.notebooks.find(n => n.id === comparisonKey);
    }, [appContext, comparisonKey]);

    const handleSaveNotes = useCallback(async (notebookId: string, updates: { notes: string }) => {
        if (!appContext) return;
        await appContext.updateNotebook(notebookId, updates);
    }, [appContext]);

    const handleNotesPanelMouseMove = useCallback((e: MouseEvent) => {
        if (isResizingNotesPanel.current) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 300 && newWidth <= 800) {
                setNotesPanelWidth(newWidth);
            }
        }
    }, []);

    const handleNotesPanelMouseUp = useCallback(() => {
        isResizingNotesPanel.current = false;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleNotesPanelMouseMove);
        window.removeEventListener('mouseup', handleNotesPanelMouseUp);
    }, [handleNotesPanelMouseMove]);
    
    const handleNotesPanelMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizingNotesPanel.current = true;
        document.body.style.cursor = 'col-resize';
        window.addEventListener('mousemove', handleNotesPanelMouseMove);
        window.addEventListener('mouseup', handleNotesPanelMouseUp);
    }, [handleNotesPanelMouseMove, handleNotesPanelMouseUp]);

    useEffect(() => {
        localStorage.setItem('notesPanelWidthComparison', notesPanelWidth.toString());
    }, [notesPanelWidth]);

    useEffect(() => {
        if(comparisonKey !== 'global') {
            localStorage.setItem(`notesSplitViewOpen-comparison-${comparisonKey}`, String(isNotesSplitViewOpen));
        }
    }, [isNotesSplitViewOpen, comparisonKey]);

    // --- End iNotes Logic ---

    // --- Memoize scenario map for efficient lookups ---
    const scenarioMap = useMemo(() => new Map(scenarios.map(s => [s.id, s])), [scenarios]);

    // --- Derive scenario objects from persisted IDs ---
    const orderedScenarios = useMemo(() => {
        return orderedScenarioIds.map(id => (id ? scenarioMap.get(id) || null : null));
    }, [orderedScenarioIds, scenarioMap]);

    // --- Wrapped setters to update global context state ---
    const handleSetIsSimpleMode = useCallback((value: boolean | ((prevState: boolean) => boolean)) => {
        setLayoutStateForKey(prev => ({ ...prev, isSimpleMode: typeof value === 'function' ? value(prev.isSimpleMode) : value }));
    }, [setLayoutStateForKey]);

    const handleSetZoomLevel = useCallback((value: number | ((prevState: number) => number)) => {
        setLayoutStateForKey(prev => ({ ...prev, zoomLevel: typeof value === 'function' ? value(prev.zoomLevel) : value }));
    }, [setLayoutStateForKey]);

    const handleSetGridCols = useCallback((value: number | null) => {
        setLayoutStateForKey(prev => ({...prev, gridCols: value}));
    }, [setLayoutStateForKey]);

    const handleSetCardStates = useCallback((updater: React.SetStateAction<CardState[]>) => {
        setLayoutStateForKey(prev => ({ ...prev, cardStates: typeof updater === 'function' ? updater(prev.cardStates) : updater }));
    }, [setLayoutStateForKey]);

    const handleSetOrderedScenarios = useCallback((newOrder: (Scenario | null)[]) => {
        setHistory(prev => [...prev.slice(-19), orderedScenarioIds]);
        setLayoutStateForKey(prev => ({ ...prev, orderedScenarios: newOrder.map(s => (s ? s.id : null)) }));
    }, [orderedScenarioIds, setLayoutStateForKey]);


    const areAllStatsAnalysis = useMemo(() =>
        scenarios.length > 0 && scenarios.every(s => s.spotType === 'Stats Analysis')
    , [scenarios]);
    
    const isStatsCanvasMode = areAllStatsAnalysis && !isSimpleMode;

    // --- Initialize or restore state when scenarios change ---
    useEffect(() => {
        const currentSignature = [...scenarios.map(s => s.id)].sort().join(',');

        if (layoutState.scenarioIdsSignature !== currentSignature) {
            const areAllStats = scenarios.length > 0 && scenarios.every(s => s.spotType === 'Stats Analysis');
            const initialIsSimpleMode = !areAllStats;
            const isStatsMode = areAllStats && !initialIsSimpleMode;

            const newCardStates = isStatsMode ? scenarios.map((s, i) => ({
                id: s.id,
                position: { x: 60 + i * 40, y: 150 + i * 40 },
                size: { width: 500, height: 400 },
                zIndex: 100 + i,
            })) : [];
            
            const newOrderedScenarios = isStatsMode ? [] : scenarios.map(s => s.id);

            setLayoutStateForKey({
                isSimpleMode: initialIsSimpleMode,
                orderedScenarios: newOrderedScenarios,
                gridCols: null,
                zoomLevel: 1,
                cardStates: newCardStates,
                scenarioIdsSignature: currentSignature,
            });
            
            setOriginalOrder(scenarios);
            setHistory([]);
        } else {
            setOriginalOrder(scenarios);
        }
    }, [scenarios, layoutState.scenarioIdsSignature, setLayoutStateForKey]);


    // --- Handlers for Canvas Mode ---
    const handleUpdateCardState = useCallback((id: string, updates: Partial<Pick<CardState, 'position' | 'size'>>) => {
        handleSetCardStates(prev => prev.map(card => card.id === id ? { ...card, ...updates } : card));
    }, [handleSetCardStates]);

    const handleBringCardToFront = useCallback((id: string) => {
        setStatsZIndexCounter(prev => {
            const newZIndex = prev + 1;
            handleSetCardStates(current => current.map(m => m.id === id ? { ...m, zIndex: newZIndex } : m));
            return newZIndex;
        });
    }, [handleSetCardStates]);
    
    // --- Handlers for Grid Mode ---
    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        const lastStateIds = history[history.length - 1];
        setLayoutStateForKey(prev => ({ ...prev, orderedScenarios: lastStateIds }));
        setHistory(prev => prev.slice(0, prev.length - 1));
    }, [history, setLayoutStateForKey]);
    
    const handleResetLayout = () => {
        const originalOrderIds = originalOrder.map(s => s.id);
        if (JSON.stringify(orderedScenarioIds) !== JSON.stringify(originalOrderIds)) {
            handleSetOrderedScenarios(originalOrder);
        }
        if (zoomLevel !== 1) handleSetZoomLevel(1);
        handleSetGridCols(null);
    };

    const handleAdjustLayout = () => {
        const compacted = orderedScenarios.filter(s => s !== null);
        if (compacted.length !== orderedScenarios.length) {
            handleSetOrderedScenarios(compacted);
        }
    };
    
    const handleExpressLayout = useCallback((rows: number, cols: number) => {
        const activeScenarios = orderedScenarios.filter((s): s is Scenario => !!s);
        const newLayout: (Scenario | null)[] = Array(rows * cols).fill(null);
        activeScenarios.forEach((scenario, index) => {
            if (index < newLayout.length) newLayout[index] = scenario;
        });
        handleSetOrderedScenarios(newLayout);
        handleSetGridCols(cols);
    }, [orderedScenarios, handleSetOrderedScenarios, handleSetGridCols]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDropTarget(null);
        setIsOverEmpty(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedId) { handleDragEnd(); return; }
    
        const currentLayout = [...displayItems];
        const sourceIndex = currentLayout.findIndex(s => s?.id === draggedId);
        if (sourceIndex === -1) { handleDragEnd(); return; }
    
        const draggedItem = currentLayout[sourceIndex];
        if (!draggedItem) { handleDragEnd(); return; }
    
        let newLayout: (Scenario | null)[] = [];
    
        if (isOverEmpty === dropIndex) {
            newLayout = [...currentLayout];
            newLayout[dropIndex] = draggedItem;
            newLayout[sourceIndex] = null;
        } else if (dropTarget?.index === dropIndex) {
            const targetItem = currentLayout[dropIndex];
            if(!targetItem) { handleDragEnd(); return; }
            const compactedItems = orderedScenarios.filter(s => s && s.id !== draggedId);
            let insertionIndex = compactedItems.findIndex(s => s?.id === targetItem.id);
            if(insertionIndex === -1) insertionIndex = compactedItems.length;
            const numCols = getNumCols(gridRef.current);
            switch (dropTarget.position) {
                case 'right': insertionIndex += 1; break;
                case 'bottom': {
                    let targetCompactIndex = -1, currentCompactIndex = 0;
                    for(let i=0; i<orderedScenarios.length; i++) {
                        if (orderedScenarios[i]) {
                           if (orderedScenarios[i]?.id === targetItem.id) { targetCompactIndex = currentCompactIndex; break; }
                           currentCompactIndex++;
                        }
                    }
                    if (targetCompactIndex === -1) break;
                    const targetRow = Math.floor(targetCompactIndex / numCols);
                    insertionIndex = (targetRow + 1) * numCols;
                    break;
                }
                case 'top': {
                    let targetCompactIndex = -1, currentCompactIndex = 0;
                    for(let i=0; i<orderedScenarios.length; i++) {
                        if (orderedScenarios[i]) {
                           if (orderedScenarios[i]?.id === targetItem.id) { targetCompactIndex = currentCompactIndex; break; }
                           currentCompactIndex++;
                        }
                    }
                    if (targetCompactIndex === -1) break;
                    const targetRow = Math.floor(targetCompactIndex / numCols);
                    insertionIndex = targetRow * numCols;
                    break;
                }
            }
            compactedItems.splice(insertionIndex, 0, draggedItem);
            newLayout = compactedItems;
        } else { handleDragEnd(); return; }
    
        let lastItemIndex = -1;
        for (let i = newLayout.length - 1; i >= 0; i--) {
            if (newLayout[i] !== null) { lastItemIndex = i; break; }
        }
        
        const finalState = lastItemIndex === -1 ? [] : newLayout.slice(0, lastItemIndex + 1);
        handleSetOrderedScenarios(finalState);
        handleSetGridCols(null);
        handleDragEnd();
    };

    const displayItems = useMemo(() => {
        const items = [...orderedScenarios];
        const numCols = gridCols ?? getNumCols(gridRef.current);
        if (numCols === 0) return items;
        let effectiveLength = 0;
        for (let i = items.length - 1; i >= 0; i--) {
            if (items[i]) { effectiveLength = i + 1; break; }
        }
        const contentRows = effectiveLength > 0 ? Math.ceil(effectiveLength / numCols) : 0;
        const extraRows = 3;
        const totalRows = contentRows + extraRows;
        const desiredLength = totalRows * numCols;
        while (items.length < desiredLength) items.push(null);
        return items;
    }, [orderedScenarios, gridCols]);

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); e.stopPropagation();
        const scenarioAtTarget = displayItems[index];
        if (scenarioAtTarget && scenarioAtTarget.id !== draggedId) {
            setIsOverEmpty(null);
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const relX = e.clientX - rect.left, relY = e.clientY - rect.top;
            const pV = Math.abs(relY - rect.height / 2) / (rect.height / 2);
            const pH = Math.abs(relX - rect.width / 2) / (rect.width / 2);
            let pos: 'top' | 'bottom' | 'left' | 'right' = pV > pH ? (relY < rect.height / 2 ? 'top' : 'bottom') : (relX < rect.width / 2 ? 'left' : 'right');
            if (!dropTarget || dropTarget.index !== index || dropTarget.position !== pos) setDropTarget({ index, position: pos });
        } else if (!scenarioAtTarget) {
            setDropTarget(null);
            if (isOverEmpty !== index) setIsOverEmpty(index);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) { setDropTarget(null); setIsOverEmpty(null); }
    };
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                handleUndo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo]);
    
    // HRC Modals handlers
    const handleOpenImage = (scenario: Scenario, type: 'printSpotImage' | 'rpImage' | 'tableViewImage' | 'plusInfoImage' | 'evImage') => {
        const modalId = `${scenario.id}-${type}`;
        const newZIndex = zIndexCounter + 1;
        setZIndexCounter(newZIndex);
        if (openModals.find(m => m.id === modalId)) {
            handleBringToFrontModal(modalId);
        } else {
            const imageSrc = scenario[type]; if (!imageSrc) return;
            let buttonLabel = '';
            switch(type) {
                case 'printSpotImage': buttonLabel = 'HRC Table View'; break;
                case 'rpImage': buttonLabel = 'RP'; break;
                case 'evImage': buttonLabel = 'EV'; break;
                case 'tableViewImage': buttonLabel = 'Table View'; break;
                case 'plusInfoImage': buttonLabel = '+Info'; break;
            }
            const title = `${getScenarioTitle(scenario)} - ${buttonLabel}`;
            const newPos = { x: lastModalPosition.current.x + 30, y: lastModalPosition.current.y + 30 };
            if (newPos.x > window.innerWidth - 400 || newPos.y > window.innerHeight - 400) {
                lastModalPosition.current = { x: 50, y: 50 };
                newPos.x = lastModalPosition.current.x + 30;
                newPos.y = lastModalPosition.current.y + 30;
            }
            lastModalPosition.current = newPos;
            setOpenModals(current => [...current, { id: modalId, title, imageSrc, zIndex: newZIndex, position: newPos }]);
        }
    };
    const handleCloseImage = (id: string) => setOpenModals(current => current.filter(m => m.id !== id));
    const handleBringToFrontModal = (id: string) => {
        const newZIndex = zIndexCounter + 1;
        setZIndexCounter(newZIndex);
        setOpenModals(current => current.map(m => m.id === id ? { ...m, zIndex: newZIndex } : m));
    };
    const handleCloseAll = () => setOpenModals([]);
    const numActiveScenarios = useMemo(() => orderedScenarios.filter(s => !!s).length, [orderedScenarios]);
    const imageAspectRatioClass = useMemo(() => {
        if (gridCols && gridCols >= 4) return 'aspect-video';
        if (!gridCols) return 'aspect-square xl:aspect-video';
        return 'aspect-square';
    }, [gridCols]);
    const gridClassName = gridCols ? gridColClassMap[gridCols] ?? 'grid-cols-4' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';

    return (
        <div className="flex h-full bg-brand-bg">
            <div className="flex-1 flex flex-col min-w-0">
                <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-6 bg-brand-primary border-b border-brand-bg">
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <h2 className="text-2xl font-bold text-brand-text">Análises/Comparações:</h2>
                    </div>
                    <div className="flex-grow flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                        {!isStatsCanvasMode && !isSimpleMode && (
                            <>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-brand-text-muted mr-2">Controles:</span>
                                    <button onClick={handleAdjustLayout} disabled={!orderedScenarios.some(s => s === null)} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">Ajustar</button>
                                    <button onClick={handleUndo} disabled={history.length === 0} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>Desfazer</button>
                                    <button onClick={handleResetLayout} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-3 rounded-md transition-colors text-sm">Layout Original</button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-brand-text-muted mr-2">Layouts:</span>
                                    {layouts.map((layout) => {
                                        if (layout.type === 'single') {
                                            const enabled = isLayoutEnabled(layout.rows, layout.cols, numActiveScenarios);
                                            return <button key={layout.label} onClick={() => handleExpressLayout(layout.rows, layout.cols)} disabled={!enabled} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">{layout.label}</button>;
                                        }
                                        if (layout.type === 'dual') {
                                            const e1 = isLayoutEnabled(layout.layouts[0].rows, layout.layouts[0].cols, numActiveScenarios), e2 = isLayoutEnabled(layout.layouts[1].rows, layout.layouts[1].cols, numActiveScenarios);
                                            return <div key={`${layout.labels[0]}x${layout.labels[1]}`} className={`flex items-center justify-center bg-brand-bg text-brand-text font-semibold rounded-md transition-colors text-sm ${(!e1 && !e2) ? 'opacity-50 cursor-not-allowed' : ''}`}><span onClick={(e) => { if (e1) { e.stopPropagation(); handleExpressLayout(layout.layouts[0].rows, layout.layouts[0].cols); } }} className={`py-1.5 px-3 rounded-l-md ${e1 ? 'hover:bg-brand-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>{layout.labels[0]}</span><span className="text-brand-text-muted text-xs select-none">x</span><span onClick={(e) => { if (e2) { e.stopPropagation(); handleExpressLayout(layout.layouts[1].rows, layout.layouts[1].cols); } }} className={`py-1.5 px-3 rounded-r-md ${e2 ? 'hover:bg-brand-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>{layout.labels[1]}</span></div>;
                                        }
                                        return null;
                                    })}
                                </div>
                            </>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-brand-text-muted mr-2">Zoom:</span>
                            <button onClick={() => handleSetZoomLevel(p => Math.max(p / 1.1, 0.5))} className="bg-brand-bg hover:brightness-125 text-brand-text font-bold w-8 h-8 rounded-md transition-colors text-lg flex items-center justify-center">-</button>
                            <input type="range" min="0.5" max="2" step="0.01" value={zoomLevel} onChange={(e) => handleSetZoomLevel(parseFloat(e.target.value))} className="w-32 h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer accent-brand-secondary"/>
                            <button onClick={() => handleSetZoomLevel(p => Math.min(p * 1.1, 2))} className="bg-brand-bg hover:brightness-125 text-brand-text font-bold w-8 h-8 rounded-md transition-colors text-lg flex items-center justify-center">+</button>
                        </div>
                    </div>
                    <div className="flex items-center flex-shrink-0 gap-4">
                         <button
                            onClick={() => setIsNotesSplitViewOpen(prev => !prev)}
                            disabled={comparisonKey === 'global'}
                            className={`${isNotesSplitViewOpen ? 'bg-brand-secondary text-brand-primary' : 'bg-brand-primary hover:bg-brand-primary/80 text-brand-text'} font-semibold py-2 px-4 rounded-md transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={comparisonKey === 'global' ? "iNotes indisponível para comparações globais" : "Abrir/Fechar painel de anotações"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M4 3a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V3z" /></svg>
                            iNotes
                        </button>
                        {!areAllStatsAnalysis && (
                            <button onClick={() => handleSetIsSimpleMode(p => !p)} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors text-sm">{isSimpleMode ? 'Modo Avançado' : 'Modo Simples'}</button>
                        )}
                        {!isSimpleMode && !isStatsCanvasMode && openModals.length > 1 && ( <button onClick={handleCloseAll} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-md shadow-lg transition-transform hover:scale-105">Fechar Tudo</button> )}
                        <button onClick={onBack} className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>Voltar</button>
                    </div>
                </div>
                
                <div className="flex-grow p-6 overflow-auto">
                    {scenarios.length < 2 ? (
                        <div className="text-center py-12 text-brand-text-muted"><p>Selecione 2 ou mais cenários para comparar.</p></div>
                    ) : isStatsCanvasMode ? (
                        <div 
                            className="relative" 
                            style={{ 
                                width: '400vw',
                                height: '400vh',
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: 'top left',
                                transition: 'transform 0.2s ease-out'
                            }}
                        >
                            {scenarios.map(scenario => {
                                const cardState = cardStates.find(cs => cs.id === scenario.id);
                                if (!cardState) return null;
                                return <FreeDraggableCard key={scenario.id} cardState={cardState} scenario={scenario} onUpdate={handleUpdateCardState} onBringToFront={handleBringCardToFront} onZoom={(src) => setZoomedImage(src)} />;
                            })}
                        </div>
                    ) : isSimpleMode ? (
                        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.2s ease-out' }}>
                            {areAllStatsAnalysis ? (
                                <div className="flex flex-col items-center gap-8 max-w-5xl mx-auto">
                                    {scenarios.map(scenario => (
                                        <div key={scenario.id} className="w-full bg-brand-primary rounded-lg p-3 border border-brand-bg flex flex-col">
                                            <h3 className="font-bold text-center text-brand-text truncate mb-2 flex-shrink-0" title={getScenarioTitle(scenario)}>{getScenarioTitle(scenario)}</h3>
                                            <div className="bg-brand-bg rounded flex items-center justify-center relative">
                                                {scenario.rangeImage ? ( <> <img src={scenario.rangeImage} alt="Stats Analysis" className="max-w-full h-auto object-contain rounded"/> <div className="absolute inset-0 cursor-zoom-in" onClick={() => scenario.rangeImage && setZoomedImage(scenario.rangeImage)} /> </> ) : ( <div className="w-full aspect-video flex items-center justify-center"><span className="text-gray-500 text-sm">Sem Imagem</span></div> )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : ( <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">{scenarios.map(scenario => <SimpleScenarioCard key={scenario.id} scenario={scenario} onZoom={(src) => setZoomedImage(src)} onOpenImage={handleOpenImage} />)}</div> )}
                        </div>
                    ) : (
                        <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.2s ease-out' }}>
                            <div ref={gridRef} className={`grid ${gridClassName} gap-4`} onDragEnd={handleDragEnd}>
                                {displayItems.map((scenario, index) => {
                                    if (scenario) {
                                        return (
                                            <div key={scenario.id} className="relative" onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} onDragLeave={handleDragLeave}>
                                                <div className={`absolute -top-1 left-0 right-0 h-2 bg-brand-secondary rounded-full transition-transform duration-150 origin-center z-10 ${dropTarget?.index === index && dropTarget.position === 'top' ? 'scale-x-100' : 'scale-x-0'}`} />
                                                <div className={`absolute -bottom-1 left-0 right-0 h-2 bg-brand-secondary rounded-full transition-transform duration-150 origin-center z-10 ${dropTarget?.index === index && dropTarget.position === 'bottom' ? 'scale-x-100' : 'scale-x-0'}`} />
                                                <div className={`absolute -left-1 top-0 bottom-0 w-2 bg-brand-secondary rounded-full transition-transform duration-150 origin-center z-10 ${dropTarget?.index === index && dropTarget.position === 'left' ? 'scale-y-100' : 'scale-y-0'}`} />
                                                <div className={`absolute -right-1 top-0 bottom-0 w-2 bg-brand-secondary rounded-full transition-transform duration-150 origin-center z-10 ${dropTarget?.index === index && dropTarget.position === 'right' ? 'scale-y-100' : 'scale-y-0'}`} />
                                                <div draggable onDragStart={(e) => handleDragStart(e, scenario.id)} className={`w-full h-full bg-brand-primary rounded-lg p-3 border border-brand-bg cursor-move transition-opacity flex flex-col relative ${draggedId === scenario?.id ? 'opacity-20' : ''}`}>
                                                    <h3 className="font-bold text-center text-brand-text truncate mb-2 flex-shrink-0" title={getScenarioTitle(scenario)}>{getScenarioTitle(scenario)}</h3>
                                                    <div className={`bg-brand-bg ${imageAspectRatioClass} rounded flex items-center justify-center relative flex-shrink-0`}>
                                                        {scenario.rangeImage ? ( <> <img src={scenario.rangeImage} alt="Range" className="max-w-full max-h-full object-contain"/> <div className="absolute inset-0 cursor-zoom-in" onClick={() => scenario.rangeImage && setZoomedImage(scenario.rangeImage)} /> </> ) : ( <span className="text-gray-500 text-sm">Sem Imagem</span> )}
                                                    </div>
                                                    {scenario.frequenciesImage && scenario.showFrequenciesInCompare && <div className="bg-brand-bg aspect-[6/1] rounded flex items-center justify-center relative mt-2 flex-shrink-0"><img src={scenario.frequenciesImage} alt="Frequências" className="max-w-full max-h-full object-contain"/><div className="absolute inset-0 cursor-zoom-in" onClick={() => setZoomedImage(scenario.frequenciesImage!)}/></div>}
                                                    {scenario.evImage && scenario.showEvInCompare && <div className={`bg-brand-bg ${imageAspectRatioClass} rounded flex items-center justify-center relative mt-2 flex-shrink-0`}><img src={scenario.evImage} alt="EV" className="max-w-full max-h-full object-contain"/><div className="absolute inset-0 cursor-zoom-in" onClick={() => setZoomedImage(scenario.evImage!)}/></div>}
                                                    <div className="mt-auto pt-2 flex-shrink-0">
                                                        {(scenario.printSpotImage || scenario.rpImage || scenario.tableViewImage || scenario.plusInfoImage || scenario.evImage) && (
                                                            <div className="flex justify-center flex-wrap gap-1.5">
                                                                {scenario.printSpotImage && <button onClick={() => handleOpenImage(scenario, 'printSpotImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">HRC Table View</button>}
                                                                {scenario.rpImage && <button onClick={() => handleOpenImage(scenario, 'rpImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">RP</button>}
                                                                {scenario.evImage && <button onClick={() => handleOpenImage(scenario, 'evImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">EV</button>}
                                                                {scenario.tableViewImage && <button onClick={() => handleOpenImage(scenario, 'tableViewImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">Table View</button>}
                                                                {scenario.plusInfoImage && <button onClick={() => handleOpenImage(scenario, 'plusInfoImage')} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-1 px-2 rounded-md transition-colors text-xs">+Info</button>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return <div key={`empty-${index}`} className={`w-full min-h-[250px] rounded-lg transition-colors duration-150 ${isOverEmpty === index ? 'bg-brand-secondary/10 border-2 border-dashed border-brand-secondary' : ''}`} onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} onDragLeave={handleDragLeave}/>
                                })}
                            </div>
                        </div>
                    )}
                </div>
                
                {!isSimpleMode && openModals.map(modal => (
                    <DraggableImageViewer key={modal.id} id={modal.id} title={modal.title} imageSrc={modal.imageSrc} zIndex={modal.zIndex} initialPosition={modal.position} onClose={handleCloseImage} onBringToFront={handleBringToFrontModal} />
                ))}
                {zoomedImage && (
                    <DraggableZoomModal imageSrc={zoomedImage} onClose={() => setZoomedImage(null)} />
                )}
            </div>

            {isNotesSplitViewOpen && activeNotebook && (
                <>
                    <div 
                        onMouseDown={handleNotesPanelMouseDown}
                        className="w-1.5 cursor-col-resize bg-brand-primary hover:bg-brand-secondary transition-colors duration-200 flex-shrink-0"
                        title="Arraste para redimensionar"
                    />
                    <div style={{ width: `${notesPanelWidth}px` }} className="flex-shrink-0 h-full">
                        <NotebookNotesEditor
                            notebookId={activeNotebook.id}
                            initialContent={activeNotebook.notes || ''}
                            onSave={handleSaveNotes}
                            isSplitViewMode={true}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default ComparisonView;