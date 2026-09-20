import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Crown, 
  HardDrive, 
  Smartphone, 
  Laptop, 
  LogOut, 
  Trash2, 
  Check, 
  History, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Edit2,
  Save,
  Clock,
  Layers,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BackupService } from '../../services/backup/backupService';
import { CreditLedgerService } from '../../services/credits/creditLedgerService';
import { SecurityService } from '../../services/auth/securityService';
import { CloudStorageUsage, CreditTransaction } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPro?: () => void;
  onOpenSubscription?: () => void;
  onOpenCloudStorage: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenPro,
  onOpenSubscription,
  onOpenCloudStorage,
}) => {
  const handleOpenPro = onOpenSubscription || onOpenPro || (() => {});
  const { 
    currentUser, 
    isPro, 
    isOwner, 
    updateAccountProfile, 
    signOutOtherDevices, 
    deleteAccount,
    restorePurchase,
    changePassword,
    verifyEmail,
    resendVerificationEmail
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'ledger' | 'devices'>('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePasswordText, setDeletePasswordText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Security Center state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Email verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [dispatchedVerifyCode, setDispatchedVerifyCode] = useState<string | null>(null);
  const [emailVerifyStatus, setEmailVerifyStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isSendingVerify, setIsSendingVerify] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const [storageUsage, setStorageUsage] = useState<CloudStorageUsage>(() =>
    BackupService.getStorageUsage(isPro)
  );

  const [transactions, setTransactions] = useState<CreditTransaction[]>(() =>
    CreditLedgerService.getTransactionsForUser(currentUser.id)
  );

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setAvatar(currentUser.avatar || '');
      setStorageUsage(BackupService.getStorageUsage(isPro));
      setTransactions(CreditLedgerService.getTransactionsForUser(currentUser.id));
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
      setDeletePasswordText('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordChangeStatus(null);
      setEmailVerifyStatus(null);
    }
  }, [isOpen, currentUser, isPro]);

  if (!isOpen) return null;

  const newPasswordStrength = SecurityService.evaluatePasswordStrength(newPassword);

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAccountProfile({
      name: name.trim() || currentUser.name,
      email: email.trim() || currentUser.email,
      avatar: avatar.trim() || undefined,
    });
    setIsEditing(false);
    notify('Profile updated successfully.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordChangeStatus({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordChangeStatus({ type: 'success', message: 'Password updated and encrypted with salted SHA-256.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        notify('Account security credentials updated.');
      } else {
        setPasswordChangeStatus({ type: 'error', message: res.error || 'Failed to update password.' });
      }
    } catch (err: any) {
      setPasswordChangeStatus({ type: 'error', message: err.message || 'Error changing password.' });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSendVerificationCode = async () => {
    setIsSendingVerify(true);
    setEmailVerifyStatus(null);
    try {
      const res = await resendVerificationEmail();
      if (res.success) {
        setDispatchedVerifyCode(res.verificationCode || null);
        setEmailVerifyStatus({ type: 'success', message: res.message });
      } else {
        setEmailVerifyStatus({ type: 'error', message: 'Could not send verification code.' });
      }
    } finally {
      setIsSendingVerify(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      setEmailVerifyStatus({ type: 'error', message: 'Please enter the verification code.' });
      return;
    }
    setIsVerifyingCode(true);
    try {
      const res = await verifyEmail(verificationCode.trim());
      if (res.success) {
        setEmailVerifyStatus({ type: 'success', message: 'Email address successfully verified!' });
        setVerificationCode('');
        setDispatchedVerifyCode(null);
        notify('Email verified successfully.');
      } else {
        setEmailVerifyStatus({ type: 'error', message: res.error || 'Verification code failed.' });
      }
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSignOutOtherDevices = () => {
    signOutOtherDevices();
    notify('Successfully signed out all other active sessions.');
  };

  const handleRestorePurchase = async () => {
    setIsRestoring(true);
    const res = await restorePurchase();
    setIsRestoring(false);
    notify(res.message);
  };

  const handleDeleteAccount = async () => {
    if (isOwner) {
      notify('Platform owner account cannot be deleted.');
      return;
    }
    if (deleteConfirmText !== 'DELETE') {
      notify('Please type DELETE to confirm permanent account deletion.');
      return;
    }
    const res = await deleteAccount(currentUser.id, deletePasswordText);
    if (res.success) {
      onClose();
    } else {
      notify(res.error || 'Failed to delete account.');
    }
  };

  const totalUsedBytes =
    storageUsage.usedProjectsBytes +
    storageUsage.usedBackupsBytes +
    storageUsage.usedGeneratedAssetsBytes +
    storageUsage.usedTrashBytes;

  const usedGb = (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const totalGb = (storageUsage.totalQuotaBytes / (1024 * 1024 * 1024)).toFixed(0);
  const usedPercent = Math.min(100, Math.round((totalUsedBytes / storageUsage.totalQuotaBytes) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div 
        id="user-profile-modal-card"
        className="w-full max-w-2xl bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto text-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-500" />
            <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">
              Account Profile & Workspace Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {notice && (
          <div className="p-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-mono text-[11px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Account Details & Plan
          </button>
          <button
            id="tab-security-center-btn"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
            <span>Security Center</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>AI Credit Ledger ({transactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'devices'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Active Sessions ({(currentUser.devices || []).length || 1})</span>
          </button>
        </div>

        {/* TAB 1: PROFILE & PLAN */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-14 h-14 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-lg font-bold text-neutral-700 dark:text-neutral-300 uppercase">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  {isPro && (
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full text-[9px]">
                      <Crown className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {currentUser.name}
                    </h3>
                    <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-neutral-500 text-xs mt-0.5">{currentUser.email}</div>
                  <div className="text-neutral-400 text-[10px] font-mono mt-1">
                    Account ID: {currentUser.id} • Active: {currentUser.lastActiveAt}
                  </div>
                </div>
              </div>

              <button
                id="edit-profile-btn"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>

            {/* Editable Profile Form */}
            {isEditing && (
              <form onSubmit={handleSaveProfile} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface space-y-3">
                <div className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-xs uppercase">
                  Edit Personal Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Avatar Image URL (Optional)</label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={e => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono text-[11px]"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}

            {/* Plan & Entitlement Status Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-neutral-400">Membership Tier</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                    isPro 
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}>
                    {isPro ? 'Studio Pro' : 'Free Starter'}
                  </span>
                </div>

                <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {isPro ? 'Pro Privileges Active' : 'Basic Local Studio'}
                </div>

                <div className="text-[11px] text-neutral-500">
                  {currentUser.proExpiresAt ? (
                    `Renews/Expires on ${new Date(currentUser.proExpiresAt).toLocaleDateString()}`
                  ) : isPro ? (
                    'Lifetime / Unrestricted Owner Privileges'
                  ) : (
                    'Upgrade to Pro for 4K video upscale, Flux photorealism and cloud sync.'
                  )}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    id="profile-manage-pro-btn"
                    onClick={() => {
                      onClose();
                      handleOpenPro();
                    }}
                    className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg text-xs hover:opacity-90"
                  >
                    {isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
                  </button>
                  <button
                    onClick={handleRestorePurchase}
                    disabled={isRestoring}
                    className="px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-neutral-600 dark:text-neutral-400"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
                    <span>Restore</span>
                  </button>
                </div>
              </div>

              {/* AI Credits Card */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-neutral-400">AI Inference Credits</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>

                <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                  {currentUser.aiCredits.toLocaleString()} <span className="text-xs font-normal text-neutral-400">Credits</span>
                </div>

                <p className="text-[11px] text-neutral-500">
                  Credits are automatically debited per AI generation, voice clone, and optical enhancement pass.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('ledger')}
                    className="text-neutral-900 dark:text-white font-medium hover:underline flex items-center gap-1"
                  >
                    <span>View Transaction Ledger</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Cloud Storage Meter Card */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-neutral-500" />
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                    Cloud Storage & Vault
                  </span>
                </div>
                <button
                  id="profile-manage-cloud-storage-btn"
                  onClick={() => {
                    onClose();
                    onOpenCloudStorage();
                  }}
                  className="text-neutral-900 dark:text-neutral-100 underline hover:opacity-80 font-medium"
                >
                  Manage Storage Quota
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-neutral-500 font-mono text-[11px]">
                  <span>{usedGb} GB used of {totalGb} GB</span>
                  <span>{usedPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
                  <div 
                    style={{ width: `${Math.min(100, Math.round((storageUsage.usedProjectsBytes / storageUsage.totalQuotaBytes) * 100))}%` }} 
                    className="bg-blue-500 h-full" 
                    title="Projects"
                  />
                  <div 
                    style={{ width: `${Math.min(100, Math.round((storageUsage.usedBackupsBytes / storageUsage.totalQuotaBytes) * 100))}%` }} 
                    className="bg-emerald-500 h-full" 
                    title="Backups"
                  />
                  <div 
                    style={{ width: `${Math.min(100, Math.round((storageUsage.usedGeneratedAssetsBytes / storageUsage.totalQuotaBytes) * 100))}%` }} 
                    className="bg-purple-500 h-full" 
                    title="AI Assets"
                  />
                  <div 
                    style={{ width: `${Math.min(100, Math.round((storageUsage.usedTrashBytes / storageUsage.totalQuotaBytes) * 100))}%` }} 
                    className="bg-amber-500 h-full" 
                    title="Trash"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-[10px] text-neutral-500 pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Projects: {(storageUsage.usedProjectsBytes / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Backups: {(storageUsage.usedBackupsBytes / (1024 * 1024)).toFixed(0)} MB</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> AI Assets: {(storageUsage.usedGeneratedAssetsBytes / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Trash: {(storageUsage.usedTrashBytes / (1024 * 1024)).toFixed(0)} MB</span>
              </div>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-red-900 dark:text-red-200">Danger Zone</h4>
                  <p className="text-[11px] text-red-700/80 dark:text-red-300/70 mt-0.5">
                    Permanently delete your studio account, cloud snapshots, and AI credits.
                  </p>
                </div>
                {!showDeleteConfirm ? (
                  <button
                    disabled={isOwner}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    title={isOwner ? 'Owner account cannot be deleted' : 'Delete account'}
                  >
                    Delete Account
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {showDeleteConfirm && (
                <div className="pt-2 border-t border-red-200 dark:border-red-900/40 space-y-2">
                  <p className="text-[11px] text-red-800 dark:text-red-200 font-semibold">
                    Type DELETE in capital letters to confirm permanent account purge:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-neutral-900 font-mono text-xs text-red-900 dark:text-red-100"
                    />
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE'}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold rounded-lg"
                    >
                      Confirm Purge
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SECURITY CENTER */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Overview & Security Posture Card */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Studio Security & Cryptographic Protection
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Client-side salted SHA-256 hashing, rate-limiting guards & session authorization.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  SECURE • SHA-256
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="text-neutral-400 font-mono text-[9px] uppercase">Auth Provider</div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 capitalize mt-0.5">
                    {currentUser.authProvider || (currentUser.email.includes('gmail.com') ? 'Google Account' : 'Email/Password')}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="text-neutral-400 font-mono text-[9px] uppercase">Brute-Force Guard</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Active (Rate Limited)
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <div className="text-neutral-400 font-mono text-[9px] uppercase">Email Verification</div>
                  <div className="font-semibold mt-0.5 flex items-center gap-1">
                    {currentUser.emailVerified ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Verification Card */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-neutral-500" />
                    <span>Email Verification Status</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Verified emails protect your cloud snapshots and enable password recovery.
                  </p>
                </div>
                {currentUser.emailVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                    VERIFIED
                  </span>
                ) : (
                  <button
                    onClick={handleSendVerificationCode}
                    disabled={isSendingVerify}
                    className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors"
                  >
                    {isSendingVerify ? 'Sending...' : 'Send 6-Digit Code'}
                  </button>
                )}
              </div>

              {emailVerifyStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  emailVerifyStatus.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}>
                  {emailVerifyStatus.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{emailVerifyStatus.message}</span>
                </div>
              )}

              {/* Enter code if unverified */}
              {!currentUser.emailVerified && (
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                  {dispatchedVerifyCode && (
                    <div className="p-2 rounded bg-neutral-100 dark:bg-neutral-900 font-mono text-center text-xs">
                      Simulated Dispatch OTP: <strong className="text-rose-500">{dispatchedVerifyCode}</strong>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={e => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 font-mono text-xs flex-1 uppercase tracking-widest text-center"
                    />
                    <button
                      onClick={handleVerifyEmail}
                      disabled={isVerifyingCode || !verificationCode.trim()}
                      className="px-4 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg text-xs hover:opacity-90 disabled:opacity-50"
                    >
                      {isVerifyingCode ? 'Verifying...' : 'Verify Email'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Change Password Card */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
              <div>
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-neutral-500" />
                  <span>Update Account Password</span>
                </h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Passwords are securely salted and hashed with client-side SHA-256 before storage.
                </p>
              </div>

              {passwordChangeStatus && (
                <div className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  passwordChangeStatus.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                }`}>
                  {passwordChangeStatus.type === 'success' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{passwordChangeStatus.message}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                {/* Current password (if user already has passwordHash) */}
                {currentUser.passwordHash && (
                  <div>
                    <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-3 pr-10 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                      >
                        {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-10 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                    >
                      {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {newPassword.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-neutral-500">Strength:</span>
                        <span style={{ color: newPasswordStrength.color }} className="font-semibold">
                          {newPasswordStrength.label}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4].map(idx => (
                          <div
                            key={idx}
                            className="h-full flex-1 transition-all"
                            style={{
                              backgroundColor: idx <= newPasswordStrength.score ? newPasswordStrength.color : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-10 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                    >
                      {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPass || !newPassword}
                  className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-medium rounded-lg text-xs hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isChangingPass && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </form>
            </div>

            {/* Security Audit Activity Log */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span>Recent Security Audit Log</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Log of authentications, credential modifications and remote session revocations.
                  </p>
                </div>
                <button
                  onClick={handleSignOutOtherDevices}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Revoke Other Sessions
                </button>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {(!currentUser.securityEvents || currentUser.securityEvents.length === 0) ? (
                  <div className="p-4 text-center text-neutral-400 font-mono text-[11px]">
                    No historical security alerts. Account session is healthy.
                  </div>
                ) : (
                  currentUser.securityEvents.map(evt => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>{evt.description}</span>
                        </div>
                        <div className="text-neutral-400 font-mono text-[10px]">
                          {evt.device} • {evt.ip}
                        </div>
                      </div>
                      <span className="text-neutral-400 font-mono text-[10px] whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CREDIT LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
              <div>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  AI Credit Transaction Ledger
                </span>
                <p className="text-neutral-500 text-[11px]">
                  Complete verified audit history of all credit allocations, model usage and job refunds.
                </p>
              </div>
              <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Balance: {currentUser.aiCredits.toLocaleString()} Credits
              </span>
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-neutral-400">No transactions recorded yet.</div>
              ) : (
                transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {tx.reason}
                        </span>
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-neutral-400 text-[10px] font-mono mt-1">
                        {new Date(tx.timestamp).toLocaleString()} {tx.modelOrProvider && `• ${tx.modelOrProvider}`}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {tx.creditsAdded > 0 && (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm block">
                          +{tx.creditsAdded.toLocaleString()} Credits
                        </span>
                      )}
                      {tx.creditsConsumed > 0 && (
                        <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm block">
                          -{tx.creditsConsumed.toLocaleString()} Credits
                        </span>
                      )}
                      <span className="text-neutral-400 text-[10px] font-mono block">
                        Bal: {tx.balanceAfter.toLocaleString()} Credits
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CONNECTED DEVICES */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
              <div>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Registered Devices & Active Sessions
                </span>
                <p className="text-neutral-500 text-[11px]">
                  Manage client nodes authorized to sync cloud project revisions.
                </p>
              </div>
              <button
                onClick={handleSignOutOtherDevices}
                className="px-3 py-1.5 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out Other Sessions</span>
              </button>
            </div>

            <div className="space-y-2">
              {(currentUser.devices && currentUser.devices.length > 0 ? currentUser.devices : [
                {
                  id: 'dev-curr',
                  name: 'Current Browser Session',
                  platform: 'web' as const,
                  lastActiveAt: 'Active Now',
                  isCurrent: true,
                }
              ]).map(device => (
                <div
                  key={device.id}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {device.platform === 'macos' || device.platform === 'windows' || device.platform === 'linux' ? (
                        <Laptop className="w-4 h-4" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {device.name}
                        </span>
                        {device.isCurrent && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div className="text-neutral-400 text-[10px] font-mono mt-0.5">
                        {device.browser || 'Studio Web Node'} {device.ipLocation && `• ${device.ipLocation}`} • {device.lastActiveAt}
                      </div>
                    </div>
                  </div>

                  {!device.isCurrent && (
                    <span className="text-neutral-400 font-mono text-[10px]">Connected</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
