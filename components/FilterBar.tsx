import React from 'react';
import { POSITIONS, GAME_SCENARIOS, RANGE_ACTIONS } from '../constants';
import type { Position, GameScenario, RangeAction } from '../types';

type ScenarioFilters = {
    raiserPos: Position | 'all';
    heroPos: Position | 'all';
    gameScenario: GameScenario | 'all';
    rangeAction: RangeAction | 'all';
};

interface FilterBarProps {
    filters: ScenarioFilters;
    onFilterChange: (filterName: keyof ScenarioFilters, value: string) => void;
    onClearFilters: () => void;
}

interface FilterButtonGroupProps {
    selectedValue: string;
    onChange: (value: string) => void;
    options: readonly string[];
}

const FilterButtonGroup: React.FC<FilterButtonGroupProps> = ({ selectedValue, onChange, options }) => {
    const commonButtonClasses = 'px-3 py-1 text-sm rounded-md transition-colors';
    const activeButtonClasses = 'bg-brand-secondary text-brand-primary font-bold';
    const inactiveButtonClasses = 'bg-brand-bg hover:brightness-125';
    
    return (
        <div className="flex flex-wrap items-center gap-2">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => {
                        if (selectedValue === option) {
                            onChange('all');
                        } else {
                            onChange(option);
                        }
                    }}
                    className={`${commonButtonClasses} ${selectedValue === option ? activeButtonClasses : inactiveButtonClasses}`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
};


const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onClearFilters }) => {
    return (
        <div className="bg-brand-primary p-4 rounded-lg border border-brand-bg mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                    <label className="block mb-2 text-sm font-medium text-brand-text-muted">Ação Range</label>
                    <FilterButtonGroup
                        selectedValue={filters.rangeAction}
                        onChange={(value) => onFilterChange('rangeAction', value)}
                        options={RANGE_ACTIONS}
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-brand-text-muted">Cenário Jogo</label>
                    <FilterButtonGroup
                        selectedValue={filters.gameScenario}
                        onChange={(value) => onFilterChange('gameScenario', value)}
                        options={GAME_SCENARIOS}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-brand-text-muted">First Raiser Position</label>
                    <FilterButtonGroup
                        selectedValue={filters.raiserPos}
                        onChange={(value) => onFilterChange('raiserPos', value)}
                        options={POSITIONS}
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium text-brand-text-muted">Hero Position</label>
                    <FilterButtonGroup
                        selectedValue={filters.heroPos}
                        onChange={(value) => onFilterChange('heroPos', value)}
                        options={POSITIONS}
                    />
                </div>
            </div>
            
            <div className="pt-4 mt-2 border-t border-brand-bg flex justify-end">
                <button onClick={onClearFilters} className="bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                    Limpar Filtros
                </button>
            </div>
        </div>
    );
};

export default FilterBar;