import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { sendPasswordReset } = useAuth();
  const [step, setStep] = useState<'enterEmail' | 'success'>('enterEmail');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await sendPasswordReset(email);
      setStep('success');
    } catch (error) {
      const isFirebaseError = error && typeof error === 'object' && 'code' in error;
      if (isFirebaseError) {
          const firebaseError = error as { code: string; message: string };
          if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/invalid-email') {
              setError('Nenhum usuário encontrado com este e-mail.');
          } else {
              setError('Ocorreu um erro. Tente novamente.');
              console.error(error);
          }
      } else {
           setError('Ocorreu um erro. Tente novamente.');
           console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setTimeout(() => {
        setStep('enterEmail');
        setEmail('');
        setError('');
        setIsLoading(false);
    }, 300); // Delay to allow fade-out animation
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-brand-primary rounded-lg shadow-xl p-6 w-full max-w-sm m-4 border border-brand-bg"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-brand-secondary mb-4">Recuperar Senha</h2>
        
        {step === 'enterEmail' && (
          <form onSubmit={handleSendLink} className="space-y-4">
            <p className="text-sm text-brand-text-muted">
              Digite seu e-mail e enviaremos um link para você redefinir sua senha.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              required
              className="w-full px-3 py-2 text-brand-text bg-brand-bg border border-brand-bg rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div className="flex justify-end gap-4 pt-2">
              <button type="button" onClick={handleClose} disabled={isLoading} className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-bg hover:brightness-125 transition-all disabled:opacity-50">Cancelar</button>
              <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-secondary hover:brightness-110 text-brand-primary transition-all disabled:opacity-50 flex items-center">
                {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
                {isLoading ? 'Enviando...' : 'Enviar Link'}
              </button>
            </div>
          </form>
        )}
        
        {step === 'success' && (
            <div>
                <p className="text-green-400 text-center mb-4">Link para redefinição de senha enviado! Verifique seu e-mail (e a caixa de spam).</p>
                <button onClick={handleClose} className="w-full bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors">Fechar</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;