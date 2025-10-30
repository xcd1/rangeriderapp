import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotPassModalOpen, setIsForgotPassModalOpen] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  
  const { signup, login, loginWithGoogle } = useAuth();

  useEffect(() => {
      const lastEmail = localStorage.getItem('lastLoggedInEmail');
      if (lastEmail) {
          setEmail(lastEmail);
      }
  }, []);
  
  const handleSignup = async () => {
    if (!email || !password) {
      setError("Por favor, preencha o e-mail e a senha.");
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // The onAuthStateChanged listener in AuthContext will handle logging the user in
      // and showing the main app with the verification banner.
      await signup(email, password, rememberMe);
    } catch (err) {
      handleAuthError(err, 'signup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
      if (!email || !password) {
        setError("Por favor, preencha o e-mail e a senha.");
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const userCredential = await login(email, password, rememberMe);
        if(userCredential.user.email) {
            localStorage.setItem('lastLoggedInEmail', userCredential.user.email);
        }
      } catch (err) {
        handleAuthError(err, 'login');
      } finally {
          setIsLoading(false);
      }
  };

  const handleAuthError = (err: unknown, context: 'login' | 'signup' | 'google') => {
      const isFirebaseError = err && typeof err === 'object' && 'code' in err;
      if (isFirebaseError) {
        const firebaseError = err as { code: string; message: string };
        console.error(`Firebase Auth Error (${context}):`, firebaseError.code, firebaseError.message);
        switch (firebaseError.code) {
          case 'auth/invalid-api-key':
          case 'auth/project-not-found':
            setError('Erro de configuração do Firebase.');
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            setError('E-mail ou senha inválidos.');
            break;
          case 'auth/email-already-in-use':
            setError('Este e-mail já está cadastrado. Tente fazer login.');
            break;
          case 'auth/weak-password':
            setError('A senha deve ter pelo menos 6 caracteres.');
            break;
          case 'auth/unauthorized-domain':
            setError('Domínio não autorizado. Verifique as configurações do Firebase.');
            break;
          case 'auth/popup-closed-by-user':
            setError(''); // Not an actual error
            break;
          default:
            setError('Falha ao autenticar. Tente novamente.');
            break;
        }
      } else {
        console.error(`Unexpected Auth Error (${context}):`, err);
        setError('Ocorreu um erro inesperado.');
      }
  };


  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await loginWithGoogle(rememberMe);
      if(result.user.email) {
          localStorage.setItem('lastLoggedInEmail', result.user.email);
      }
    } catch (err) {
      handleAuthError(err, 'google');
    } finally {
      setIsLoading(false);
    }
  }

  const checkCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof event.getModifierState === 'function') {
        setIsCapsLockOn(event.getModifierState('CapsLock'));
    }
  };

  return (
    <>
    <div className="flex items-center justify-center h-screen bg-brand-bg">
      <div className="w-full max-w-sm p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-secondary">range rider</h1>
          <p className="mt-2 text-brand-text-muted">Improve your learning skills.</p>
        </div>
        <>
          <div className="space-y-4">
            <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center py-2 px-4 border border-brand-bg rounded-md shadow-sm bg-brand-bg text-brand-text hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-brand-secondary disabled:opacity-50"
              >
                Entrar com o Google
              </button>
          </div>
          <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-brand-bg"></div>
              <span className="flex-shrink mx-4 text-brand-text-muted text-xs">OU</span>
              <div className="flex-grow border-t border-brand-bg"></div>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="w-full px-3 py-2 text-brand-text bg-brand-bg border border-brand-bg rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary"
            />
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={checkCapsLock}
                placeholder="Senha (mín. 6 caracteres)"
                required
                className="w-full px-3 py-2 text-brand-text bg-brand-bg border border-brand-bg rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary"
              />
              {isCapsLockOn && (
                  <p className="text-yellow-400 text-xs text-center pt-2">
                      Aviso: Caps Lock está ativado.
                  </p>
              )}
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input 
                        id="remember-me" 
                        name="remember-me" 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-brand-secondary bg-brand-bg border-brand-bg rounded focus:ring-brand-secondary" 
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-brand-text-muted">
                        Salvar neste dispositivo
                    </label>
                </div>
                <div className="text-sm">
                    <button
                        type="button"
                        onClick={() => setIsForgotPassModalOpen(true)}
                        className="font-medium text-brand-secondary hover:underline"
                    >
                        Esqueceu a senha?
                    </button>
                </div>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <div className="flex gap-4 pt-2">
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-text bg-brand-bg hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-gray-500 disabled:opacity-50"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                onClick={handleSignup}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-primary bg-brand-secondary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-brand-secondary disabled:opacity-50 font-bold"
              >
                {isLoading ? 'Criando...' : 'Criar Conta'}
              </button>
            </div>
          </form>
        </>
        <p className="text-xs text-brand-text-muted text-center pt-2">powered by xcd1</p>
      </div>
    </div>
    <ForgotPasswordModal 
        isOpen={isForgotPassModalOpen}
        onClose={() => setIsForgotPassModalOpen(false)}
    />
    </>
  );
};

export default LoginView;