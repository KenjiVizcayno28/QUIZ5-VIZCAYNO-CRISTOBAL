import { configureStore, createAsyncThunk, createSlice, nanoid } from '@reduxjs/toolkit';

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

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, thunkAPI) => {
    try {
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      return data.user || { name: username || 'User' };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Login failed.');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password }, thunkAPI) => {
    try {
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to register.');
      }

      return data.user || { name, email };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || 'Registration failed.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userInfo: safeParseUser(),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.error = null;
      persistUser(null);
    },
    loginBypass: (state) => {
      const bypassUser = {
        name: 'Guest User',
        email: 'guest@local.dev',
        bypass: true,
      };

      state.userInfo = bypassUser;
      state.error = null;
      persistUser(bypassUser);
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
        state.userInfo = action.payload;
        persistUser(action.payload);
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
        state.userInfo = action.payload;
        persistUser(action.payload);
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
          id: nanoid(),
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
    clearConversations: (state) => {
      state.items = defaultConversations.map((item) => ({ ...item, messages: [] }));
      state.activeId = state.items[0]?.id || null;
      persistConversations(state.items);
    },
  },
});

export const { logout, loginBypass, clearAuthError } = authSlice.actions;
export const { addConversation, setActiveConversation, appendConversationMessage, clearConversations } =
  conversationSlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    conversation: conversationSlice.reducer,
  },
});

export default store;
