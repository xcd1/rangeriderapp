import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const GoogleIcon = () => (
    <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 64.5C308.6 102.3 282.7 90 248 90c-82.1 0-148.8 66.8-148.8 148.8s66.7 148.8 148.8 148.8c99.7 0 125.2-82.2 130.4-118.8H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
);

const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { signup, login, loginWithGoogle } = useAuth();

  useEffect(() => {
      const lastEmail = localStorage.getItem('lastLoggedInEmail');
      if (lastEmail) {
          setEmail(lastEmail);
      }
  }, []);

  const handleAuthAction = async (action: 'login' | 'signup') => {
    if (!email || !password) {
      setError("Por favor, preencha o e-mail e a senha.");
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      if (action === 'login') {
        const userCredential = await login(email, password, rememberMe);
        if(userCredential.user.email) {
            localStorage.setItem('lastLoggedInEmail', userCredential.user.email);
        }
      } else {
        await signup(email, password, rememberMe);
      }
    } catch (err) {
      const isFirebaseError = err && typeof err === 'object' && 'code' in err;
      if (isFirebaseError) {
        const firebaseError = err as { code: string; message: string };
        console.error("Firebase Auth Error:", firebaseError.code, firebaseError.message);
        switch (firebaseError.code) {
          case 'auth/invalid-api-key':
          case 'auth/project-not-found':
            setError('Erro de configuração do Firebase. Verifique as chaves no arquivo firebase.ts.');
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            setError('E-mail ou senha inválidos.');
            break;
          case 'auth/email-already-in-use':
            setError('Este e-mail já está cadastrado. Tente fazer login ou use uma conta Google.');
            break;
          case 'auth/weak-password':
            setError('A senha deve ter pelo menos 6 caracteres.');
            break;
          default:
            setError('Falha ao autenticar. Tente novamente.');
            break;
        }
      } else {
        console.error("Unexpected Auth Error:", err);
        setError('Ocorreu um erro inesperado.');
      }
    } finally {
        setIsLoading(false);
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
      const isFirebaseError = err && typeof err === 'object' && 'code' in err;
      if (isFirebaseError) {
         const firebaseError = err as { code: string; message: string };
        switch (firebaseError.code) {
            case 'auth/invalid-api-key':
            case 'auth/project-not-found':
                setError('Erro de configuração do Firebase. Verifique as chaves no arquivo firebase.ts.');
                break;
            case 'auth/unauthorized-domain':
                setError('Domínio não autorizado. Adicione-o nas configurações de autenticação do Firebase.');
                break;
            case 'auth/popup-closed-by-user':
                // Not an actual error, user just closed the window.
                break;
            default:
                console.error("Google Login Error:", err);
                setError('Falha ao fazer login com o Google. Tente novamente.');
                break;
        }
      } else {
        console.error("Unexpected Google Login Error:", err);
        setError('Ocorreu um erro inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-brand-bg">
      <div className="w-full max-w-sm p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-secondary">range rider</h1>
          <p className="mt-2 text-brand-text-muted">Improve your learning skills.</p>
        </div>
        <div className="space-y-4">
          <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-brand-secondary disabled:opacity-50"
            >
              <GoogleIcon />
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha (mín. 6 caracteres)"
            required
            className="w-full px-3 py-2 text-brand-text bg-brand-bg border border-brand-bg rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary"
          />
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
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => handleAuthAction('login')}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-text bg-brand-bg hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-gray-500 disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
            <button
              onClick={() => handleAuthAction('signup')}
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-primary bg-brand-secondary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-brand-secondary disabled:opacity-50 font-bold"
            >
              {isLoading ? 'Criando...' : 'Criar Conta'}
            </button>
          </div>
        </form>
         <p className="text-xs text-brand-text-muted text-center pt-2">powered by xcd1</p>
      </div>
    </div>
  );
};

export default LoginView;