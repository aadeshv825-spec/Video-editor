import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  Check, 
  LogOut, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle,
  ShieldCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SecurityService } from '../../services/auth/securityService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
}) => {
  const { 
    currentUser, 
    switchUserPersona, 
    users, 
    signIn, 
    signInWithGoogle, 
    signUp, 
    signOut,
    requestPasswordReset,
    completePasswordReset
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // Forgot password flow
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [resetCode, setResetCode] = useState('');
  const [dispatchedCode, setDispatchedCode] = useState<string | null>(null);

  // Show/Hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const passwordStrength = SecurityService.evaluatePasswordStrength(password);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setResetCode('');
    setDispatchedCode(null);
    setForgotStep('request');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setForgotStep('request');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.success) {
          setSuccessMessage(`Welcome back! Signed in as ${email}.`);
          setTimeout(() => {
            resetForm();
            onClose();
          }, 800);
        } else {
          setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match. Please re-enter.');
          setIsSubmitting(false);
          return;
        }
        if (!passwordStrength.hasMinLength) {
          setErrorMessage('Password must be at least 8 characters long.');
          setIsSubmitting(false);
          return;
        }

        const res = await signUp(name, email, password);
        if (res.success) {
          setSuccessMessage(`Account created successfully! Welcome, ${name || 'Creator'}.`);
          setTimeout(() => {
            resetForm();
            onClose();
          }, 900);
        } else {
          setErrorMessage(res.error || 'Registration failed.');
        }
      } else if (mode === 'forgot') {
        if (forgotStep === 'request') {
          const res = await requestPasswordReset(email);
          if (res.success) {
            setDispatchedCode(res.resetCode || null);
            setSuccessMessage(res.message);
            setForgotStep('verify');
          } else {
            setErrorMessage(res.error || 'Could not find an account with this email.');
          }
        } else if (forgotStep === 'verify') {
          if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            setIsSubmitting(false);
            return;
          }
          if (password.length < 8) {
            setErrorMessage('New password must be at least 8 characters.');
            setIsSubmitting(false);
            return;
          }

          const res = await completePasswordReset(email, resetCode, password);
          if (res.success) {
            setSuccessMessage(res.message);
            setTimeout(() => {
              setMode('signin');
              setForgotStep('request');
              setPassword('');
              setConfirmPassword('');
              setErrorMessage(null);
            }, 1200);
          } else {
            setErrorMessage(res.error || 'Reset code verification failed.');
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        setSuccessMessage('Authenticated seamlessly via Google Identity Services.');
        setTimeout(() => {
          resetForm();
          onClose();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Google sign-in failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in encountered an error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    setSuccessMessage('Signed out of active session.');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        id="auth-modal-card"
        className="w-full max-w-md bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div>
            <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>
                {mode === 'signin' && 'Sign In to VYRO Studio'}
                {mode === 'signup' && 'Create Creator Account'}
                {mode === 'forgot' && (forgotStep === 'request' ? 'Reset Account Password' : 'Enter Verification Code')}
              </span>
            </h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Enterprise cryptographic hashing & secure session management.
            </p>
          </div>
          <button
            id="auth-close-btn"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{successMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Google Identity Sign-In (Shown on Sign In & Sign Up) */}
          {mode !== 'forgot' && (
            <div className="space-y-3">
              <button
                id="google-signin-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#181b22] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-100 font-medium text-xs flex items-center justify-center gap-2.5 transition-colors shadow-xs active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-2 text-neutral-400 text-[10px] uppercase font-mono">
                <span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                <span>or continue with email</span>
                <span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          )}

          {/* Core Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {/* Full Name (Sign Up Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Elena Vance"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            {!(mode === 'forgot' && forgotStep === 'verify') && (
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="creator@studio.ai"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            {/* Forgot Password Step 2: Verification Code */}
            {mode === 'forgot' && forgotStep === 'verify' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] space-y-1 text-neutral-600 dark:text-neutral-300">
                  <p>A verification code was dispatched for: <strong className="text-neutral-900 dark:text-white">{email}</strong></p>
                  {dispatchedCode && (
                    <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-mono text-center font-bold tracking-widest text-sm">
                      TEST CODE: {dispatchedCode}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">6-Digit Reset Code</label>
                  <input
                    id="reset-code-input"
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono text-center tracking-widest text-base font-bold focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            {/* Password Field (Sign In, Sign Up, and Forgot Step 2) */}
            {(mode !== 'forgot' || forgotStep === 'verify') && (
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  {mode === 'forgot' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-8 pr-10 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    id="toggle-password-visibility-btn"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator (Sign Up and New Password) */}
                {(mode === 'signup' || (mode === 'forgot' && forgotStep === 'verify')) && password.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500">Strength:</span>
                      <span style={{ color: passwordStrength.color }} className="font-semibold">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          className="h-full flex-1 transition-all"
                          style={{
                            backgroundColor: idx <= passwordStrength.score ? passwordStrength.color : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password (Sign Up & Forgot Step 2) */}
            {(mode === 'signup' || (mode === 'forgot' && forgotStep === 'verify')) && (
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="auth-confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-8 pr-10 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    id="toggle-confirm-password-visibility-btn"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 mt-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Create Free Account'}
                {mode === 'forgot' && (forgotStep === 'request' ? 'Send 6-Digit Code' : 'Update & Reset Password')}
              </span>
            </button>

            {/* Navigation links */}
            <div className="flex items-center justify-between pt-2 text-[11px] text-neutral-500">
              {mode === 'signin' ? (
                <>
                  <button 
                    type="button" 
                    onClick={() => handleSwitchMode('forgot')} 
                    className="hover:underline text-neutral-600 dark:text-neutral-400"
                  >
                    Forgot password?
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleSwitchMode('signup')} 
                    className="hover:underline font-medium text-neutral-900 dark:text-neutral-100"
                  >
                    Don't have an account? Sign up
                  </button>
                </>
              ) : mode === 'signup' ? (
                <button 
                  type="button" 
                  onClick={() => handleSwitchMode('signin')} 
                  className="hover:underline text-neutral-900 dark:text-neutral-100 mx-auto"
                >
                  Already have an account? Sign In
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => handleSwitchMode('signin')} 
                  className="hover:underline text-neutral-900 dark:text-neutral-100 mx-auto"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Current Active Account Bar & Actions */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-[10px] text-neutral-700 dark:text-neutral-200 uppercase">
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate max-w-[170px]">
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-neutral-400 font-mono uppercase">
                  {currentUser.role} • {currentUser.isPro ? 'Pro' : 'Free'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenProfile && (
                <button
                  id="auth-open-profile-btn"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center gap-1"
                >
                  <span>Profile</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <button
                id="auth-signout-btn"
                onClick={handleSignOut}
                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                title="Sign out of active account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Persona Switcher for Development & Testing */}
          <div className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-1.5">
            <div className="font-mono text-[9px] uppercase text-neutral-400">Quick Persona Switch (Test Tiers):</div>
            <div className="grid grid-cols-4 gap-1">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    switchUserPersona(u.id);
                    onClose();
                  }}
                  className={`p-1.5 rounded-md border text-center font-mono text-[9px] transition-all truncate ${
                    currentUser.id === u.id
                      ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  title={`${u.name} (${u.role})`}
                >
                  {u.role.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
