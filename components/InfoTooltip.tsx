import React from 'react';

interface InfoTooltipProps {
    text: string;
    direction?: 'top' | 'bottom';
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, direction = 'top' }) => {
    const positionClasses = direction === 'top' 
        ? 'bottom-full mb-2' 
        : 'top-full mt-2';
    
    const arrowClasses = direction === 'top'
        ? 'top-full border-t-brand-bg'
        : 'bottom-full border-b-brand-bg';

    return (
        <div className="relative flex items-center group">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-text-muted cursor-help">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div className={`absolute left-1/2 -translate-x-1/2 w-64 p-2 bg-brand-bg text-brand-text text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-normal ${positionClasses}`}>
                {text}
                <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent ${arrowClasses}`}></div>
            </div>
        </div>
    );
};

export default InfoTooltip;
