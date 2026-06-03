import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';
import type { LoginPayload, RegisterPayload, User } from '@/types';
import { tokenStorage } from '@/utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  initializing: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!tokenStorage.getAccessToken(),
  loading: false,
  initializing: !!tokenStorage.getAccessToken(),
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const data = await authService.login(payload);
      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setRefreshToken(data.refreshToken);
      return data.user;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const data = await authService.register(payload);
      tokenStorage.setAccessToken(data.accessToken);
      tokenStorage.setRefreshToken(data.refreshToken);
      return data.user;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getMe();
    } catch (error) {
      tokenStorage.clear();
      return rejectWithValue((error as Error).message);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  const refreshToken = tokenStorage.getRefreshToken();
  if (refreshToken) {
    try {
      await authService.logout(refreshToken);
    } catch {
      // ignore logout errors
    }
  }
  tokenStorage.clear();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    sessionExpired: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      tokenStorage.clear();
    },
    setCredentials: (state, action: { payload: { user: User; accessToken: string; refreshToken: string } }) => {
      tokenStorage.setAccessToken(action.payload.accessToken);
      tokenStorage.setRefreshToken(action.payload.refreshToken);
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.initializing = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.initializing = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.initializing = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { clearAuthError, sessionExpired, setCredentials } = authSlice.actions;
export default authSlice.reducer;
