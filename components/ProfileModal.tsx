import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

type ChangeMethod = 'select' | 'withPassword' | 'withCode_send' | 'withCode_verify';

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateUserProfile, sendChangePasswordCode, changePasswordWithCode, changePasswordWithOldPassword } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    
    // Profile State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

    // Password State
    const [changeMethod, setChangeMethod] = useState<ChangeMethod>('select');
    const [oldPassword, setOldPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    const resetMessages = useCallback(() => {
        setProfileMessage({ type: '', text: '' });
        setPasswordMessage({ type: '', text: '' });
    }, []);
    
    const resetPasswordForms = useCallback(() => {
        setChangeMethod('select');
        setOldPassword('');
        setVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordLoading(false);
    }, []);

    useEffect(() => {
        if (isOpen && user) {
            resetMessages();
            resetPasswordForms();
            setActiveTab('profile');
            // Populate profile form with data from the user object in context
            const displayName = user.displayName || '';
            const nameParts = displayName.split(' ');
            setFirstName(nameParts[0] || user.firstName || '');
            setLastName(nameParts.slice(1).join(' ') || user.lastName ||'');
            setPhone(user.phone || '');
        }
    }, [isOpen, user, resetMessages, resetPasswordForms]);
    
    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setIsProfileLoading(true);
        resetMessages();

        try {
            const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
            await updateUserProfile(displayName, phone.trim());
            setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        } catch (error) {
            console.error("Error updating profile:", error);
            setProfileMessage({ type: 'error', text: 'Falha ao atualizar o perfil. Tente novamente.' });
        } finally {
            setIsProfileLoading(false);
        }
    };
    
    const handleSendCode = async () => {
        setIsPasswordLoading(true);
        resetMessages();
        try {
            await sendChangePasswordCode();
            setChangeMethod('withCode_verify');
        } catch(error) {
            setPasswordMessage({ type: 'error', text: 'Erro ao enviar código. Tente novamente.'});
        } finally {
            setIsPasswordLoading(false);
        }
    };
    
    const handlePasswordChangeWithCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
            return;
        }

        setIsPasswordLoading(true);
        resetMessages();

        try {
            await changePasswordWithCode(verificationCode, newPassword);
            setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso! (Simulação)' });
            resetPasswordForms();
        } catch (error: any) {
            setPasswordMessage({ type: 'error', text: 'Código inválido ou expirado.' });
        } finally {
            setIsPasswordLoading(false);
        }
    };
    
    const handlePasswordChangeWithOld = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
            return;
        }
        setIsPasswordLoading(true);
        resetMessages();
        try {
            await changePasswordWithOldPassword(oldPassword, newPassword);
            setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            resetPasswordForms();
        } catch (error: any) {
             if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                setPasswordMessage({ type: 'error', text: 'A senha atual está incorreta.' });
            } else {
                console.error(error);
                setPasswordMessage({ type: 'error', text: 'Falha ao alterar a senha. Tente novamente.' });
            }
        } finally {
            setIsPasswordLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = "w-full px-3 py-2 text-brand-text bg-brand-bg border border-brand-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand-secondary";
    const buttonClass = "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold disabled:opacity-50";


    const renderPasswordChangeContent = () => {
        switch (changeMethod) {
            case 'select':
                return (
                    <div className="text-center space-y-4 pt-4">
                        <p className="text-brand-text-muted">Como você gostaria de alterar sua senha?</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={() => setChangeMethod('withPassword')} className={`${buttonClass} bg-brand-bg text-brand-text hover:brightness-125`}>
                                Usar Senha Atual
                            </button>
                            <button onClick={() => setChangeMethod('withCode_send')} className={`${buttonClass} text-brand-primary bg-brand-secondary hover:brightness-110`}>
                                Esqueci a Senha (Usar Código)
                            </button>
                        </div>
                    </div>
                );
            case 'withPassword':
                return (
                    <form onSubmit={handlePasswordChangeWithOld} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">Senha Atual</label>
                            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">Nova Senha</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={inputClass} placeholder="Mínimo de 6 caracteres"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">Confirmar Nova Senha</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClass} />
                        </div>
                         {passwordMessage.text && (
                            <p className={`text-sm text-center ${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {passwordMessage.text}
                            </p>
                        )}
                        <div className="pt-2 flex gap-4">
                            <button type="button" onClick={resetPasswordForms} disabled={isPasswordLoading} className={`${buttonClass} bg-brand-bg text-brand-text hover:brightness-125`}>
                              Voltar
                            </button>
                            <button type="submit" disabled={isPasswordLoading || oldPassword.length === 0 || newPassword.length < 6} className={`${buttonClass} text-brand-primary bg-brand-secondary hover:brightness-110`}>
                                {isPasswordLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Alterar Senha'}
                            </button>
                        </div>
                    </form>
                );
            case 'withCode_send':
                return (
                    <div className="text-center space-y-4">
                        <p className="text-brand-text-muted">Para sua segurança, enviaremos um código de verificação para seu e-mail para confirmar a alteração da senha.</p>
                        {passwordMessage.text && <p className="text-sm text-center text-red-400">{passwordMessage.text}</p>}
                         <div className="pt-2 flex gap-4">
                            <button type="button" onClick={resetPasswordForms} disabled={isPasswordLoading} className={`${buttonClass} bg-brand-bg text-brand-text hover:brightness-125`}>
                                Voltar
                            </button>
                            <button onClick={handleSendCode} disabled={isPasswordLoading} className={`${buttonClass} text-brand-primary bg-brand-secondary hover:brightness-110`}>
                               {isPasswordLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Enviar Código'}
                            </button>
                        </div>
                    </div>
                );
            case 'withCode_verify':
                return (
                    <form onSubmit={handlePasswordChangeWithCode} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">Código de Verificação</label>
                            <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} required className={`${inputClass} text-center text-xl tracking-widest`} placeholder="XXXX"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">Nova Senha</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={inputClass} placeholder="Mínimo de 6 caracteres"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">Confirmar Nova Senha</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClass} />
                        </div>
                        {passwordMessage.text && (
                            <p className={`text-sm text-center ${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {passwordMessage.text}
                            </p>
                        )}
                        <div className="pt-2 flex gap-4">
                            <button type="button" onClick={resetPasswordForms} disabled={isPasswordLoading} className={`${buttonClass} bg-brand-bg text-brand-text hover:brightness-125`}>
                              Voltar
                            </button>
                            <button type="submit" disabled={isPasswordLoading || verificationCode.length < 4 || newPassword.length < 6} className={`${buttonClass} text-brand-primary bg-brand-secondary hover:brightness-110`}>
                                {isPasswordLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Alterar Senha'}
                            </button>
                        </div>
                    </form>
                );
        }
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-brand-primary rounded-lg shadow-xl p-6 w-full max-w-lg m-4 border border-brand-bg flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-brand-secondary">Configurações da Conta</h2>
                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-text text-2xl font-bold">&times;</button>
                </div>
                
                <div className="border-b border-brand-bg mb-4">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-brand-secondary text-brand-secondary' : 'border-transparent text-brand-text-muted hover:text-brand-text hover:border-brand-text-muted'}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            Dados Pessoais
                        </button>
                        <button
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'password' ? 'border-brand-secondary text-brand-secondary' : 'border-transparent text-brand-text-muted hover:text-brand-text hover:border-brand-text-muted'}`}
                            onClick={() => setActiveTab('password')}
                        >
                            Alterar Senha
                        </button>
                    </nav>
                </div>
                
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileSave} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-brand-text-muted mb-1">Nome</label>
                                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-brand-text-muted mb-1">Sobrenome</label>
                                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">E-mail</label>
                            <input type="email" value={user?.email || ''} disabled className={`${inputClass} opacity-70 cursor-not-allowed`} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-muted mb-1">Celular</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX" className={inputClass} />
                        </div>
                        
                        {profileMessage.text && (
                            <p className={`text-sm text-center ${profileMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {profileMessage.text}
                            </p>
                        )}
                        
                        <div className="pt-2">
                             <button type="submit" disabled={isProfileLoading} className={`${buttonClass} text-brand-primary bg-brand-secondary hover:brightness-110`}>
                                {isProfileLoading ? <SpinnerIcon className="w-5 h-5" /> : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'password' && renderPasswordChangeContent()}
            </div>
        </div>
    );
};

export default ProfileModal;