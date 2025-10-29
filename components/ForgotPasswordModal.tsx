import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { sendPasswordResetCode, resetPasswordWithCode } = useAuth();
  const [step, setStep] = useState<'enterEmail' | 'enterCode' | 'success'>('enterEmail');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await sendPasswordResetCode(email);
      setStep('enterCode');
    } catch (error) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      await resetPasswordWithCode(email, code, newPassword);
      setStep('success');
    } catch (error) {
      setError('Código inválido ou expirado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setTimeout(() => {
        setStep('enterEmail');
        setEmail('');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
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
          <form onSubmit={handleSendCode} className="space-y-4">
            <p className="text-sm text-brand-text-muted">
              Digite seu e-mail e enviaremos um código de 4 dígitos para você redefinir sua senha.
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
                {isLoading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </div>
          </form>
        )}
        
        {step === 'enterCode' && (
           <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-brand-text-muted">Enviamos um código para <strong>{email}</strong>. Verifique sua caixa de entrada e de spam.</p>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="Código de 4 dígitos" maxLength={4} required className="w-full px-3 py-2 text-brand-text bg-brand-bg rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary text-center text-xl tracking-widest"/>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nova senha (mín. 6 caracteres)" required className="w-full px-3 py-2 text-brand-text bg-brand-bg rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary"/>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar nova senha" required className="w-full px-3 py-2 text-brand-text bg-brand-bg rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary"/>
            
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div className="flex justify-end gap-4 pt-2">
              <button type="button" onClick={() => setStep('enterEmail')} disabled={isLoading} className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-bg hover:brightness-125 transition-all disabled:opacity-50">Voltar</button>
              <button type="submit" disabled={isLoading || code.length < 4 || newPassword.length < 6} className="px-4 py-2 rounded-md text-sm font-semibold bg-brand-secondary hover:brightness-110 text-brand-primary transition-all disabled:opacity-50 flex items-center">
                {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
                {isLoading ? 'Salvando...' : 'Salvar Senha'}
              </button>
            </div>
          </form>
        )}
        
        {step === 'success' && (
            <div>
                <p className="text-green-400 text-center mb-4">Sua senha foi redefinida com sucesso! Você já pode fazer login com a nova senha.</p>
                <button onClick={handleClose} className="w-full bg-brand-bg hover:brightness-125 text-brand-text font-semibold py-2 px-4 rounded-md transition-colors">Fechar</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;