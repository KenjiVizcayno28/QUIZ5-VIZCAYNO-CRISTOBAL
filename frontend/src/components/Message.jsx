import React from 'react';
import '../styles/ui.css';

function Message({ type = 'error', children }) {
  if (!children) {
    return null;
  }

  return <div className={`message message-${type}`}>{children}</div>;
}

export default Message;
