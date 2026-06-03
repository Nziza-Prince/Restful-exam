import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './authSlice';

describe('authSlice', () => {
  it('logout clears auth state', async () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: { id: '1', fullName: 'Test', email: 't@t.com', role: 'ADMIN' },
          isAuthenticated: true,
          loading: false,
          initializing: false,
          error: null,
        },
      },
    });

    await store.dispatch(logout());
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
