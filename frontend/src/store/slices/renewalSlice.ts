import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  renewalService,
  type CompleteRenewalPayload,
  type CreateRenewalPayload,
  type RejectRenewalPayload,
} from '@/services/renewalService';
import type { PaginatedResult, RenewalFilters, RenewalRequest } from '@/types';

interface RenewalState {
  items: RenewalRequest[];
  meta: PaginatedResult<RenewalRequest>['meta'] | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: RenewalState = {
  items: [],
  meta: null,
  loading: false,
  saving: false,
  error: null,
};

export const fetchRenewals = createAsyncThunk(
  'renewals/fetchAll',
  async (
    params: RenewalFilters & { scope: 'admin' | 'customer' },
    { rejectWithValue },
  ) => {
    try {
      const { scope, ...filters } = params;
      return scope === 'admin'
        ? await renewalService.listAll(filters)
        : await renewalService.listMine(filters);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const createRenewal = createAsyncThunk(
  'renewals/create',
  async (payload: CreateRenewalPayload, { rejectWithValue }) => {
    try {
      return await renewalService.create(payload);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const approveRenewal = createAsyncThunk(
  'renewals/approve',
  async (id: string, { rejectWithValue }) => {
    try {
      return await renewalService.approve(id);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const rejectRenewal = createAsyncThunk(
  'renewals/reject',
  async (
    { id, payload }: { id: string; payload: RejectRenewalPayload },
    { rejectWithValue },
  ) => {
    try {
      return await renewalService.reject(id, payload);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

export const completeRenewal = createAsyncThunk(
  'renewals/complete',
  async (
    { id, payload }: { id: string; payload: CompleteRenewalPayload },
    { rejectWithValue },
  ) => {
    try {
      return await renewalService.complete(id, payload);
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const renewalSlice = createSlice({
  name: 'renewals',
  initialState,
  reducers: {
    clearRenewalError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRenewals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRenewals.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchRenewals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createRenewal.pending, (state) => {
        state.saving = true;
      })
      .addCase(createRenewal.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(approveRenewal.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(rejectRenewal.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(completeRenewal.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index >= 0) state.items[index] = action.payload;
      });
  },
});

export const { clearRenewalError } = renewalSlice.actions;
export default renewalSlice.reducer;
