import React from 'react';
import '../styles/ui.css';

function Loader() {
  return (
    <div className="loader-wrap" role="status" aria-live="polite" aria-label="Loading">
      <span className="loader-spinner" />
    </div>
  );
}

export default Loader;
