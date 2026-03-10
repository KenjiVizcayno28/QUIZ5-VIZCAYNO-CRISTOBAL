import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ConversationItem from '../components/ConversationItem';
import EmptyState from '../components/EmptyState';
import { addConversation, appendConversationMessage, logout, setActiveConversation } from '../store';
import '../styles/home.css';

function HomeScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { items, activeId } = useSelector((state) => state.conversation);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const activeConversation = items.find((item) => item.id === activeId);
  const messages = activeConversation?.messages || [];

  const onLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const onNewChat = () => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    dispatch(addConversation());
  };

  const onSelectConversation = (id) => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    dispatch(setActiveConversation(id));
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading || !activeId) {
      return;
    }

    dispatch(
      appendConversationMessage({
        conversationId: activeId,
        role: 'user',
        text: trimmedMessage,
      })
    );
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedMessage, history: messages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      dispatch(
        appendConversationMessage({
          conversationId: activeId,
          role: 'ai',
          text: data.reply,
        })
      );
    } catch (error) {
      dispatch(
        appendConversationMessage({
          conversationId: activeId,
          role: 'ai',
          text: error.message || 'Failed to contact server.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-shell">
      <aside className="home-sidebar">
        <div className="sidebar-top">
          <button className="new-chat-btn" type="button" onClick={onNewChat}>
            <span className="new-chat-icon">+</span>
            <span>{userInfo ? 'New chat' : 'Login to prompt'}</span>
          </button>
        </div>

        <div className="conversation-list-wrap">
          {items.length === 0 ? (
            <div className="sidebar-history-placeholder">
              <p>History is temporarily unavailable.</p>
              <p>We are working to restore this feature as soon as possible.</p>
            </div>
          ) : (
            <div className="conversation-list">
              {items.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === activeId}
                  onClick={onSelectConversation}
                />
              ))}
            </div>
          )}
        </div>

        <nav className="sidebar-bottom" aria-label="Sidebar menu">
          <button className="sidebar-link" type="button">
            <span className="sidebar-icon">◎</span>
            <span>Upgrade to Plus</span>
            <span className="pill">Soon</span>
          </button>

         


          <button className="sidebar-link" type="button" onClick={onLogout}>
            <span className="sidebar-icon">↩</span>
            <span>Log out</span>
          </button>
        </nav>
      </aside>

      <main className="home-main">
        <header className="home-main-header">
          <h1>Hi, {userInfo ? userInfo.name || userInfo.email || 'User' : 'Guest'}</h1>
        </header>

        {!userInfo ? (
          <EmptyState isGuest />
        ) : (
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
        )}
      </main>
    </div>
  );
}

export default HomeScreen;
