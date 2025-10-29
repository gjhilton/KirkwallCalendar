import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#fee',
          border: '2px solid #c00',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#c00' }}>Something went wrong!</h2>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
              Click to see error details
            </summary>
            <div style={{
              backgroundColor: '#fff',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflow: 'auto'
            }}>
              <p><strong>Error:</strong></p>
              <p>{this.state.error && this.state.error.toString()}</p>
              <p style={{ marginTop: '10px' }}><strong>Component Stack:</strong></p>
              <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
            </div>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
