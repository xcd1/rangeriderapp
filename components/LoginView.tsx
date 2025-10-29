import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';

const GoogleIcon = () => (
    <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 64.5C308.6 102.3 282.7 90 248 90c-82.1 0-148.8 66.8-148.8 148.8s66.7 148.8 148.8 148.8c99.7 0 125.2-82.2 130.4-118.8H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isForgotPassModalOpen, setIsForgotPassModalOpen] = useState(false);
  const [signupState, setSignupState] = useState<'credentials' | 'verifyCode'>('credentials');
  
  const { signup, login, loginWithGoogle, sendSignupVerificationCode, completeSignupVerification } = useAuth();

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
      await signup(email, password, rememberMe);
      await sendSignupVerificationCode();
      setSignupState('verifyCode');
    } catch (err) {
      handleAuthError(err, 'signup');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCodeVerification = async () => {
    setIsLoading(true);
    setError('');
    try {
        await completeSignupVerification(verificationCode);
        // On success, the AuthProvider's onAuthStateChanged will handle the login.
    } catch (err) {
        setError("Código de verificação inválido ou expirado.");
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

  const renderCredentialsView = () => (
    <>
      <div className="space-y-4">
        <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center py-2 px-4 border border-brand-bg rounded-md shadow-sm bg-brand-bg text-brand-text hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-brand-secondary disabled:opacity-50"
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
  );

  const renderVerificationView = () => (
    <div className="space-y-4">
        <h3 className="text-center text-xl font-bold text-brand-text">Verifique sua conta</h3>
        <p className="text-center text-sm text-brand-text-muted">
            Enviamos um código de 4 dígitos para <strong className="text-brand-text">{email}</strong>. Por favor, insira-o abaixo.
        </p>
        <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="XXXX"
            maxLength={4}
            required
            className="w-full px-3 py-2 text-brand-text bg-brand-bg border border-brand-bg rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary text-center text-xl tracking-widest"
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <div className="flex gap-4 pt-2">
            <button
                onClick={() => setSignupState('credentials')}
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-text bg-brand-bg hover:brightness-125 disabled:opacity-50"
            >
                Voltar
            </button>
            <button
                onClick={handleCodeVerification}
                disabled={isLoading || verificationCode.length < 4}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-brand-primary bg-brand-secondary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-primary focus:ring-brand-secondary disabled:opacity-50 font-bold"
            >
                {isLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Verificar'}
            </button>
        </div>
         <button onClick={sendSignupVerificationCode} className="text-xs text-brand-secondary hover:underline w-full text-center mt-2">Reenviar código</button>
    </div>
  );

  return (
    <>
    <div className="flex items-center justify-center h-screen bg-brand-bg">
      <div className="w-full max-w-sm p-8 space-y-6 bg-brand-primary rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-secondary">range rider</h1>
          <p className="mt-2 text-brand-text-muted">Improve your learning skills.</p>
        </div>
        {signupState === 'credentials' ? renderCredentialsView() : renderVerificationView()}
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