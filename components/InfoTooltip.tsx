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
        ? 'top-full border-t-brand-primary'
        : 'bottom-full border-b-brand-primary';

    return (
        <div className="relative flex items-center group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-text-muted cursor-help" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className={`absolute left-1/2 -translate-x-1/2 w-64 p-3 bg-brand-primary border border-brand-bg text-brand-text text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-normal ${positionClasses}`}>
                {text}
                <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent ${arrowClasses}`}></div>
            </div>
        </div>
    );
};

export default InfoTooltip;