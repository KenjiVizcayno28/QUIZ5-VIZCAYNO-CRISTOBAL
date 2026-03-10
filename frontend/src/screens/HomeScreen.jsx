import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ConversationItem from '../components/ConversationItem';
import EmptyState from '../components/EmptyState';
import { addConversation, logout, setActiveConversation } from '../store';
import '../styles/home.css';

function HomeScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { items, activeId } = useSelector((state) => state.conversation);

  const activeConversation = useMemo(
    () => items.find((item) => item.id === activeId),
    [items, activeId]
  );

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
        ) : !activeConversation ? (
          <EmptyState />
        ) : (
          <section className="conversation-panel" aria-label="Active conversation">
            <h2>{activeConversation.title}</h2>
            <p>{activeConversation.preview}</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default HomeScreen;
