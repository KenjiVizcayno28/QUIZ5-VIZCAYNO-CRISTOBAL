import React from 'react';
import '../styles/home.css';

function ConversationItem({ conversation, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={() => onClick(conversation.id)}
    >
      <span className="conversation-title">{conversation.title}</span>
      <span className="conversation-preview">{conversation.preview}</span>
    </button>
  );
}

export default ConversationItem;
