import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  extinguisherService,
  type CreateExtinguisherPayload,
  type UpdateExtinguisherPayload,
} from '@/services/extinguisherService';
import type { ExtinguisherFilters, FireExtinguisher, PaginatedResult } from '@/types';

interface ExtinguisherState {
  items: FireExtinguisher[];
  meta: PaginatedResult<FireExtinguisher>['meta'] | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: ExtinguisherState = {
  items: [],
  meta: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchExtinguishers = createAsyncThunk(
  'extinguishers/fetchAll',
  async (
    params: ExtinguisherFilters & { scope: 'admin' | 'customer' },
    { rejectWithValue },
  ) => {
    try {
      const { scope, ...filters } = params;
      return scope === 'admin'
        ? await extinguisherService.listAll(filters)
        : await extinguisherService.listMine(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const createExtinguisher = createAsyncThunk(
  'extinguishers/create',
  async (payload: CreateExtinguisherPayload, { rejectWithValue }) => {
    try {
      return await extinguisherService.create(payload);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const updateExtinguisher = createAsyncThunk(
  'extinguishers/update',
  async (
    { id, payload }: { id: string; payload: UpdateExtinguisherPayload },
    { rejectWithValue },
  ) => {
    try {
      return await extinguisherService.update(id, payload);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const deleteExtinguisher = createAsyncThunk(
  'extinguishers/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await extinguisherService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const buyExtinguisher = createAsyncThunk(
  'extinguishers/buy',
  async (id: string, { rejectWithValue }) => {
    try {
      return await extinguisherService.buy(id);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const assignExtinguisher = createAsyncThunk(
  'extinguishers/assign',
  async ({ id, customerId }: { id: string; customerId: string }, { rejectWithValue }) => {
    try {
      return await extinguisherService.assign(id, customerId);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const extinguisherSlice = createSlice({
  name: 'extinguishers',
  initialState,
  reducers: {
    clearExtinguisherError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExtinguishers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExtinguishers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchExtinguishers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createExtinguisher.pending, (state) => {
        state.saving = true;
      })
      .addCase(createExtinguisher.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createExtinguisher.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(updateExtinguisher.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateExtinguisher.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deleteExtinguisher.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(buyExtinguisher.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(buyExtinguisher.fulfilled, (state, action) => {
        state.saving = false;
        state.items = state.items.filter((item) => item.id !== action.payload.id);
      })
      .addCase(buyExtinguisher.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(assignExtinguisher.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(assignExtinguisher.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(assignExtinguisher.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearExtinguisherError } = extinguisherSlice.actions;
export default extinguisherSlice.reducer;
