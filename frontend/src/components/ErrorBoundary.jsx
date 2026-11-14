import React from 'react';

/**
 * ErrorBoundary
 * Catches runtime React render exceptions and dynamic import (chunk load) failures.
 * Automatically recovers from version deployment mismatches with a controlled single reload.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error / Dynamic Import Failure:', error, errorInfo);
    
    // Check if error is caused by missing chunk after a deployment
    const isChunkError = 
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('dynamically imported module') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('Loading chunk');

    if (isChunkError && typeof window !== 'undefined') {
      const alreadyRetried = sessionStorage.getItem('gkp_chunk_retry');
      if (!alreadyRetried) {
        sessionStorage.setItem('gkp_chunk_retry', 'true');
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gkp_chunk_retry');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          background: '#F5F8F7',
          color: '#101828',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            background: '#FFFFFF',
            padding: '32px',
            borderRadius: '16px',
            maxWidth: '480px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            border: '1px solid #E3EBE8'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#008A60' }}>
              Connection Updated
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
              A newer version of GharKaPaisa is available or your network connection was interrupted. Please refresh to load the latest version.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: '#008A60',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
