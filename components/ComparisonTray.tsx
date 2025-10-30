import React from 'react';
import { useComparison } from '../contexts/ComparisonContext';

interface ComparisonTrayProps {
    onCompare: () => void;
}

const ComparisonTray: React.FC<ComparisonTrayProps> = ({ onCompare }) => {
    const { scenariosToCompare, clearComparison } = useComparison();

    if (scenariosToCompare.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-primary p-4 rounded-lg shadow-2xl border border-brand-bg flex items-center gap-4 animate-fade-in-up">
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-brand-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.333a3.001 3.001 0 013.333 2.5A4 4 0 0115 10v.5a2.5 2.5 0 01-5 0V10a4 4 0 01.667-2.167A3.001 3.001 0 019 4.333V3a1 1 0 011-1zm-3.5 9.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM10 12a4 4 0 00-4 4h8a4 4 0 00-4-4z" clipRule="evenodd" /></svg>
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