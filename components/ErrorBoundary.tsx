import React, { ErrorInfo, ReactNode, Component } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 text-slate-200 p-6">
          <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="mx-auto w-12 h-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Module Encountered an Error</h2>
            <p className="text-sm text-slate-400">
              We encountered an unexpected issue loading this clinical module. Your data is safe.
            </p>
            <div className="pt-4">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Module
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
