import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationService } from '@/services/notificationService';
import type { Notification, NotificationFilters, PaginatedResult } from '@/types';

interface NotificationState {
  items: Notification[];
  meta: PaginatedResult<Notification>['meta'] | null;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (
    params: NotificationFilters & { scope: 'admin' | 'customer' },
    { rejectWithValue },
  ) => {
    try {
      const { scope, ...filters } = params;
      return scope === 'admin'
        ? await notificationService.listAll(filters)
        : await notificationService.listMine(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (
    { id, isAdmin }: { id: string; isAdmin: boolean },
    { rejectWithValue },
  ) => {
    try {
      return await notificationService.markRead(id, isAdmin);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
