import React, { useState } from 'react';
import './chat.css';

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading) {
      return;
    }

    const userMessage = { role: 'user', text: trimmedMessage };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setMessages((prev) => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: error.message || 'Failed to contact server.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <div className="sidebar-top">
          <button className="new-chat-btn" type="button">
            <span className="new-chat-icon">+</span>
            <span>New chat</span>
          </button>
        </div>

        <div className="sidebar-history-placeholder">
          <p>History is temporarily unavailable.</p>
          <p>We&apos;re working to restore this feature as soon as possible.</p>
        </div>

        <nav className="sidebar-bottom" aria-label="Sidebar menu">
          <button className="sidebar-link" type="button">
            <span className="sidebar-icon">◎</span>
            <span>Upgrade to Plus</span>
            <span className="pill">NEW</span>
          </button>

          <button className="sidebar-link" type="button">
            <span className="sidebar-icon">☼</span>
            <span>Light mode</span>
          </button>

          <button className="sidebar-link" type="button">
            <span className="sidebar-icon">↗</span>
            <span>Updates &amp; FAQ</span>
          </button>

          <button className="sidebar-link" type="button">
            <span className="sidebar-icon">↩</span>
            <span>Log out</span>
          </button>
        </nav>
      </aside>

      <main className="chat-main">
        <div className="chat-card">
          <h1>The HAIKU Bot</h1>

          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="placeholder">creates you a beautiful HAIKU.</p>
            )}

            {messages.map((item, index) => (
              <div key={index} className={`bubble ${item.role}`}>
                {item.text}
              </div>
            ))}
          </div>

          <form className="chat-form" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your message"
              disabled={loading}
            />
            <button type="submit" disabled={loading || !message.trim()}>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Chat;
