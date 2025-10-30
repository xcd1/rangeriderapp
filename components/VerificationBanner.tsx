import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';

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
          {isLoading ? 'Reenviando...' : 'Reenviar E-mail'}
        </button>
      </div>
    </div>
  );
};

export default VerificationBanner;