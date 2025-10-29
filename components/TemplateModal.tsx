import React from 'react';
import { SCENARIO_TEMPLATES } from '../constants';
import type { ScenarioTemplate } from '../types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ScenarioTemplate) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-brand-primary rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 border border-brand-bg"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-brand-secondary mb-2">Criar a partir de um Modelo</h2>
        <p className="text-brand-text-muted mb-6 text-sm">Selecione um cenário comum para começar rapidamente. Você só precisará adicionar suas imagens e anotações.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SCENARIO_TEMPLATES.map((template) => (
                <button
                    key={template.name}
                    onClick={() => onSelect(template)}
                    className="p-4 bg-brand-bg hover:bg-brand-secondary/20 rounded-md transition-colors text-left"
                >
                    <p className="font-bold text-brand-text">{template.name}</p>
                    <p className="text-xs text-brand-text-muted">{template.spotType}</p>
                </button>
            ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-bg hover:brightness-125 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
