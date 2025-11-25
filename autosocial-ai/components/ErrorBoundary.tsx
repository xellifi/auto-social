import React from 'react';

type State = {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
};

export default class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console (Vite overlay still appears in dev)
    // but we also store state to render a friendly UI.
    // In a real app you'd send this to an error-logging service.
    // eslint-disable-next-line no-console
    console.error('Uncaught render error:', error, info);
    this.setState({ error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2 style={{ color: '#ef4444' }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#f8fafc', background: '#0f172a', padding: 12, borderRadius: 8 }}>
            {this.state.error?.message}
            {this.state.info ? '\n\n' + (this.state.info.componentStack || '') : ''}
          </pre>
          <p style={{ color: '#94a3b8' }}>Check the browser console for details.</p>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
