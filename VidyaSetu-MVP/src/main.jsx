import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="crash-fallback">
          <section>
            <strong>VidyaSetu hit a temporary screen error.</strong>
            <p>The learner data is safe. Refresh once and continue; the app now prevents blank screens after failed model/API responses.</p>
            <button onClick={() => window.location.reload()}>Reload VidyaSetu</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
