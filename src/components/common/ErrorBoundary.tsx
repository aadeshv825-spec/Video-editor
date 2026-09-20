import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, Copy, Check, RotateCcw } from 'lucide-react';
import { ErrorMonitoringService } from '../../services/recovery/errorMonitoringService';

interface Props {
  children: ReactNode;
  moduleName?: string;
  fallbackView?: 'fullscreen' | 'panel';
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const moduleName = this.props.moduleName || 'StudioRoot';
    console.error(`VYRO Studio Exception in [${moduleName}]:`, error, errorInfo);
    this.setState({ errorInfo });

    ErrorMonitoringService.reportError({
      category: 'runtime',
      message: error.message || 'React component render crash',
      affectedModule: moduleName,
      recoveryResult: 'action_required',
      recoveryActionTaken: 'Isolated module boundary. User projects and state preserved safely.',
      details: {
        componentStack: errorInfo.componentStack?.substring(0, 300),
      },
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleSafeRecovery = () => {
    try {
      // Clear volatile active session pointers while keeping stored projects safe
      sessionStorage.clear();
      // Reload back to dashboard root
      window.location.href = window.location.origin + window.location.pathname;
    } catch {
      window.location.reload();
    }
  };

  private handleCopyDiagnostics = () => {
    const report = {
      module: this.props.moduleName || 'Global',
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      const isPanel = this.props.fallbackView === 'panel';

      if (isPanel) {
        return (
          <div className="w-full h-full min-h-[300px] flex items-center justify-center p-4 select-none">
            <div className="max-w-md w-full p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-studio-surface shadow-lg text-center space-y-4">
              <div className="w-10 h-10 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {this.props.moduleName || 'Workspace Module'} Interrupted
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  A rendering fault was safely isolated. Your saved work is secure in local and cloud storage.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 text-left font-mono text-[11px] text-neutral-600 dark:text-neutral-400 max-h-24 overflow-y-auto">
                <span className="text-rose-500 font-semibold">Fault:</span> {this.state.error?.message || 'Interface glitch'}
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={this.handleRetry}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Module</span>
                </button>
                <button
                  onClick={this.handleCopyDiagnostics}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{this.state.copied ? 'Copied' : 'Diagnostics'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-neutral-100 dark:bg-studio-base text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-4 sm:p-6 select-none">
          <div className="max-w-lg w-full bg-white dark:bg-studio-surface border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Something interrupted the studio
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
                An unexpected interface exception occurred. Your projects and cloud snapshots remain safely stored in persistent storage.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-neutral-800 text-left font-mono text-[11px] text-neutral-700 dark:text-neutral-400 max-h-32 overflow-y-auto">
              <span className="text-rose-500 font-bold">Error:</span> {this.state.error?.message || 'Unknown runtime fault'}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Studio</span>
              </button>

              <button
                onClick={this.handleSafeRecovery}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Return to Dashboard</span>
              </button>

              <button
                onClick={this.handleCopyDiagnostics}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Copy error details for diagnostics"
              >
                {this.state.copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{this.state.copied ? 'Copied' : 'Diagnostics'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
