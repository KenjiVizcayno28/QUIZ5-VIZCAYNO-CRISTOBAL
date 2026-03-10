import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/home.css';

function EmptyState({ isGuest = false }) {
  return (
    <section className="empty-state" aria-label="Welcome screen">
      {isGuest ? (
        <>
          <h2>Welcome to HAIKU Bot</h2>
          <p>
            You are browsing as a guest. Please login to use the prompting feature and start a conversation.
          </p>
          <div className="empty-state-actions">
            <Link to="/login" className="empty-state-btn primary">
              Login
            </Link>
            <Link to="/register" className="empty-state-btn secondary">
              Register
            </Link>
          </div>
        </>
      ) : (
        <>
          <h2>Welcome to HAIKU Bot</h2>
          <p>Start a new chat from the left sidebar to generate your first haiku.</p>
        </>
      )}
    </section>
  );
}

export default EmptyState;
