import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// FIX: Refactored to use a constructor for state initialization. This approach is more traditional and can resolve subtle issues with build toolchains that may not fully support class field syntax, which was causing a misleading error where `this.props` was not recognized.
class ErrorBoundary extends React.Component<Props, State> {
  // FIX: The 'state' property is inherited from React.Component and initialized in the constructor.
  // An explicit declaration here is redundant and was causing type resolution issues.

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-brand-bg text-brand-text">
            <div className="text-center bg-brand-primary p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-red-400 mb-4">Oops! Algo deu errado.</h1>
                <p className="text-brand-text-muted mb-6">Ocorreu um erro inesperado no aplicativo.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-brand-secondary hover:brightness-110 text-brand-primary font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Recarregar a página
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;