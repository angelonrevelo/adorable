import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-red-500/20 max-w-2xl w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
                <p className="text-slate-400 text-sm">An unexpected error occurred in the application</p>
              </div>
            </div>

            <div className="bg-black/20 rounded-xl p-4 mb-6 border border-white/5">
              <p className="text-red-300 font-mono text-sm mb-2">
                {this.state.error?.message || 'Unknown error'}
              </p>
              {this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-slate-400 text-xs cursor-pointer hover:text-slate-300">
                    View stack trace
                  </summary>
                  <pre className="text-slate-500 text-xs mt-2 overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>

            <p className="text-slate-500 text-xs text-center mt-4">
              If this error persists, please refresh the page or contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
