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

const initialConversations = [
  {
    id: 'welcome-thread',
    title: 'Welcome to HAIKU Bot',
    preview: 'Ask anything and start your first conversation.',
  },
];

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
      },
      prepare: () => ({
        payload: {
          id: nanoid(),
          title: 'New conversation',
          preview: 'Start chatting with the HAIKU Bot.',
        },
      }),
    },
    setActiveConversation: (state, action) => {
      state.activeId = action.payload;
    },
    clearConversations: (state) => {
      state.items = [];
      state.activeId = null;
    },
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export const { addConversation, setActiveConversation, clearConversations } =
  conversationSlice.actions;

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    conversation: conversationSlice.reducer,
  },
});

export default store;
