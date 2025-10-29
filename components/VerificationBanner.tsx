import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const VerificationBanner: React.FC = () => {
  const { sendSignupVerificationCode, forceReloadUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          clearInterval(intervalId);
          forceReloadUser(); // This will update the context and hide the banner
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [forceReloadUser]);

  const handleResend = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      await sendSignupVerificationCode();
      setMessage('E-mail de verificação reenviado com sucesso!');
    } catch (error) {
      console.error(error);
      setMessage('Erro ao reenviar. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-500/20 border-l-4 border-brand-secondary text-brand-text p-4 mb-6 rounded-r-md" role="alert">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
            <p className="font-bold">Verifique seu e-mail</p>
            <p className="text-sm">
                Sua conta ainda não foi verificada. Por favor, clique no link que enviamos para o seu e-mail.
                <br />
                Verifique sua caixa de spam caso não veja o e-mail de confirmação na caixa de entrada.
            </p>
             {message && <p className="text-sm mt-2 text-brand-secondary font-semibold">{message}</p>}
        </div>
        <button
          onClick={handleResend}
          disabled={isLoading}
          className="ml-4 flex-shrink-0 bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-wait flex items-center"
        >
          {isLoading ? <SpinnerIcon className="w-4 h-4 mr-2" /> : null}
          {isLoading ? 'Reenviando...' : 'Reenviar E-mail'}
        </button>
      </div>
    </div>
  );
};

export default VerificationBanner;