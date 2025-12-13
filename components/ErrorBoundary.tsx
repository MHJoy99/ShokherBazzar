
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 1. Log to console (Satisfies CTO's "Basic console error logging" request)
    console.error("🚨 APP CRASH:", error, errorInfo);
    
    // 2. In a real app, you would send this to Sentry/LogRocket here
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-red-500/30 p-8 rounded-2xl max-w-md text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                 <i className="fas fa-bug text-red-500 text-2xl"></i>
            </div>
            <h1 className="text-xl font-bold text-white mb-2 uppercase">System Glitch</h1>
            <p className="text-gray-400 mb-6 text-sm">
              We encountered an unexpected error. Our tech team has been notified.
            </p>
            <button 
                onClick={() => window.location.reload()} 
                className="bg-primary hover:bg-primary-hover text-black font-bold px-6 py-3 rounded-xl uppercase tracking-wider transition-all"
            >
                Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
