import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page" style={{ padding: 40, textAlign: 'center' }}>
          <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>💥</div>
            <h2 style={{ color: 'var(--accent-red)' }}>Component Crash</h2>
            <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>
              We encountered an unexpected error while rendering this part of the application.
            </p>
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: 16, 
              borderRadius: 8, 
              textAlign: 'left',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              marginBottom: 24,
              overflowX: 'auto',
              color: '#ef4444'
            }}>
              {this.state.error?.toString()}
            </div>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              🔄 Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
