import React from 'react';
import { useComparison } from '../contexts/ComparisonContext';

interface ComparisonTrayProps {
    onCompare: () => void;
}

const ScaleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="m16 16 3-8 3 8c-2 1-4 1-6 0"/><path d="M2 16l3-8 3 8c-2 1-4 1-6 0"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
);

const ComparisonTray: React.FC<ComparisonTrayProps> = ({ onCompare }) => {
    const { scenariosToCompare, clearComparison } = useComparison();

    if (scenariosToCompare.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-primary p-4 rounded-lg shadow-2xl border border-brand-bg flex items-center gap-4 animate-fade-in-up">
            <div className="flex items-center">
                <ScaleIcon />
                <span className="font-bold text-brand-text">
                    {scenariosToCompare.length} cenário(s) selecionado(s)
                </span>
            </div>
            <button
                onClick={clearComparison}
                className="bg-brand-bg hover:brightness-125 text-brand-text-muted font-semibold py-2 px-4 rounded-md transition-colors text-sm"
            >
                Limpar
            </button>
            <button
                onClick={onCompare}
                disabled={scenariosToCompare.length < 2}
                className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors disabled:bg-brand-secondary/50 disabled:cursor-not-allowed disabled:text-brand-primary/70"
            >
                Comparar
            </button>
        </div>
    );
};

export default ComparisonTray;
