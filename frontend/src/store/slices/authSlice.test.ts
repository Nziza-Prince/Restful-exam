import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './authSlice';

describe('authSlice', () => {
  it('logout clears auth state', async () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: {
            id: '1',
            firstName: 'Test',
            lastName: 'User',
            fullName: 'Test User',
            email: 't@t.com',
            role: 'admin' as const,
            createdAt: '2026-06-03T00:00:00.000Z',
            updatedAt: '2026-06-03T00:00:00.000Z',
          },
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
