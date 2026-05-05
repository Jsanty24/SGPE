import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8"
          style={{ background: 'var(--dark-bg, #0a0a0f)', color: 'var(--text-color, #f1f5f9)' }}>
          <div className="text-6xl mb-6">💥</div>
          <h1 className="text-2xl font-bold mb-3">Algo salió mal</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-color, #94a3b8)' }}>
            Ocurrió un error inesperado. Intenta recargar la página.
          </p>
          <details className="mb-6 max-w-lg w-full">
            <summary className="cursor-pointer text-sm font-medium" style={{ color: 'var(--muted-color)' }}>
              Detalles técnicos
            </summary>
            <pre className="mt-2 p-4 rounded-xl text-xs overflow-auto"
              style={{ background: 'var(--glass-bg, rgba(17,17,24,0.8))', border: '1px solid var(--glass-border, #1e1e2e)' }}>
              {this.state.error?.message}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </details>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-6 py-3 rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
