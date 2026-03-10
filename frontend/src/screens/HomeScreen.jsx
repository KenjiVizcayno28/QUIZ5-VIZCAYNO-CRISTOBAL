import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ConversationItem from '../components/ConversationItem';
import EmptyState from '../components/EmptyState';
import {
  addConversation,
  appendConversationMessage,
  clearConversations,
  fetchUserConversations,
  logout,
  mergeConversationFromServer,
  setActiveConversation,
} from '../store';
import '../styles/home.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

function HomeScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, accessToken } = useSelector((state) => state.auth);
  const { items, activeId } = useSelector((state) => state.conversation);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const activeConversation = items.find((item) => item.id === activeId);
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    if (userInfo?.bypass || !accessToken) {
      return;
    }

    dispatch(fetchUserConversations());
  }, [dispatch, userInfo, accessToken]);

  const onLogout = () => {
    dispatch(logout());
    dispatch(clearConversations());
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
      const response = await fetch(`${API_BASE}/api/v1/conversation/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          message: trimmedMessage,
          ...(activeId && !String(activeId).startsWith('local-')
            ? { conversation_id: Number(activeId) }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Something went wrong.');
      }

      dispatch(
        mergeConversationFromServer({
          conversation: data,
          clientTempId: String(activeId).startsWith('local-') ? activeId : null,
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
