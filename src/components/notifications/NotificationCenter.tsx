import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Cloud, 
  CreditCard, 
  Layers, 
  Film, 
  Trash2, 
  Check 
} from 'lucide-react';
import { NotificationCategory, StudioNotification, useNotifications } from '../../context/NotificationContext';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPro?: () => void;
  onNavigateToCloud?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateToPro,
  onNavigateToCloud,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter(n => {
    if (selectedFilter === 'all') return true;
    return n.category === selectedFilter;
  });

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'ai':
        return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
      case 'render':
        return <Film className="w-3.5 h-3.5 text-purple-500" />;
      case 'backup':
      case 'sync':
        return <Cloud className="w-3.5 h-3.5 text-emerald-500" />;
      case 'subscription':
        return <CreditCard className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/40 backdrop-blur-xs">
      <div 
        id="notification-center-drawer"
        className="w-full max-w-md bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col text-xs mt-12 animate-in fade-in slide-in-from-right-4 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <span>Studio Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-mono text-[10px]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Live alerts for AI jobs, renders, backups & subscriptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          {['all', 'ai', 'render', 'backup', 'subscription', 'sync'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-2.5 py-1 rounded-lg capitalize shrink-0 font-medium transition-colors ${
                selectedFilter === cat
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {filtered.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-neutral-400 space-y-1">
              <Bell className="w-8 h-8 opacity-30" />
              <span>No notifications in this category</span>
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-3 rounded-xl border transition-all text-xs space-y-1.5 cursor-pointer ${
                  !item.read
                    ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-800/40'
                    : 'border-neutral-200/80 dark:border-neutral-800/60 bg-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(item.category)}
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {item.title}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                  {item.message}
                </p>

                {item.actionLabel && (
                  <div className="pt-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (item.category === 'subscription' && onNavigateToPro) {
                          onClose();
                          onNavigateToPro();
                        } else if ((item.category === 'backup' || item.category === 'sync') && onNavigateToCloud) {
                          onClose();
                          onNavigateToCloud();
                        }
                      }}
                      className="text-[11px] font-bold text-neutral-900 dark:text-white underline hover:opacity-80"
                    >
                      {item.actionLabel} →
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1 disabled:opacity-40"
          >
            <Check className="w-3 h-3" />
            <span>Mark all read</span>
          </button>

          <button
            onClick={clearNotifications}
            disabled={notifications.length === 0}
            className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 disabled:opacity-40"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const NotificationToast: React.FC = () => {
  const { activeToast, dismissToast } = useNotifications();

  if (!activeToast) return null;

  return (
    <div 
      id="notification-transient-toast"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full p-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-2xl border border-neutral-800 dark:border-neutral-200 flex items-start justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="space-y-0.5">
        <div className="font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{activeToast.title}</span>
        </div>
        <p className="text-[11px] opacity-90 leading-snug">
          {activeToast.message}
        </p>
      </div>

      <button
        onClick={dismissToast}
        className="p-1 opacity-70 hover:opacity-100"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
