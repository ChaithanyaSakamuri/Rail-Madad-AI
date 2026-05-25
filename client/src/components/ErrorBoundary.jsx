import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: 'red', color: 'white', padding: '20px', zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
          <h1>React Crashed</h1>
          <p>{this.state.error?.toString()}</p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
