import { configureStore, createAsyncThunk, createSlice, nanoid } from '@reduxjs/toolkit';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';

const safeParseToken = () => {
  try {
    const raw = localStorage.getItem('accessToken');
    return raw || null;
  } catch (error) {
    return null;
  }
};

const persistToken = (token) => {
  if (token) {
    localStorage.setItem('accessToken', token);
    return;
  }

  localStorage.removeItem('accessToken');
};

const decodeTokenPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return {};
  }
};

const safeParseUser = () => {
  try {
    const raw = localStorage.getItem('userInfo');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const persistUser = (user) => {
  if (user) {
    localStorage.setItem('userInfo', JSON.stringify(user));
    return;
  }

  localStorage.removeItem('userInfo');
};

const defaultConversations = [
  {
    id: 'welcome-thread',
    title: 'Welcome to HAIKU Bot',
    preview: 'Ask anything and start your first conversation.',
    messages: [],
  },
];

const safeParseConversations = () => {
  try {
    const raw = localStorage.getItem('conversations');
    if (!raw) {
      return defaultConversations;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultConversations;
    }

    return parsed.map((item) => ({
      id: item.id,
      title: item.title || 'New conversation',
      preview: item.preview || 'Start chatting with the HAIKU Bot.',
      messages: Array.isArray(item.messages) ? item.messages : [],
    }));
  } catch (error) {
    return defaultConversations;
  }
};

const persistConversations = (items) => {
  localStorage.setItem('conversations', JSON.stringify(items));
};

const mapApiConversationToUi = (conversation) => {
  const normalizedMessages = Array.isArray(conversation.messages)
    ? conversation.messages.map((message) => ({
        role: message.role === 'assistant' ? 'ai' : 'user',
        text: message.content,
      }))
    : [];

  const lastUserMessage = [...normalizedMessages].reverse().find((item) => item.role === 'user');

  return {
    id: String(conversation.id),
    title: conversation.title || 'New conversation',
    preview: lastUserMessage?.text?.slice(0, 60) || 'Start chatting with the HAIKU Bot.',
    messages: normalizedMessages,
  };
};

export const fetchUserConversations = createAsyncThunk(
  'conversation/fetchUserConversations',
  async (_, thunkAPI) => {
    const token = thunkAPI.getState().auth.accessToken;
    if (!token) {
      return thunkAPI.rejectWithValue('Missing access token.');
    }

    try {
      const response = await fetch(`${API_BASE}/api/v1/conversations/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to load conversations.');
      }

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to load conversations.');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, thunkAPI) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/signin/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Invalid credentials.');
      }

      const accessToken = data.access;
      const refreshToken = data.refresh;
      if (!accessToken) {
        throw new Error('Login succeeded but no access token was returned.');
      }

      const tokenPayload = decodeTokenPayload(accessToken);

      return {
        user: {
          username: tokenPayload.username || username,
          email: tokenPayload.email || '',
          name: tokenPayload.username || username,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Login failed.');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ username, email, password }, thunkAPI) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const firstError =
          (data.username && data.username[0]) ||
          (data.email && data.email[0]) ||
          (data.password && data.password[0]);
        throw new Error(firstError || data.detail || data.error || 'Unable to register.');
      }

      const loginResponse = await fetch(`${API_BASE}/api/v1/auth/signin/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        throw new Error(loginData.detail || 'Registered, but auto-login failed. Please sign in.');
      }

      const accessToken = loginData.access;
      const refreshToken = loginData.refresh;
      if (!accessToken) {
        throw new Error('Registered, but no access token was returned.');
      }

      const tokenPayload = decodeTokenPayload(accessToken);

      return {
        user: {
          username: tokenPayload.username || data.username || username,
          email: tokenPayload.email || data.email || email,
          name: tokenPayload.username || data.username || username,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Registration failed.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userInfo: safeParseUser(),
    accessToken: safeParseToken(),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.accessToken = null;
      state.error = null;
      persistUser(null);
      persistToken(null);
    },
    loginBypass: (state) => {
      const bypassUser = {
        name: 'Guest User',
        email: 'guest@local.dev',
        username: 'guest',
        bypass: true,
      };

      state.userInfo = bypassUser;
      state.accessToken = null;
      state.error = null;
      persistUser(bypassUser);
      persistToken(null);
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload.user;
        state.accessToken = action.payload.accessToken;
        persistUser(action.payload.user);
        persistToken(action.payload.accessToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed.';
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload.user;
        state.accessToken = action.payload.accessToken;
        persistUser(action.payload.user);
        persistToken(action.payload.accessToken);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed.';
      });
  },
});

const initialConversations = safeParseConversations();

const conversationSlice = createSlice({
  name: 'conversation',
  initialState: {
    items: initialConversations,
    activeId: initialConversations[0]?.id || null,
    loading: false,
    error: null,
  },
  reducers: {
    addConversation: {
      reducer: (state, action) => {
        state.items.unshift(action.payload);
        state.activeId = action.payload.id;
        persistConversations(state.items);
      },
      prepare: () => ({
        payload: {
          id: `local-${nanoid()}`,
          title: 'New conversation',
          preview: 'Start chatting with the HAIKU Bot.',
          messages: [],
        },
      }),
    },
    setActiveConversation: (state, action) => {
      state.activeId = action.payload;
    },
    appendConversationMessage: (state, action) => {
      const { conversationId, role, text } = action.payload;
      const conversation = state.items.find((item) => item.id === conversationId);

      if (!conversation) {
        return;
      }

      if (!Array.isArray(conversation.messages)) {
        conversation.messages = [];
      }

      conversation.messages.push({ role, text });

      if (role === 'user') {
        if (conversation.title === 'New conversation') {
          conversation.title = text.slice(0, 40);
        }

        conversation.preview = text.slice(0, 60);
      }

      persistConversations(state.items);
    },
    mergeConversationFromServer: (state, action) => {
      const { conversation, clientTempId } = action.payload;
      const mapped = mapApiConversationToUi(conversation);
      const existingIndex = state.items.findIndex((item) => item.id === mapped.id);
      const tempIndex = clientTempId
        ? state.items.findIndex((item) => item.id === clientTempId)
        : -1;

      if (existingIndex >= 0) {
        state.items[existingIndex] = mapped;
      } else if (tempIndex >= 0) {
        state.items[tempIndex] = mapped;
      } else {
        state.items.unshift(mapped);
      }

      state.activeId = mapped.id;
      persistConversations(state.items);
    },
    setConversationsFromServer: (state, action) => {
      const mapped = action.payload.map(mapApiConversationToUi);
      state.items = mapped;
      if (mapped.length === 0) {
        state.activeId = null;
      } else if (!mapped.some((item) => item.id === state.activeId)) {
        state.activeId = mapped[0].id;
      }
      persistConversations(state.items);
    },
    clearConversations: (state) => {
      state.items = defaultConversations.map((item) => ({ ...item, messages: [] }));
      state.activeId = state.items[0]?.id || null;
      state.error = null;
      persistConversations(state.items);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserConversations.fulfilled, (state, action) => {
        const mapped = action.payload.map(mapApiConversationToUi);
        state.loading = false;
        state.error = null;
        state.items = mapped;
        if (mapped.length === 0) {
          state.activeId = null;
        } else if (!mapped.some((item) => item.id === state.activeId)) {
          state.activeId = mapped[0].id;
        }
        persistConversations(state.items);
      })
      .addCase(fetchUserConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load conversations.';
      });
  },
});

export const { logout, loginBypass, clearAuthError } = authSlice.actions;
export const {
  addConversation,
  setActiveConversation,
  appendConversationMessage,
  mergeConversationFromServer,
  setConversationsFromServer,
  clearConversations,
} =
  conversationSlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    conversation: conversationSlice.reducer,
  },
});

export default store;
